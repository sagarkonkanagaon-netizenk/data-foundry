import * as THREE from "three";

// DAG task node: a thin-bordered holographic tile with scanlines.
// uActive 0..1 fills the tile; uDone tints it as completed.
export function makeHologramMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uActive: { value: 0 },
      uTime: { value: 0 },
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
      uniform float uActive;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 d = min(vUv, 1.0 - vUv);
        float edge = 1.0 - smoothstep(0.0, 0.06, min(d.x, d.y));
        float corner = step(min(d.x, d.y), 0.06) * step(max(d.x, d.y), 0.22);
        float scan = 0.6 + 0.4 * sin(vUv.y * 90.0 - uTime * 3.0);
        float fill = uActive * 0.55 * scan;
        float a = edge * (0.25 + 0.75 * uActive) + corner * 0.6 + fill;
        gl_FragColor = vec4(uColor * a, a * 0.9);
      }
    `,
  });
}
