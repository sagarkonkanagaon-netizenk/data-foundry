import * as THREE from "three";

// Billboard glow: hot core, soft halo and a faint ring that breathes with uPulse.
export function makeGlowMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uPulse: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPulse;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float core = exp(-d * d * 18.0);
        float halo = exp(-d * 3.2) * (0.35 + uPulse * 0.4);
        float ring = smoothstep(0.02, 0.0, abs(d - 0.55 - uPulse * 0.2)) * 0.25;
        float a = (core + halo + ring) * smoothstep(1.0, 0.8, d);
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
}
