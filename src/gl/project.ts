import { Vector3, type PerspectiveCamera } from "three";

const _dir = new Vector3();

export function screenToWorld(
  cx: number,
  cy: number,
  camera: PerspectiveCamera,
  worldZ: number,
  out: Vector3,
): Vector3 {
  out.set(
    (cx / window.innerWidth) * 2 - 1,
    -(cy / window.innerHeight) * 2 + 1,
    0.5,
  );
  out.unproject(camera);
  _dir.copy(out).sub(camera.position).normalize();
  const t = (worldZ - camera.position.z) / _dir.z;
  return out.copy(camera.position).addScaledVector(_dir, t);
}
