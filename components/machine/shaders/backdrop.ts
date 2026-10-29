import * as THREE from "three";

// Huge back plane: deep-navy gradient with a faint fog bloom behind the machine and
// slow volumetric noise, so the void has depth instead of being flat black.
export function makeBackdropMaterial() {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
        return v;
      }
      void main() {
        vec2 uv = vUv - 0.5;
        vec3 base = vec3(0.0196, 0.0275, 0.051);           // #05070d
        float glow = exp(-dot(uv * vec2(1.4, 2.6), uv * vec2(1.4, 2.6)) * 6.0);
        float fog = fbm(uv * 3.0 + vec2(uTime * 0.008, uTime * 0.003));
        vec3 cyan = vec3(0.5, 0.85, 1.0);
        vec3 violet = vec3(0.62, 0.55, 1.0);
        vec3 tint = mix(cyan, violet, smoothstep(-0.3, 0.4, uv.x));
        vec3 col = base + tint * (glow * 0.055 + fog * glow * 0.05);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
