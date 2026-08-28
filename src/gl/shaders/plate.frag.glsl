uniform sampler2D uAtlas;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uViolet;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;
varying vec4 vAtlas;
varying float vLift;
varying float vAlpha;

void main() {
  vec3 n = normalize(vNormal);
  vec3 vd = normalize(vViewDir);

  vec2 faceUv = vUv + n.xy * 0.028 * (0.25 + vLift);
  float ca = vLift * 0.0055;
  vec2 uvC = vAtlas.xy + clamp(faceUv, 0.0, 1.0) * vAtlas.zw;
  vec2 uvR = vAtlas.xy + clamp(faceUv + vec2(ca, 0.0), 0.0, 1.0) * vAtlas.zw;
  vec2 uvB = vAtlas.xy + clamp(faceUv - vec2(ca, 0.0), 0.0, 1.0) * vAtlas.zw;

  vec4 smp = texture2D(uAtlas, uvC);
  vec3 tex = vec3(texture2D(uAtlas, uvR).r, smp.g, texture2D(uAtlas, uvB).b);

  float front = smoothstep(0.22, 0.55, abs(n.z));
  vec3 side = mix(uPaper, uViolet, 0.28);
  vec3 body = mix(side, tex.rgb, front);

  float ndl = dot(n, normalize(vec3(0.18, 0.42, 0.88))) * 0.5 + 0.5;
  body *= 0.82 + ndl * 0.28;

  float fres = pow(clamp(1.0 - abs(dot(n, vd)), 0.0, 1.0), 2.15);
  body = mix(body, mix(uViolet, uInk, 0.22), fres * (0.28 + vLift * 0.42));
  body += uViolet * vLift * 0.16;

  gl_FragColor = vec4(body, vAlpha * 0.94);
}
