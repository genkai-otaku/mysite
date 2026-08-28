import {
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { VOID, type Skill } from "../content";
import { createField, type Field } from "./field";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isNarrow(): boolean {
  return window.matchMedia("(max-width: 768px)").matches;
}

function isCoarse(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

function saveData(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  return Boolean(nav.connection?.saveData);
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function fallbackStatic(): void {
  document.documentElement.classList.add("is-static");
  document.documentElement.classList.remove("has-gl", "is-picking");
}

function pixelCap(mobile: boolean): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.min(dpr, mobile ? 1.25 : 1.5);
}

function scrollAmount(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 1) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

function systemBlend(): number {
  const el = document.getElementById("system");
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
  if (vis < vh * 0.32) return 0;
  const ideal = vh * 0.12;
  const dist = Math.abs(r.top - ideal);
  return Math.min(1, Math.max(0, 1 - dist / (vh * 0.7)));
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element
    ? Boolean(target.closest("a, button, input, textarea, label, nav, form"))
    : false;
}

export type EngineHooks = {
  showSkillTip: (skill: Skill, x: number, y: number) => void;
  hideSkillTip: () => void;
};

export async function initEngine(hooks: EngineHooks): Promise<void> {
  const canvas = document.getElementById("gl");
  if (!(canvas instanceof HTMLCanvasElement)) {
    fallbackStatic();
    return;
  }

  if (prefersReducedMotion() || saveData() || !hasWebGL()) {
    fallbackStatic();
    return;
  }

  const coarse = isCoarse();
  let mobile = isNarrow();

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: mobile ? "low-power" : "high-performance",
    });
  } catch {
    fallbackStatic();
    return;
  }

  renderer.setClearColor(VOID, 1);
  renderer.setPixelRatio(pixelCap(mobile));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    32,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.1,
    80,
  );
  camera.position.set(0, 0.15, 9);

  const pointer = new Vector2(8, 8);
  const pointerCss = new Vector2(-999, -999);
  let lastSkillId: string | null = null;
  let systemSmooth = 0;
  let pointerMoved = false;

  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointerCss.set(e.clientX, e.clientY);
    pointerMoved = true;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener(
    "pointerleave",
    () => {
      pointer.set(8, 8);
      pointerMoved = true;
      document.documentElement.classList.remove("is-picking");
      if (!coarse) hooks.hideSkillTip();
    },
    { passive: true },
  );

  let field: Field = createField(mobile);
  scene.add(field.mesh);

  const stageEl = document.getElementById("system-stage");

  const applySize = () => {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(pixelCap(mobile));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const rebuildForMode = () => {
    const next = isNarrow();
    if (next === mobile) return;
    mobile = next;
    scene.remove(field.mesh);
    field.dispose();
    field = createField(mobile);
    scene.add(field.mesh);
    applySize();
  };

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuildForMode();
      applySize();
    }, 120);
  });

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    running = false;
    fallbackStatic();
  });

  window.addEventListener("click", (e) => {
    if (!coarse) return;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointerCss.set(e.clientX, e.clientY);
    if (isInteractive(e.target)) return;
    if (systemSmooth < 0.42) {
      lastSkillId = null;
      hooks.hideSkillTip();
      return;
    }
    const skill = field.pick(pointer, camera);
    if (skill && lastSkillId === skill.id) {
      lastSkillId = null;
      hooks.hideSkillTip();
      return;
    }
    if (skill) {
      lastSkillId = skill.id;
      hooks.showSkillTip(skill, pointerCss.x, pointerCss.y);
    } else {
      lastSkillId = null;
      hooks.hideSkillTip();
    }
  });

  applySize();

  let running = true;
  let raf = 0;
  let lastTick = 0;
  const minFrame = mobile ? 33 : 16;

  const tick = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    if (now - lastTick < minFrame) return;
    lastTick = now;

    const time = now * 0.001;
    const scroll = scrollAmount();
    const target = systemBlend();
    const snap = target > 0.88 ? 0.38 : 0.2;
    systemSmooth += (target - systemSmooth) * snap;
    if (Math.abs(target - systemSmooth) < 0.002) systemSmooth = target;

    camera.position.z = 9 + scroll * 1.35 * (1 - systemSmooth);
    camera.position.y = 0.15;
    camera.updateMatrixWorld();

    const stage =
      systemSmooth > 0.02 && stageEl
        ? stageEl.getBoundingClientRect()
        : null;

    field.update(
      time,
      scroll,
      systemSmooth,
      pointer,
      camera,
      stage,
      mobile,
    );

    if (!coarse && pointerMoved) {
      pointerMoved = false;
      if (
        systemSmooth > 0.42 &&
        !isInteractive(document.elementFromPoint(pointerCss.x, pointerCss.y))
      ) {
        const skill = field.pick(pointer, camera);
        document.documentElement.classList.toggle("is-picking", Boolean(skill));
        if (skill) hooks.showSkillTip(skill, pointerCss.x, pointerCss.y);
        else hooks.hideSkillTip();
      } else {
        document.documentElement.classList.remove("is-picking");
        hooks.hideSkillTip();
      }
    }

    renderer.render(scene, camera);
  };

  document.documentElement.classList.add("has-gl");

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (running && raf === 0) {
      raf = requestAnimationFrame(tick);
    }
  });

  raf = requestAnimationFrame(tick);
}
