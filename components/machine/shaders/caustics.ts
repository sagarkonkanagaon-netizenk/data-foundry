import * as THREE from "three";

// Internal caustics: the light pattern you see on the inside of a glass vessel.
// Iterated domain-warp caustic (after the classic "tileable water caustic"),
// mapped around the inner wall and faded at the caps.
export function makeCausticsMaterial(color: string, strength = 0.5) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uStrength: { value: strength },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uStrength;
      varying vec2 vUv;
      #define TAU 6.28318530718
      float caustic(vec2 uv, float t) {
        vec2 p = mod(uv * TAU, TAU) - 250.0;
        vec2 i = p;
        float c = 1.0;
        float inten = 0.005;
        for (int n = 0; n < 4; n++) {
          float tt = t * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
        }
        c /= 4.0;
        c = 1.17 - pow(c, 1.4);
        return pow(abs(c), 8.0);
      }
      void main() {
        vec2 uv = vec2(vUv.x * 3.0, vUv.y * 1.6);
        float c = caustic(uv, uTime * 0.18 + 23.0);
        float caps = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
        float a = clamp(c, 0.0, 1.0) * caps * uStrength;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
}
