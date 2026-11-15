import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import gsap from "gsap";

/**
 * A walkable longevity clinic built from simple architecture plus CC0 furniture
 * (Poly Haven). Five rooms sit side by side along +x, joined by arched doorways
 * near the front, so the camera "walks" through each arch between stops.
 */

const BASE = "/aurevita";
const ROOM_W = 8; // along x
const ROOM_D = 9; // along z
const BACK = -ROOM_D / 2;
const H = 3.6;
const ARCH_Z = 2.9; // arch centre (near the front so the walk passes through it)
const ARCH_W = 2.5;
const ARCH_H = 2.95;
const EYE = 1.62;

export interface TourStop {
  id: string;
  index: number;
  x: number;
}

export interface Hotspot {
  id: string;
  room: number;
  position: THREE.Vector3;
}

export const ROOM_COUNT = 5;

/** What every tour (3D or picture) offers the React layer. */
export interface Tour {
  goTo(index: number): void;
  project(point: THREE.Vector3): { x: number; y: number } | null;
  isFlying(): boolean;
  dispose(): void;
}

export type RenderTier = "gpu" | "software" | "none";

/**
 * Real GPU, software-only WebGL (VPS, VM, no driver: SwiftShader / llvmpipe), or no WebGL.
 * Browsers refuse a context with failIfMajorPerformanceCaveat when they would fall back to the CPU.
 */
export function detectRenderTier(): RenderTier {
  const open = (opts: WebGLContextAttributes) => {
    const c = document.createElement("canvas");
    return (c.getContext("webgl2", opts) ?? c.getContext("webgl", opts)) as WebGLRenderingContext | null;
  };
  const close = (gl: WebGLRenderingContext) => gl.getExtension("WEBGL_lose_context")?.loseContext();
  try {
    const fast = open({ failIfMajorPerformanceCaveat: true });
    if (fast) {
      const info = fast.getExtension("WEBGL_debug_renderer_info");
      const name = info ? String(fast.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      close(fast);
      return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name) ? "software" : "gpu";
    }
    const slow = open({});
    if (slow) {
      close(slow);
      return "software";
    }
  } catch {
    /* fall through */
  }
  return "none";
}

export interface TourOptions {
  /** Software rendering: low resolution, no shadows, fewer lights, simpler materials. */
  lite?: boolean;
  /** Only draw when something moves (used by lite mode and for capturing stills). */
  onDemand?: boolean;
  /** Called once if even lite 3D can't keep up, so the page can switch to the picture tour. */
  onTooSlow?: () => void;
}

/** Fraction of CSS pixels lite mode renders at; the canvas is scaled up by the browser. */
const LITE_DPR = 0.55;

export const HOTSPOTS: Hotspot[] = [
  { id: "concierge", room: 0, position: new THREE.Vector3(-0.6, 1.3, -1.9) },
  { id: "lounge", room: 0, position: new THREE.Vector3(1.6, 0.9, -0.6) },
  { id: "plan", room: 1, position: new THREE.Vector3(8, 2.0, BACK + 0.25) },
  { id: "coach", room: 1, position: new THREE.Vector3(9.0, 1.1, -0.9) },
  { id: "scan", room: 2, position: new THREE.Vector3(16.2, 2.35, -1.5) },
  { id: "bloods", room: 2, position: new THREE.Vector3(13.6, 1.2, BACK + 0.5) },
  { id: "plunge", room: 3, position: new THREE.Vector3(22.6, 0.85, -1.4) },
  { id: "sauna", room: 3, position: new THREE.Vector3(25.3, 1.7, BACK + 1.4) },
  { id: "kitchen", room: 4, position: new THREE.Vector3(30.8, 1.1, -1.8) },
  { id: "garden", room: 4, position: new THREE.Vector3(32.7, 2.0, BACK + 0.4) },
];

function roomX(i: number) {
  return i * ROOM_W;
}

export function viewFor(i: number) {
  const x = roomX(i);
  return {
    // Stand left of centre so each room's hero object lands between the copy and Ben's card.
    position: new THREE.Vector3(x - 1.5, EYE, 4.0),
    target: new THREE.Vector3(x - 1.0, 1.22, -2.2),
  };
}

type Mats = ReturnType<typeof makeMaterials>;

/**
 * Lite mode: no shadows, and simple Lambert shading instead of PBR (far fewer maths per pixel
 * on a CPU renderer). Colour, texture and glow carry over, so the rooms still read the same.
 */
const liteCache = new WeakMap<THREE.Material, THREE.Material>();
function simplify(mesh: THREE.Mesh) {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  const swap = (m: THREE.Material) => {
    const std = m as THREE.MeshStandardMaterial;
    if (!std.isMeshStandardMaterial) return m;
    let lite = liteCache.get(m);
    if (!lite) {
      lite = new THREE.MeshLambertMaterial({
        color: std.color,
        map: std.map,
        emissive: std.emissive,
        emissiveIntensity: std.emissiveIntensity,
        emissiveMap: std.emissiveMap,
        transparent: std.transparent,
        opacity: std.opacity,
        depthWrite: std.depthWrite,
        side: std.side,
        alphaTest: std.alphaTest,
        // Metals have no diffuse colour under PBR; give them a little body here.
        ...(std.metalness > 0.5 ? { color: std.color.clone().multiplyScalar(0.85) } : {}),
      });
      liteCache.set(m, lite);
    }
    return lite;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
}

function loadTex(loader: THREE.TextureLoader, url: string, repeat: [number, number], srgb = false, aniso = 8) {
  const t = loader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeMaterials(renderer: THREE.WebGLRenderer) {
  const tl = new THREE.TextureLoader();
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const floor = new THREE.MeshStandardMaterial({
    map: loadTex(tl, `${BASE}/tex/herringbone_parquet_Diffuse.jpg`, [2.4, 2.1], true, aniso),
    normalMap: loadTex(tl, `${BASE}/tex/herringbone_parquet_nor_gl.jpg`, [2.4, 2.1], false, aniso),
    roughnessMap: loadTex(tl, `${BASE}/tex/herringbone_parquet_Rough.jpg`, [2.4, 2.1], false, aniso),
    color: new THREE.Color("#e9d9c4"),
    roughness: 0.9,
  });
  const plaster = new THREE.MeshStandardMaterial({
    map: loadTex(tl, `${BASE}/tex/beige_wall_001_Diffuse.jpg`, [0.35, 0.35], true, aniso),
    normalMap: loadTex(tl, `${BASE}/tex/beige_wall_001_nor_gl.jpg`, [0.35, 0.35], false, aniso),
    color: new THREE.Color("#f6eee3"),
    roughness: 0.95,
  });
  const marble = new THREE.MeshStandardMaterial({
    map: loadTex(tl, `${BASE}/tex/marble_01_Diffuse.jpg`, [1, 1], true, aniso),
    roughnessMap: loadTex(tl, `${BASE}/tex/marble_01_Rough.jpg`, [1, 1], false, aniso),
    color: new THREE.Color("#f4ece2"),
    roughness: 0.25,
  });
  return {
    floor,
    plaster,
    marble,
    ceiling: new THREE.MeshStandardMaterial({ color: "#f7f1e8", roughness: 1 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#a07a4e", metalness: 1, roughness: 0.32 }),
    walnut: new THREE.MeshStandardMaterial({ color: "#5a3f2b", roughness: 0.55 }),
    oak: new THREE.MeshStandardMaterial({ color: "#c7a27a", roughness: 0.6 }),
    linen: new THREE.MeshStandardMaterial({ color: "#efe6da", roughness: 0.95 }),
    white: new THREE.MeshStandardMaterial({ color: "#fbf8f3", roughness: 0.25, metalness: 0.05 }),
    sage: new THREE.MeshStandardMaterial({ color: "#8f9f84", roughness: 0.9 }),
    glow: new THREE.MeshStandardMaterial({ color: "#fff3df", emissive: new THREE.Color("#ffd9a8"), emissiveIntensity: 2.2 }),
    // Plain transparency instead of transmission: one render pass, much cheaper.
    glass: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: "#7fb5ae", roughness: 0.04, metalness: 0.25, transparent: true, opacity: 0.88 }),
  };
}

function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function archWall(x: number, mats: Mats, parent: THREE.Object3D) {
  const s = new THREE.Shape();
  const half = ROOM_D / 2;
  const l = ARCH_Z - ARCH_W / 2;
  const r = ARCH_Z + ARCH_W / 2;
  const spring = ARCH_H - ARCH_W / 2;
  s.moveTo(-half, 0);
  s.lineTo(l, 0);
  s.lineTo(l, spring);
  s.absarc(ARCH_Z, spring, ARCH_W / 2, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(half, 0);
  s.lineTo(half, H);
  s.lineTo(-half, H);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false, curveSegments: 40 });
  geo.rotateY(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mats.plaster);
  mesh.position.x = x + 0.15;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  // bronze reveal around the arch
  const trim = new THREE.Shape();
  trim.moveTo(l - 0.06, 0);
  trim.lineTo(l - 0.06, spring);
  trim.absarc(ARCH_Z, spring, ARCH_W / 2 + 0.06, Math.PI, 0, true);
  trim.lineTo(r + 0.06, 0);
  trim.lineTo(r, 0);
  trim.lineTo(r, spring);
  trim.absarc(ARCH_Z, spring, ARCH_W / 2, 0, Math.PI, false);
  trim.lineTo(l, 0);
  trim.closePath();
  const tgeo = new THREE.ExtrudeGeometry(trim, { depth: 0.34, bevelEnabled: false, curveSegments: 40 });
  tgeo.rotateY(-Math.PI / 2);
  const tmesh = new THREE.Mesh(tgeo, mats.bronze);
  tmesh.position.x = x + 0.17;
  parent.add(tmesh);
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  const widths = [...text].map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = x - total / 2;
  [...text].forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
}

function buildShell(mats: Mats, root: THREE.Object3D) {
  const total = ROOM_W * ROOM_COUNT;
  const startX = -ROOM_W / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(total, ROOM_D), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(startX + total / 2, 0, 0);
  floor.receiveShadow = true;
  (mats.floor.map as THREE.Texture).repeat.set(total / 3.2, ROOM_D / 3.2);
  (mats.floor.normalMap as THREE.Texture).repeat.set(total / 3.2, ROOM_D / 3.2);
  (mats.floor.roughnessMap as THREE.Texture).repeat.set(total / 3.2, ROOM_D / 3.2);
  root.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(total, ROOM_D), mats.ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(startX + total / 2, H, 0);
  root.add(ceil);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(total, H), mats.plaster);
  back.position.set(startX + total / 2, H / 2, -ROOM_D / 2);
  back.receiveShadow = true;
  root.add(back);

  const front = new THREE.Mesh(new THREE.PlaneGeometry(total, H), mats.plaster);
  front.rotation.y = Math.PI;
  front.position.set(startX + total / 2, H / 2, ROOM_D / 2);
  root.add(front);

  for (const side of [startX, startX + total]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_D, H), mats.plaster);
    wall.rotation.y = side === startX ? Math.PI / 2 : -Math.PI / 2;
    wall.position.set(side, H / 2, 0);
    root.add(wall);
  }

  for (let i = 1; i < ROOM_COUNT; i++) archWall(startX + i * ROOM_W, mats, root);

  // skirting + cove light along the back wall
  box(total, 0.12, 0.03, mats.bronze, startX + total / 2, 0.06, -ROOM_D / 2 + 0.02, root);
  const cove = new THREE.Mesh(new THREE.BoxGeometry(total, 0.04, 0.12), mats.glow);
  cove.position.set(startX + total / 2, H - 0.18, -ROOM_D / 2 + 0.2);
  root.add(cove);
  box(total, 0.16, 0.3, mats.ceiling, startX + total / 2, H - 0.08, -ROOM_D / 2 + 0.15, root);
}

function addRoomLight(root: THREE.Object3D, x: number, color = "#ffd8b0", intensity = 9) {
  const light = new THREE.PointLight(color, intensity, 9, 1.6);
  light.position.set(x, H - 0.5, 0);
  root.add(light);
}

export class ClinicTour implements Tour {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private look = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private yawGoal = 0;
  private pitchGoal = 0;
  private hoverX = 0;
  private hoverY = 0;
  private dragging: { x: number; y: number; yaw: number; pitch: number } | null = null;
  private clock = new THREE.Clock();
  private frame = 0;
  private disposed = false;
  private visible = true;
  private flying = false;
  private observer: IntersectionObserver;
  private resizeObserver: ResizeObserver;
  private animated: { mesh: THREE.Object3D; update: (t: number) => void }[] = [];
  private projected = new THREE.Vector3();
  private lite = false;
  /** Lite chosen at start: build lighter geometry from the outset. */
  private light = false;
  private onDemand = false;
  private needsRender = true;
  private lastT = performance.now();
  private warmUntil = performance.now() + 12000;
  private lastWarm = 0;
  private probeFrames = 0;
  private probeTime = 0;
  current = 0;

  private container: HTMLElement;
  private onLoad: (progress: number) => void;
  private onFrame: () => void;

  constructor(container: HTMLElement, onLoad: (progress: number) => void, onFrame: () => void, options: TourOptions = {}) {
    this.container = container;
    this.onLoad = onLoad;
    this.onFrame = onFrame;
    this.onDemand = Boolean(options.onDemand || options.lite);
    this.light = Boolean(options.lite);
    this.onTooSlow = options.onTooSlow;
    // Camera walks are time-based: never stretch them out on slow frames.
    gsap.ticker.lagSmoothing(0);
    this.renderer = new THREE.WebGLRenderer({ antialias: !options.lite, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(options.lite ? LITE_DPR : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(58, container.clientWidth / container.clientHeight, 0.05, 80);
    const v = viewFor(0);
    this.camera.position.copy(v.position);

    this.look.copy(v.target);
    const el = this.renderer.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);

    this.scene.background = new THREE.Color("#efe5d8");
    this.scene.fog = new THREE.Fog("#efe5d8", 14, 30);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    new RGBELoader().load(`${BASE}/studio_1k.hdr`, (hdr) => {
      if (this.disposed) return;
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = pmrem.fromEquirectangular(hdr).texture;
      this.scene.environmentIntensity = this.lite ? 0.9 : 0.55;
      hdr.dispose();
      this.needsRender = true;
    });

    const sun = new THREE.DirectionalLight("#fff1dc", 1.6);
    sun.position.set(10, 9, 8);
    sun.target.position.set(16, 0, -1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun, sun.target);
    this.scene.add(new THREE.HemisphereLight("#fff6ea", "#b89a7a", 0.45));

    const mats = makeMaterials(this.renderer);
    buildShell(mats, this.scene);
    this.buildRooms(mats);

    if (options.lite) this.goLite();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.needsRender = true;
    });
    this.observer.observe(container);
    this.loop();
  }

  // Look around from where you stand: drag turns your head, it doesn't orbit.
  private onDown = (event: PointerEvent) => {
    if (this.flying) return;
    this.dragging = { x: event.clientX, y: event.clientY, yaw: this.yawGoal, pitch: this.pitchGoal };
    this.renderer.domElement.style.cursor = "grabbing";
  };

  private onMove = (event: PointerEvent) => {
    if (!this.lite) {
      const rect = this.container.getBoundingClientRect();
      this.hoverX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      this.hoverY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    if (!this.dragging) return;
    const dx = event.clientX - this.dragging.x;
    const dy = event.clientY - this.dragging.y;
    this.yawGoal = THREE.MathUtils.clamp(this.dragging.yaw + dx * 0.0035, -0.85, 0.85);
    this.pitchGoal = THREE.MathUtils.clamp(this.dragging.pitch + dy * 0.0025, -0.3, 0.38);
  };

  private onUp = () => {
    this.dragging = null;
    this.renderer.domElement.style.cursor = "grab";
  };

  private loadModels(list: { id: string; pos: [number, number, number]; rot?: number; scale?: number }[]) {
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => this.onLoad(loaded / total);
    manager.onLoad = () => this.onLoad(1);
    const loader = new GLTFLoader(manager);
    for (const item of list) {
      // potted_plant_02 is ~70k triangles; on a CPU renderer use the light plant instead.
      const id = this.light && item.id === "potted_plant_02" ? "potted_plant_04" : item.id;
      loader.load(`${BASE}/models/${id}/${id}_1k.gltf`, (gltf) => {
        if (this.disposed) return;
        const obj = gltf.scene;
        obj.name = item.id;
        obj.position.set(...item.pos);
        obj.rotation.y = item.rot ?? 0;
        obj.scale.setScalar(item.scale ?? 1);
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (this.lite) simplify(child as THREE.Mesh);
          }
        });
        this.scene.add(obj);
        this.needsRender = true;
      });
    }
  }

  private buildRooms(mats: Mats) {
    const s = this.scene;
    const back = -ROOM_D / 2;

    // ---------- 0 · Reception lounge ----------
    {
      const x = roomX(0);
      addRoomLight(s, x);
      // logo wall in travertine-like marble with bronze lettering
      box(4.6, 2.2, 0.08, mats.marble, x - 0.6, 1.9, back + 0.06, s);
      const logo = canvasTexture(2048, 512, (ctx) => {
        ctx.fillStyle = "#8b6a43";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = '500 230px "Cormorant Garamond", Georgia, serif';
        spaced(ctx, "AUREVITA", 1024, 230, 46);
        ctx.font = '600 52px "Manrope Variable", system-ui, sans-serif';
        spaced(ctx, "LONGEVITY  CLINIC", 1024, 420, 22);
      });
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 0.9),
        new THREE.MeshStandardMaterial({ map: logo, transparent: true, metalness: 0.6, roughness: 0.35 }),
      );
      sign.position.set(x - 0.6, 2.1, back + 0.11);
      s.add(sign);
      // reception desk: walnut body, marble top, bronze strip
      box(2.8, 1.0, 0.75, mats.walnut, x - 0.6, 0.5, -1.9, s);
      box(3.0, 0.06, 0.9, mats.marble, x - 0.6, 1.03, -1.9, s);
      box(2.8, 0.03, 0.02, mats.bronze, x - 0.6, 0.85, -1.51, s);
      // glowing slats on the side wall
      for (let i = 0; i < 6; i++) box(0.05, 2.8, 0.05, mats.oak, x - 3.7, 1.5, -2.6 + i * 0.35, s);
    }

    // ---------- 1 · Consultation suite ----------
    {
      const x = roomX(1);
      addRoomLight(s, x, "#ffdcb8", 8);
      const screen = canvasTexture(1600, 900, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 1600, 900);
        g.addColorStop(0, "#2b221b");
        g.addColorStop(1, "#4a3a2c");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1600, 900);
        ctx.fillStyle = "#c9a27a";
        ctx.font = '600 34px "Manrope Variable", system-ui, sans-serif';
        ctx.fillText("YOUR LONGEVITY PLAN · WITH BEN", 90, 120);
        ctx.fillStyle = "#f3ede4";
        ctx.font = '400 150px "Cormorant Garamond", Georgia, serif';
        ctx.fillText("41.2", 90, 330);
        ctx.font = '500 36px "Manrope Variable", system-ui, sans-serif';
        ctx.fillStyle = "#cdbca8";
        ctx.fillText("biological age  ·  chronological 48", 96, 400);
        ctx.strokeStyle = "#c9a27a";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        const pts = [760, 560, 610, 640, 520, 600, 470, 430, 380, 360];
        pts.forEach((y, i) => (i === 0 ? ctx.moveTo(90, y) : ctx.lineTo(90 + i * 150, y)));
        ctx.stroke();
        ctx.fillStyle = "#f3ede4";
        ctx.beginPath();
        ctx.arc(90 + 9 * 150, 360, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '500 32px "Manrope Variable", system-ui, sans-serif';
        ctx.fillStyle = "#cdbca8";
        ["Sleep 7h 40m", "VO₂ max 44", "ApoB 72 mg/dL"].forEach((t, i) => ctx.fillText(t, 1180, 140 + i * 60));
      });
      const frame = box(3.3, 1.95, 0.08, mats.walnut, x, 1.95, back + 0.06, s);
      frame.castShadow = false;
      const display = new THREE.Mesh(
        new THREE.PlaneGeometry(3.1, 1.75),
        new THREE.MeshStandardMaterial({ map: screen, emissiveMap: screen, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.55 }),
      );
      display.position.set(x, 1.95, back + 0.11);
      s.add(display);
      // sideboard
      box(3.4, 0.7, 0.5, mats.oak, x, 0.35, back + 0.3, s);
    }

    // ---------- 2 · Diagnostics lab ----------
    {
      const x = roomX(2);
      addRoomLight(s, x, "#fff4e6", 10);
      // white counters with marble tops along the back
      box(3.2, 0.92, 0.7, mats.white, x - 2.3, 0.46, back + 0.4, s);
      box(3.3, 0.04, 0.76, mats.marble, x - 2.3, 0.94, back + 0.4, s);
      // test tube rack
      const caps = ["#c94f3d", "#8a6fb5", "#d9a441", "#5d9c7a", "#c94f3d", "#3f6fb5", "#d9a441", "#8a6fb5"];
      box(0.9, 0.08, 0.22, mats.white, x - 2.6, 1.0, back + 0.45, s);
      caps.forEach((c, i) => {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 16), mats.glass);
        tube.position.set(x - 2.95 + i * 0.1, 1.15, back + 0.45);
        s.add(tube);
        const blood = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026, 0.026, 0.16, 16),
          new THREE.MeshStandardMaterial({ color: "#7d1d1d", roughness: 0.2 }),
        );
        blood.position.set(x - 2.95 + i * 0.1, 1.09, back + 0.45);
        s.add(blood);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 16), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }));
        cap.position.set(x - 2.95 + i * 0.1, 1.31, back + 0.45);
        s.add(cap);
      });
      // body composition scanner ring + bed
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.22, 32, 96), mats.white);
      ring.position.set(x + 0.2, 1.25, -1.5);
      ring.rotation.y = Math.PI / 2;
      ring.castShadow = true;
      s.add(ring);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.84, 0.025, 16, 96),
        new THREE.MeshStandardMaterial({ color: "#ffe8c7", emissive: new THREE.Color("#ffc98a"), emissiveIntensity: 3 }),
      );
      halo.position.copy(ring.position);
      halo.rotation.y = Math.PI / 2;
      s.add(halo);
      this.animated.push({ mesh: halo, update: (t) => ((halo.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.2 + Math.sin(t * 2) * 0.9) });
      box(0.24, 0.7, 2.2, mats.white, x + 0.2, 0.35, -1.5, s);
      box(0.24, 0.52, 3.0, mats.bronze, x + 0.2, 0.62, -1.5, s).scale.set(1, 0.12, 1);
      const cushion = box(0.62, 0.12, 2.6, mats.linen, x + 0.2, 0.76, -1.5, s);
      cushion.rotation.y = 0;
      // wall chart panel
      const chart = canvasTexture(900, 1200, (ctx) => {
        ctx.fillStyle = "#fbf8f3";
        ctx.fillRect(0, 0, 900, 1200);
        ctx.fillStyle = "#3a2e25";
        ctx.font = '500 70px "Cormorant Garamond", Georgia, serif';
        ctx.fillText("Biomarkers", 70, 140);
        ctx.font = '600 26px "Manrope Variable", system-ui, sans-serif';
        const rows = ["Metabolic", "Cardiovascular", "Hormonal", "Inflammation", "Nutrients", "Genetic"];
        rows.forEach((r, i) => {
          ctx.fillStyle = "#8b7a68";
          ctx.fillText(r.toUpperCase(), 70, 260 + i * 140);
          ctx.fillStyle = "#eadfce";
          ctx.fillRect(70, 290 + i * 140, 760, 18);
          ctx.fillStyle = "#a07a4e";
          ctx.fillRect(70, 290 + i * 140, 360 + ((i * 97) % 340), 18);
        });
      });
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshStandardMaterial({ map: chart, roughness: 0.6 }));
      panel.position.set(x + 1.9, 1.8, back + 0.02);
      s.add(panel);
    }

    // ---------- 3 · Recovery spa ----------
    {
      const x = roomX(3);
      addRoomLight(s, x, "#ffcf9e", 7);
      // plunge pool: marble surround + water
      box(3.0, 0.55, 0.14, mats.marble, x - 1.4, 0.275, -0.2, s);
      box(3.0, 0.55, 0.14, mats.marble, x - 1.4, 0.275, -2.6, s);
      box(0.14, 0.55, 2.54, mats.marble, x - 2.83, 0.275, -1.4, s);
      box(0.14, 0.55, 2.54, mats.marble, x + 0.03, 0.275, -1.4, s);
      box(2.72, 0.06, 2.3, mats.marble, x - 1.4, 0.03, -1.4, s);
      const water = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 2.26, 40, 40), mats.water);
      water.rotation.x = -Math.PI / 2;
      water.position.set(x - 1.4, 0.46, -1.4);
      s.add(water);
      const wpos = water.geometry.attributes.position as THREE.BufferAttribute;
      const base = Float32Array.from(wpos.array as Float32Array);
      this.animated.push({
        mesh: water,
        update: (t) => {
          for (let i = 0; i < wpos.count; i++) {
            const px = base[i * 3];
            const py = base[i * 3 + 1];
            wpos.setZ(i, Math.sin(px * 3 + t * 1.4) * 0.008 + Math.cos(py * 4 + t) * 0.008);
          }
          wpos.needsUpdate = true;
          water.geometry.computeVertexNormals();
        },
      });
      // sauna cabin: slatted wood with glass front
      const sx = x + 1.3;
      box(2.6, 2.5, 0.08, mats.oak, sx, 1.25, back + 0.04, s);
      box(0.08, 2.5, 1.8, mats.oak, sx - 1.3, 1.25, back + 0.9, s);
      box(0.08, 2.5, 1.8, mats.oak, sx + 1.3, 1.25, back + 0.9, s);
      box(2.6, 0.08, 1.8, mats.oak, sx, 2.5, back + 0.9, s);
      for (let i = 0; i < 2; i++) box(2.5, 0.06, 0.5, mats.oak, sx, 0.45 + i * 0.45, back + 0.35 + i * 0.3, s);
      const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.4), mats.glass);
      glassFront.position.set(sx, 1.25, back + 1.8);
      s.add(glassFront);
      const saunaLight = new THREE.PointLight("#ffb46b", 4, 3, 2);
      saunaLight.position.set(sx, 2.2, back + 0.9);
      s.add(saunaLight);
      // candles
      for (let i = 0; i < 3; i++) {
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12 + i * 0.05, 16), mats.linen);
        candle.position.set(x - 2.4 + i * 0.12, 0.6 + (0.12 + i * 0.05) / 2, -0.2);
        s.add(candle);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mats.glow);
        flame.position.set(x - 2.4 + i * 0.12, 0.62 + 0.12 + i * 0.05, -0.2);
        s.add(flame);
        this.animated.push({ mesh: flame, update: (t) => flame.scale.setScalar(1 + Math.sin(t * 9 + i) * 0.18) });
      }
    }

    // ---------- 4 · Longevity garden ----------
    {
      const x = roomX(4);
      addRoomLight(s, x, "#fff1d6", 9);
      // skylight
      const sky = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.2),
        new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: new THREE.Color("#fff6e8"), emissiveIntensity: 1.6 }),
      );
      sky.rotation.x = Math.PI / 2;
      sky.position.set(x + 0.2, H - 0.01, -1.6);
      s.add(sky);
      const skyLight = new THREE.SpotLight("#fff4e0", 30, 8, 0.7, 0.6, 1.4);
      skyLight.position.set(x + 0.2, H - 0.05, -1.6);
      skyLight.target.position.set(x + 0.2, 0, -1.6);
      s.add(skyLight, skyLight.target);
      // green wall
      // living wall: a dense bed of instanced leaves in a walnut frame
      const wallX = x + 0.7;
      box(3.4, 2.8, 0.12, mats.walnut, wallX, 1.6, back + 0.08, s);
      box(3.2, 2.6, 0.04, new THREE.MeshStandardMaterial({ color: "#3c4a33", roughness: 1 }), wallX, 1.6, back + 0.16, s);
      // Lite: a third of the leaves, each a bit bigger, so the wall stays full for a CPU renderer.
      const leafGeo = this.light ? new THREE.SphereGeometry(1, 5, 4) : new THREE.SphereGeometry(1, 7, 5);
      const leafMat = new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true });
      const count = this.light ? 300 : 900;
      const grow = this.light ? 1.6 : 1;
      const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const v = new THREE.Vector3();
      const sc = new THREE.Vector3();
      const greens = ["#4f6a45", "#5f7a52", "#6f8c5f", "#88a072", "#3f5a3a", "#9bb07e"].map((c) => new THREE.Color(c));
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < count; i++) {
        v.set(wallX - 1.55 + rnd() * 3.1, 0.35 + rnd() * 2.5, back + 0.2 + rnd() * 0.12);
        e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
        q.setFromEuler(e);
        const size = (0.05 + rnd() * 0.07) * grow;
        sc.set(size, size * 0.55, size * 0.25);
        m4.compose(v, q, sc);
        leaves.setMatrixAt(i, m4);
        leaves.setColorAt(i, greens[i % greens.length]);
      }
      leaves.castShadow = true;
      s.add(leaves);
      // nutrition island
      box(2.2, 0.9, 0.9, mats.oak, x - 2.0, 0.45, -1.4, s);
      box(2.3, 0.05, 1.0, mats.marble, x - 2.0, 0.92, -1.4, s);
      const bowls = ["#e9b44c", "#c9573d", "#7da35f"];
      bowls.forEach((c, i) => {
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.white);
        bowl.position.set(x - 2.6 + i * 0.55, 1.08, -1.4);
        bowl.rotation.x = Math.PI;
        s.add(bowl);
        const food = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
        food.position.set(x - 2.6 + i * 0.55, 1.0, -1.4);
        food.scale.y = 0.45;
        s.add(food);
      });
    }

    this.loadModels([
      // reception
      { id: "sofa_02", pos: [roomX(0) + 2.2, 0, -0.9], rot: -Math.PI / 2 },
      { id: "modern_coffee_table_01", pos: [roomX(0) + 1.1, 0, -0.6] },
      { id: "potted_plant_02", pos: [roomX(0) + 3.2, 0, -2.9] },
      { id: "modern_ceiling_lamp_01", pos: [roomX(0) - 0.6, H - 0.02, -1.9] },
      { id: "brass_vase_03", pos: [roomX(0) + 0.3, 1.06, -1.9], scale: 1 },
      // consultation
      { id: "round_wooden_table_02", pos: [roomX(1), 0, -0.9] },
      { id: "modern_arm_chair_01", pos: [roomX(1) - 1.0, 0, -0.9], rot: Math.PI / 2 },
      { id: "modern_arm_chair_01", pos: [roomX(1) + 1.0, 0, -0.9], rot: -Math.PI / 2 },
      { id: "ceramic_vase_01", pos: [roomX(1) - 1.2, 0.7, back + 0.3] },
      { id: "potted_plant_04", pos: [roomX(1) + 3.0, 0, -2.6] },
      // lab
      { id: "potted_plant_04", pos: [roomX(2) + 3.1, 0, 0.6] },
      // spa
      { id: "mid_century_lounge_chair", pos: [roomX(3) + 1.6, 0, 0.9], rot: -Math.PI / 3 },
      { id: "side_table_01", pos: [roomX(3) + 2.5, 0, 1.4] },
      { id: "ceramic_vase_01", pos: [roomX(3) + 2.5, 0.55, 1.4], scale: 0.8 },
      // garden
      { id: "planter_box_01", pos: [roomX(4) - 3.0, 0, 1.0] },
      { id: "potted_plant_02", pos: [roomX(4) + 2.6, 0, -2.6] },
      { id: "potted_plant_04", pos: [roomX(4) - 0.4, 0, -2.8] },
    ]);
  }

  goTo(index: number, instant = false) {
    const i = Math.max(0, Math.min(ROOM_COUNT - 1, index));
    if (i === this.current && !instant) return;
    const from = this.current;
    this.current = i;
    const v = viewFor(i);
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.look);
    if (instant) {
      this.camera.position.copy(v.position);
      this.look.copy(v.target);
      this.needsRender = true;
      return;
    }
    // Walk through each arch in turn so the camera never clips a wall.
    const steps = Math.abs(i - from);
    const dir = Math.sign(i - from);
    const duration = 1.5 + steps * 0.55;
    this.flying = true;
    this.yawGoal = 0;
    this.pitchGoal = 0;
    const tl = gsap.timeline({
      onComplete: () => {
        this.flying = false;
      },
    });
    // Head for the arch line first, then glide along it.
    tl.to(this.camera.position, { z: ARCH_Z, y: EYE, duration: 0.45, ease: "power2.inOut" }, 0);
    tl.to(this.look, { x: this.camera.position.x + dir * 3, y: 1.45, z: ARCH_Z - 1.2, duration: 0.5, ease: "power2.inOut" }, 0);
    tl.to(this.camera.position, { x: v.position.x, duration, ease: "power2.inOut" }, 0.35);
    tl.to(this.look, { x: v.position.x + dir * 3, duration, ease: "power2.inOut" }, 0.35);
    tl.to(this.camera.position, { z: v.position.z, duration: 0.7, ease: "power2.out" }, 0.35 + duration - 0.3);
    tl.to(this.look, { x: v.target.x, y: v.target.y, z: v.target.z, duration: 0.9, ease: "power2.inOut" }, 0.35 + duration - 0.45);
  }

  /** Screen position (CSS px within the container) of a world point, or null when behind the camera. */
  project(point: THREE.Vector3): { x: number; y: number } | null {
    this.projected.copy(point).project(this.camera);
    if (this.projected.z > 1) return null;
    return {
      x: (this.projected.x * 0.5 + 0.5) * this.container.clientWidth,
      y: (-this.projected.y * 0.5 + 0.5) * this.container.clientHeight,
    };
  }

  isFlying() {
    return this.flying;
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    // Narrow screens: widen the lens so the room still reads.
    this.camera.fov = w / h < 0.9 ? 74 : 58;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.needsRender = true;
  }

  private onTooSlow?: () => void;
  private crawl = 0;
  private dpr = LITE_DPR;
  private sharp = false;
  private slowFrames = 0;
  private fastFrames = 0;

  /** Lite mode: trade resolution for responsiveness while things move, recover when it's quick. */
  private adapt(dt: number) {
    // Still crawling at the lowest resolution: hand over to the picture tour.
    if (dt > 0.4 && this.dpr <= 0.31 && performance.now() > this.warmUntil) {
      if (++this.crawl >= 6 && this.onTooSlow) {
        const cb = this.onTooSlow;
        this.onTooSlow = undefined;
        cb();
      }
    } else if (dt < 0.25) this.crawl = 0;
    if (dt > 0.2) {
      this.fastFrames = 0;
      if (++this.slowFrames >= 2 && this.dpr > 0.3) {
        this.dpr = Math.max(0.3, this.dpr * 0.8);
        this.renderer.setPixelRatio(this.dpr);
        this.slowFrames = 0;
      }
    } else if (dt < 0.07) {
      this.slowFrames = 0;
      if (++this.fastFrames >= 20 && this.dpr < LITE_DPR) {
        this.dpr = Math.min(LITE_DPR, this.dpr * 1.15);
        this.renderer.setPixelRatio(this.dpr);
        this.fastFrames = 0;
      }
    }
  }

  /** Ask for one fresh frame (on-demand mode). */
  requestRender() {
    this.needsRender = true;
  }

  /**
   * Switch to the light path: used at start on software WebGL, or later if a "GPU" turns out
   * too slow. Drops shadows, point/spot lights and detail maps, and renders at reduced resolution.
   */
  private goLite() {
    if (this.lite) return;
    this.lite = true;
    this.onDemand = true;
    this.hoverX = 0;
    this.hoverY = 0;
    this.renderer.setPixelRatio(LITE_DPR);
    this.renderer.shadowMap.enabled = false;
    this.scene.environmentIntensity = 0.9;
    this.scene.traverse((obj) => {
      if ((obj as THREE.PointLight).isPointLight || (obj as THREE.SpotLight).isSpotLight) obj.visible = false;
      if ((obj as THREE.HemisphereLight).isHemisphereLight) (obj as THREE.HemisphereLight).intensity = 1.35;
      if ((obj as THREE.DirectionalLight).isDirectionalLight) {
        const sun = obj as THREE.DirectionalLight;
        sun.castShadow = false;
        sun.intensity = 2.2;
      }
      if ((obj as THREE.Mesh).isMesh) simplify(obj as THREE.Mesh);
    });
    this.needsRender = true;
  }

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.25, Math.max(0.001, (now - this.lastT) / 1000));
    this.lastT = now;
    if (!this.visible) return;
    const t = this.clock.getElapsedTime();
    // Time-based easing: a drag settles in the same time at 5 fps as at 60 fps.
    const k = 1 - Math.pow(1 - 0.09, dt * 60);
    this.yaw += (this.yawGoal - this.yaw) * k;
    this.pitch += (this.pitchGoal - this.pitch) * k;
    const settling = Math.abs(this.yawGoal - this.yaw) > 1e-4 || Math.abs(this.pitchGoal - this.pitch) > 1e-4;

    if (this.onDemand) {
      // Textures stream in for a few seconds after start: refresh now and then while they do.
      const warm = now < this.warmUntil && now - this.lastWarm > 700;
      const active = this.needsRender || this.flying || this.dragging || settling;
      if (!active && !warm) {
        // Came to rest: draw one sharp frame at full lite resolution.
        if (this.lite && !this.sharp) {
          this.sharp = true;
          this.renderer.setPixelRatio(LITE_DPR);
          this.draw();
        }
        return;
      }
      if (warm) this.lastWarm = now;
      if (this.lite && this.sharp && active && this.dpr < LITE_DPR) {
        this.renderer.setPixelRatio(this.dpr);
      }
      if (active) this.sharp = false;
    } else {
      for (const a of this.animated) a.update(t);
      // A "GPU" that can't hold ~14 fps (after shader warm-up) gets the light path too.
      this.probeFrames += 1;
      if (this.probeFrames > 45 && this.probeFrames <= 135) this.probeTime += dt;
      if (this.probeFrames === 135 && this.probeTime / 90 > 1 / 14) this.goLite();
    }
    this.needsRender = false;
    if (this.lite) this.adapt(dt);
    this.draw();
  };

  private draw() {
    const drift = this.dragging || this.flying || this.lite ? 0 : 1;
    this.camera.lookAt(this.look);
    // Grab-the-world drag (like street view); the idle hover drifts toward the pointer.
    this.camera.rotateY(this.yaw - this.hoverX * 0.035 * drift);
    this.camera.rotateX(this.pitch - this.hoverY * 0.02 * drift);
    this.renderer.render(this.scene, this.camera);
    this.onFrame();
  }

  dispose() {
    this.disposed = true;
    gsap.ticker.lagSmoothing(500, 33);
    cancelAnimationFrame(this.frame);
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.look);
    this.observer.disconnect();
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
      for (const m of list) {
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
