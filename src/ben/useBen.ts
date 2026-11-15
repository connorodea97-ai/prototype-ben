import { useCallback, useEffect, useRef, useState } from "react";
import { TavusIntegration } from "@tavus/embed";

export type BenStatus = "loading" | "ready" | "connecting" | "live" | "ended" | "unavailable";

export interface Utterance {
  id: number;
  role: "user" | "replica";
  speech: string;
  at: number;
}

/**
 * Complete utterances carry no `final` field; streaming partials of the same
 * sentence carry a boolean `final`. Keep only complete ones.
 */
function readUtterance(detail: unknown): Omit<Utterance, "id" | "at"> | null {
  if (typeof detail !== "object" || detail === null) return null;
  const event = detail as { event_type?: unknown; properties?: unknown };
  if (event.event_type !== "conversation.utterance") return null;
  const props = event.properties as { role?: unknown; speech?: unknown; final?: unknown } | undefined;
  if (!props || typeof props.speech !== "string" || props.speech.trim() === "") return null;
  if (typeof props.final === "boolean") return null;
  if (props.role !== "user" && props.role !== "replica") return null;
  return { role: props.role, speech: props.speech };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * All of Ben's Tavus wiring in one place, shared by the three themes.
 * Only one theme (and so one <tavus-embed>) is mounted at a time; switching
 * theme unmounts the element, which also ends any live call.
 */
export function useBen() {
  const [status, setStatus] = useState<BenStatus>("loading");
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [lastError, setLastError] = useState<string | null>(null);
  const tavusRef = useRef<TavusIntegration | null>(null);
  const pendingRef = useRef<string | null>(null);
  const liveRef = useRef(false);
  const idRef = useRef(0);

  useEffect(() => {
    const tavus = new TavusIntegration("tavus-embed");
    tavusRef.current = tavus;

    const onReady = () => setStatus("ready");
    const onStarted = () => {
      liveRef.current = true;
      setStatus("live");
      setStartedAt(Date.now());
      const pending = pendingRef.current;
      pendingRef.current = null;
      // Give Ben a moment to finish the greeting before the queued question.
      if (pending) setTimeout(() => tavus.sendMessage(pending), 2500);
    };
    const onEnded = () => {
      liveRef.current = false;
      setStatus("ended");
      setStartedAt(null);
    };
    const onError = (event: CustomEvent<{ code: string; message: string }>) => {
      setLastError(event.detail?.message ?? "Something went wrong");
      console.warn("[Ben] tavus:error", event.detail);
    };
    const onMode = (event: CustomEvent<{ mode: string }>) => {
      const mode = event.detail?.mode;
      if (mode === "idle") setStatus(liveRef.current ? "live" : "ready");
      else if (mode === "haircheck") setStatus("connecting");
      else if (mode === "unavailable") setStatus("unavailable");
      else if (mode === "ended") onEnded();
    };
    const onState = (event: CustomEvent<{ state: string }>) => {
      const state = event.detail?.state;
      if ((state === "initializing" || state === "connecting") && !liveRef.current) setStatus("connecting");
    };
    const onProtocol = (event: CustomEvent<unknown>) => {
      const line = readUtterance(event.detail);
      if (line) setTranscript((lines) => [...lines, { ...line, id: ++idRef.current, at: Date.now() }]);
    };

    tavus.on("tavus:ready", onReady);
    tavus.on("tavus:conversation-started", onStarted);
    tavus.on("tavus:conversation-ended", onEnded);
    tavus.on("tavus:error", onError);
    tavus.on("tavus:mode-change", onMode);
    tavus.on("tavus:state-change", onState);
    tavus.on("tavus:protocol-message", onProtocol);
    return () => {
      tavus.off("tavus:ready", onReady);
      tavus.off("tavus:conversation-started", onStarted);
      tavus.off("tavus:conversation-ended", onEnded);
      tavus.off("tavus:error", onError);
      tavus.off("tavus:mode-change", onMode);
      tavus.off("tavus:state-change", onState);
      tavus.off("tavus:protocol-message", onProtocol);
      tavusRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [startedAt]);

  const start = useCallback(() => {
    setLastError(null);
    tavusRef.current?.startConversation();
  }, []);

  const end = useCallback(() => {
    tavusRef.current?.endConversation();
  }, []);

  /** Ask Ben something. Live: he answers now. Otherwise: starts the call and asks after the greeting. */
  const ask = useCallback(
    (text: string) => {
      if (liveRef.current) {
        tavusRef.current?.sendMessage({ event_type: "conversation.respond", properties: { text } });
        return;
      }
      pendingRef.current = text;
      start();
    },
    [start],
  );

  /** Tell Ben something new mid-call without making him speak (e.g. a mood check-in). */
  const share = useCallback((context: string) => {
    if (!liveRef.current) return false;
    tavusRef.current?.sendMessage({ event_type: "conversation.append_llm_context", properties: { context } });
    return true;
  }, []);

  const elapsed = startedAt === null ? "00:00" : formatClock(now - startedAt);

  return { status, transcript, elapsed, lastError, start, end, ask, share };
}

export type Ben = ReturnType<typeof useBen>;
