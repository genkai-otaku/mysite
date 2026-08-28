attribute vec4 aAtlas;
attribute float aLift;
attribute float aAlpha;
attribute float aSeed;

uniform float uTime;
uniform float uSystem;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec4 vAtlas;
varying float vLift;
varying float vAlpha;

void main() {
  vAtlas = aAtlas;
  vAlpha = aAlpha;
  vLift = aLift;
  vUv = uv;

  vec3 pos = position;
  float warp = aLift * 0.055 * (1.0 - uSystem * 0.9);
  pos.x += sin(position.y * 8.0 + uTime + aSeed * 6.2831853) * warp;
  pos.y += cos(position.x * 8.0 + uTime * 0.9 + aSeed * 4.1) * warp;

  #ifdef USE_INSTANCING
    vec4 world = instanceMatrix * vec4(pos, 1.0);
    mat3 nmat = mat3(instanceMatrix);
  #else
    vec4 world = modelMatrix * vec4(pos, 1.0);
    mat3 nmat = mat3(modelMatrix);
  #endif

  vec3 worldPos = world.xyz;
  worldPos.z += aLift * mix(0.12, 0.04, uSystem);

  vec4 mv = viewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mv;

  vNormal = normalize(nmat * normal);
  vViewDir = normalize(cameraPosition - worldPos);
}
