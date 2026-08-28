import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type Texture,
} from "three";
import { atlasMarks, INK, PAPER, VOID, VIOLET, skills } from "../content";

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 4;

export type Atlas = {
  texture: Texture;
  labels: string[];
  uvOf: (label: string) => [number, number, number, number];
  dispose: () => void;
};

function uniqueLabels(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of skills) {
    if (!seen.has(s.atlas)) {
      seen.add(s.atlas);
      out.push(s.atlas);
    }
  }
  for (const m of atlasMarks) {
    if (!seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  return out;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createAtlas(): Atlas {
  const labels = uniqueLabels();
  const cols = ATLAS_COLS;
  const rows = ATLAS_ROWS;
  const cell = 128;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas is unavailable");
  }

  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cell;
    const y = row * cell;
    const inset = 10;
    const label = labels[i] ?? "";

    ctx.fillStyle = PAPER;
    roundRect(ctx, x + inset, y + inset, cell - inset * 2, cell - inset * 2, 22);
    ctx.fill();
    ctx.strokeStyle = VIOLET;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!label) continue;

    const maxW = cell - inset * 2 - 10;
    let size = label.length > 10 ? 16 : label.length > 7 ? 18 : 20;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = INK;
    do {
      ctx.font = `500 ${size}px ui-monospace, monospace`;
      ctx.letterSpacing = "0.08em";
      size -= 1;
    } while (size > 11 && ctx.measureText(label).width > maxW);

    ctx.fillText(label, x + cell / 2, y + cell / 2 + 1);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const uvMap = new Map<string, [number, number, number, number]>();
  const padU = 0.04 / cols;
  const padV = 0.04 / rows;
  for (let i = 0; i < labels.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const u = col / cols + padU;
    const v = 1 - (row + 1) / rows + padV;
    const su = 1 / cols - padU * 2;
    const sv = 1 / rows - padV * 2;
    uvMap.set(labels[i], [u, v, su, sv]);
  }

  const fallback: [number, number, number, number] = uvMap.get("TS") ?? [
    0, 0, 1 / cols, 1 / rows,
  ];

  return {
    texture,
    labels,
    uvOf: (label: string) => uvMap.get(label) ?? fallback,
    dispose: () => texture.dispose(),
  };
}
