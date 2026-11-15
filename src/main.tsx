import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Registers <tavus-embed> once, statically, at the entry (never a lazy import).
import "@tavus/embed";
import "./base.css";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
