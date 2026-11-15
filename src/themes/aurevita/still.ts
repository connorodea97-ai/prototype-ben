import * as THREE from "three";
import { ROOM_COUNT, viewFor, type Tour } from "./scene.ts";

/**
 * The clinic tour without WebGL: one wide render per room, taken from the real 3D scene
 * with the same camera. Drag pans the picture, rooms cross-fade, and hotspots are projected
 * with plain camera maths (no GPU needed), so the pins land exactly where they do in 3D.
 */

const STILLS = "/aurevita/stills";
// Stills are rendered at this size with the 3D camera's 58° vertical field of view.
export const STILL_W = 2400;
export const STILL_H = 1100;

export class StillTour implements Tour {
  private container: HTMLElement;
  private onFrame: () => void;
  private root: HTMLDivElement;
  private images: HTMLImageElement[] = [];
  private camera = new THREE.PerspectiveCamera(58, STILL_W / STILL_H, 0.05, 80);
  private projected = new THREE.Vector3();
  private current = 0;
  private flying = false;
  private flyTimer = 0;
  private pan = 0;
  private panGoal = 0;
  private dragging: { x: number; pan: number } | null = null;
  private frame = 0;
  private lastT = 0;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, onLoad: (progress: number) => void, onFrame: () => void, startRoom = 0) {
    this.container = container;
    this.onFrame = onFrame;
    this.root = document.createElement("div");
    this.root.className = "av-still";
    let loaded = 0;
    for (let i = 0; i < ROOM_COUNT; i++) {
      const img = new Image();
      img.alt = "";
      img.draggable = false;
      img.decoding = "async";
      img.src = `${STILLS}/room-${i}.jpg`;
      img.onload = img.onerror = () => {
        loaded += 1;
        onLoad(loaded / ROOM_COUNT);
        this.layout();
      };
      if (i === startRoom) img.classList.add("is-on");
      this.root.appendChild(img);
      this.images.push(img);
    }
    this.current = Math.max(0, Math.min(ROOM_COUNT - 1, startRoom));
    container.appendChild(this.root);
    this.root.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    this.resizeObserver = new ResizeObserver(() => this.layout());
    this.resizeObserver.observe(container);
    this.aimCamera();
    this.layout();
  }

  /** Cover-fit size and offset of the picture inside the stage, plus the current pan. */
  private fit() {
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    const scale = Math.max(cw / STILL_W, ch / STILL_H);
    const w = STILL_W * scale;
    const h = STILL_H * scale;
    const slack = Math.max(0, (w - cw) / 2);
    return { w, h, x: (cw - w) / 2 + THREE.MathUtils.clamp(this.pan, -slack, slack), y: (ch - h) / 2, slack };
  }

  private layout() {
    const f = this.fit();
    for (const img of this.images) {
      img.style.width = `${f.w}px`;
      img.style.height = `${f.h}px`;
      img.style.left = `${f.x}px`;
      img.style.top = `${f.y}px`;
    }
    this.onFrame();
  }

  private aimCamera() {
    const v = viewFor(this.current);
    this.camera.position.copy(v.position);
    this.camera.lookAt(v.target);
    this.camera.updateMatrixWorld();
  }

  private onDown = (event: PointerEvent) => {
    if (this.flying) return;
    this.dragging = { x: event.clientX, pan: this.panGoal };
    this.root.style.cursor = "grabbing";
  };

  private onMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    const slack = this.fit().slack;
    this.panGoal = THREE.MathUtils.clamp(this.dragging.pan + (event.clientX - this.dragging.x), -slack, slack);
    this.animate();
  };

  private onUp = () => {
    this.dragging = null;
    this.root.style.cursor = "";
  };

  /** Ease the pan toward its goal, only while it is moving. */
  private animate() {
    if (this.frame) return;
    this.lastT = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - this.lastT) / 1000);
      this.lastT = now;
      this.pan += (this.panGoal - this.pan) * (1 - Math.pow(0.82, dt * 60));
      this.layout();
      if (Math.abs(this.panGoal - this.pan) > 0.3 || this.dragging) this.frame = requestAnimationFrame(step);
      else this.frame = 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  goTo(index: number) {
    const i = Math.max(0, Math.min(ROOM_COUNT - 1, index));
    if (i === this.current) return;
    this.images[this.current].classList.remove("is-on");
    this.images[i].classList.add("is-on");
    this.current = i;
    this.pan = this.panGoal = 0;
    this.aimCamera();
    this.flying = true;
    window.clearTimeout(this.flyTimer);
    this.flyTimer = window.setTimeout(() => {
      this.flying = false;
      this.layout();
    }, 950);
    this.layout();
  }

  project(point: THREE.Vector3) {
    this.projected.copy(point).project(this.camera);
    if (this.projected.z > 1) return null;
    const f = this.fit();
    return {
      x: f.x + (this.projected.x * 0.5 + 0.5) * f.w,
      y: f.y + (-this.projected.y * 0.5 + 0.5) * f.h,
    };
  }

  isFlying() {
    return this.flying;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    window.clearTimeout(this.flyTimer);
    this.resizeObserver.disconnect();
    this.root.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.root.remove();
  }
}
