import { ExtrudeGeometry, Shape } from "three";

export const PLATE_SIZE = 1.15;
export const PLATE_RADIUS = 0.18;
export const PLATE_DEPTH = 0.045;

export function createPlateGeometry(): ExtrudeGeometry {
  const w = PLATE_SIZE;
  const h = PLATE_SIZE;
  const r = PLATE_RADIUS;
  const shape = new Shape();
  const x = -w / 2;
  const y = -h / 2;

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - r);
  shape.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + h);
  shape.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);

  const geo = new ExtrudeGeometry(shape, {
    depth: PLATE_DEPTH,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 5,
  });
  geo.translate(0, 0, -PLATE_DEPTH / 2);
  geo.computeVertexNormals();

  const pos = geo.getAttribute("position");
  const nrm = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  if (pos && nrm && uv) {
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(nrm.getZ(i)) > 0.45) {
        uv.setXY(
          i,
          pos.getX(i) / PLATE_SIZE + 0.5,
          pos.getY(i) / PLATE_SIZE + 0.5,
        );
      }
    }
    uv.needsUpdate = true;
  }

  return geo;
}
