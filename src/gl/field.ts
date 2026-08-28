import {
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  Quaternion,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
  type PerspectiveCamera,
} from "three";
import {
  INK,
  PAPER,
  VIOLET,
  skills,
  skillsByGroup,
  type Skill,
} from "../content";
import { createAtlas, type Atlas } from "./atlas";
import { createPlateGeometry, PLATE_SIZE } from "./geometry";
import { screenToWorld } from "./project";
import plateFrag from "./shaders/plate.frag.glsl?raw";
import plateVert from "./shaders/plate.vert.glsl?raw";

export const DESKTOP_COUNT = 22;
export const MOBILE_COUNT = 10;
const SYSTEM_Z = 0.4;

const dummy = new Object3D();
const ident = new Quaternion();
const _world = new Vector3();
const _rest = new Vector3();
const _sys = new Vector3();
const _ndc = new Vector3();
const _cam = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _ray = new Raycaster();
const _color = new Color();

export type Field = {
  mesh: InstancedMesh;
  update: (
    time: number,
    scroll: number,
    system: number,
    pointer: Vector2,
    camera: PerspectiveCamera,
    stage: DOMRect | null,
    mobile: boolean,
  ) => void;
  pick: (pointer: Vector2, camera: PerspectiveCamera) => Skill | null;
  dispose: () => void;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function hexColor(hex: string): Color {
  return _color.set(hex).convertSRGBToLinear().clone();
}

type Instance = {
  seed: number;
  skillIndex: number;
  atlas: [number, number, number, number];
  restPos: Vector3;
  restQuat: Quaternion;
  restScale: number;
};

function layoutRest(i: number, rng: () => number): Vector3 {
  for (let k = 0; k < 16; k++) {
    const theta = (i + k * 0.37) * 2.399963;
    const radius = 2.8 + rng() * 4.0;
    const x = Math.cos(theta) * radius * (1.08 + rng() * 0.28);
    const y = Math.sin(theta * 0.7) * radius * 0.64 + (rng() - 0.5) * 0.7;
    const z = -4.6 + rng() * 2.2;
    if (Math.abs(x) < 3.25 && y < 1.75 && y > -1.85) continue;
    return new Vector3(x, y, z);
  }
  return new Vector3(3.4 + rng(), 1.6 + rng() * 0.5, -2.4);
}

function stageCell(
  camera: PerspectiveCamera,
  rect: DOMRect,
  col: number,
  cols: number,
  row: number,
  rows: number,
  out: Vector3,
  compact: boolean,
): number {
  const padX = Math.min(64, rect.width * 0.07);
  const padY = Math.min(40, rect.height * 0.1);
  const left = rect.left + padX;
  const right = rect.right - padX;
  const top = rect.top + padY;
  const bottom = rect.bottom - padY;
  screenToWorld(left, top, camera, SYSTEM_Z, _a);
  screenToWorld(right, top, camera, SYSTEM_Z, _b);
  screenToWorld(left, bottom, camera, SYSTEM_Z, _c);
  const u = (col + 0.5) / cols;
  const v = (row + 0.5) / rows;
  out.set(
    _a.x + (_b.x - _a.x) * u + (_c.x - _a.x) * v,
    _a.y + (_b.y - _a.y) * u + (_c.y - _a.y) * v,
    _a.z + (_b.z - _a.z) * u + (_c.z - _a.z) * v,
  );
  const cellW = Math.abs(_b.x - _a.x) / cols;
  const cellH = Math.abs(_c.y - _a.y) / rows;
  const cell = Math.min(cellW, cellH);
  return (cell / PLATE_SIZE) * (compact ? 0.4 : 0.46);
}

function skillGrid(skillIndex: number, mobile: boolean): {
  col: number;
  cols: number;
  row: number;
  rows: number;
} {
  if (mobile) {
    const cols = 3;
    const rows = Math.ceil(skills.length / cols);
    const row = Math.floor(skillIndex / cols);
    let col = skillIndex % cols;
    const lastCount = skills.length - (rows - 1) * cols;
    if (row === rows - 1 && lastCount < cols) {
      col += (cols - lastCount) / 2;
    }
    return { col, cols, row, rows };
  }
  const skill = skills[skillIndex]!;
  const row = skill.group === "front" ? 0 : skill.group === "back" ? 1 : 2;
  const members = skillsByGroup(skill.group);
  const i = Math.max(0, members.findIndex((s) => s.id === skill.id));
  const cols = 5;
  return { col: i + (cols - members.length) / 2, cols, row, rows: 3 };
}

function buildInstances(count: number, atlas: Atlas): Instance[] {
  const rng = mulberry32(914);
  const list: Instance[] = [];
  for (let i = 0; i < count; i++) {
    const skillIndex = i < skills.length ? i : -1;
    dummy.rotation.set(
      (rng() - 0.5) * 0.65,
      (rng() - 0.5) * 0.7,
      (rng() - 0.5) * 0.35,
    );
    list.push({
      seed: rng(),
      skillIndex,
      atlas: atlas.uvOf(
        skillIndex >= 0
          ? skills[skillIndex]!.atlas
          : (atlas.labels[(i * 7) % atlas.labels.length] ?? "TS"),
      ),
      restPos: layoutRest(i, rng),
      restQuat: dummy.quaternion.clone(),
      restScale: skillIndex >= 0 ? 0.92 + rng() * 0.22 : 0.52 + rng() * 0.34,
    });
  }
  return list;
}

export function createField(mobile: boolean): Field {
  const count = mobile ? MOBILE_COUNT : DESKTOP_COUNT;
  const atlas = createAtlas();
  const geometry = createPlateGeometry();
  const instances = buildInstances(count, atlas);

  const atlasArr = new Float32Array(count * 4);
  const liftArr = new Float32Array(count);
  const alphaArr = new Float32Array(count);
  const seedArr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    atlasArr.set(instances[i]!.atlas, i * 4);
    seedArr[i] = instances[i]!.seed;
    alphaArr[i] = 0.5;
  }

  geometry.setAttribute(
    "aAtlas",
    new InstancedBufferAttribute(atlasArr, 4).setUsage(DynamicDrawUsage),
  );
  geometry.setAttribute(
    "aLift",
    new InstancedBufferAttribute(liftArr, 1).setUsage(DynamicDrawUsage),
  );
  geometry.setAttribute(
    "aAlpha",
    new InstancedBufferAttribute(alphaArr, 1).setUsage(DynamicDrawUsage),
  );
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seedArr, 1));

  const material = new ShaderMaterial({
    vertexShader: plateVert,
    fragmentShader: plateFrag,
    uniforms: {
      uTime: { value: 0 },
      uSystem: { value: 0 },
      uAtlas: { value: atlas.texture },
      uPaper: { value: hexColor(PAPER) },
      uInk: { value: hexColor(INK) },
      uViolet: { value: hexColor(VIOLET) },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });

  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.renderOrder = 0;

  const liftAttr = geometry.getAttribute("aLift") as InstancedBufferAttribute;
  const alphaAttr = geometry.getAttribute(
    "aAlpha",
  ) as InstancedBufferAttribute;

  const update = (
    time: number,
    scroll: number,
    system: number,
    pointer: Vector2,
    camera: PerspectiveCamera,
    stage: DOMRect | null,
    isMobile: boolean,
  ) => {
    const sys = smoothstep(0.12, 0.7, system);
    material.uniforms["uTime"]!.value = time;
    material.uniforms["uSystem"]!.value = sys;
    material.depthWrite = sys > 0.55;
    const driftAmp = (0.32 + scroll * 0.95) * (1 - sys * 0.97);
    const depth = 1 + scroll * 0.8 * (1 - sys);
    const liftR = 0.17 + sys * 0.1;
    const stageOk = Boolean(stage && stage.width > 8 && stage.height > 8);

    for (let i = 0; i < count; i++) {
      const inst = instances[i]!;
      const s = inst.seed;

      _rest.copy(inst.restPos);
      _rest.x += Math.sin(time * 0.17 + s * 6.28) * 0.34 * driftAmp;
      _rest.y += Math.cos(time * 0.13 + s * 4.2) * 0.24 * driftAmp;
      _rest.z = (_rest.z + Math.sin(time * 0.11 + s * 5.1) * 0.18 * driftAmp) * depth;

      let sysScale = inst.restScale;
      if (inst.skillIndex >= 0 && stageOk && stage) {
        const g = skillGrid(inst.skillIndex, isMobile);
        sysScale = stageCell(
          camera,
          stage,
          g.col,
          g.cols,
          g.row,
          g.rows,
          _sys,
          isMobile,
        );
      } else {
        _sys.set((s - 0.5) * 14, (s - 0.35) * 10, -8);
        sysScale = 0.2;
      }

      _world.lerpVectors(_rest, _sys, sys);
      dummy.quaternion.copy(inst.restQuat).slerp(ident, sys);

      _ndc.copy(_world).project(camera);
      const dist = Math.hypot(_ndc.x - pointer.x, _ndc.y - pointer.y);
      const lift = 1 - smoothstep(0, liftR, dist);
      _cam.copy(camera.position).sub(_world).normalize();
      _world.addScaledVector(_cam, lift * (0.62 - sys * 0.36));
      dummy.quaternion.slerp(ident, lift * (0.76 - sys * 0.55));

      const scale =
        inst.restScale + (sysScale - inst.restScale) * sys;
      const contentFade =
        1 - smoothstep(0.045, 0.16, scroll) * (1 - sys) * 0.78;
      const heroAlpha = 0.2 * contentFade;
      const sysAlpha = inst.skillIndex >= 0 ? 0.96 : 0;
      const alpha = heroAlpha + (sysAlpha - heroAlpha) * sys;
      const visScale = alpha < 0.04 ? 0.001 : scale;

      dummy.position.copy(_world);
      dummy.scale.setScalar(visScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      liftArr[i] = lift;
      alphaArr[i] = alpha;
    }

    mesh.instanceMatrix.needsUpdate = true;
    liftAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  };

  const pick = (
    pointer: Vector2,
    camera: PerspectiveCamera,
  ): Skill | null => {
    _ray.setFromCamera(pointer, camera);
    const hits = _ray.intersectObject(mesh, false);
    for (const hit of hits) {
      const id = hit.instanceId;
      if (id == null) continue;
      if ((alphaArr[id] ?? 0) < 0.35) continue;
      const idx = instances[id]?.skillIndex ?? -1;
      if (idx < 0) continue;
      return skills[idx] ?? null;
    }

    let best: Skill | null = null;
    let bestDist = 0.11;
    for (let i = 0; i < count; i++) {
      if ((alphaArr[i] ?? 0) < 0.35) continue;
      const idx = instances[i]!.skillIndex;
      if (idx < 0) continue;
      mesh.getMatrixAt(i, dummy.matrix);
      _world.setFromMatrixPosition(dummy.matrix);
      _ndc.copy(_world).project(camera);
      const dist = Math.hypot(_ndc.x - pointer.x, _ndc.y - pointer.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = skills[idx] ?? null;
      }
    }
    return best;
  };

  return {
    mesh,
    update,
    pick,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      atlas.dispose();
      mesh.dispose();
    },
  };
}
