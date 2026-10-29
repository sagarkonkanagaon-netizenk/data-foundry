import * as THREE from "three";

// Record particles. Positions come from the flow sim; the shader adds the jitter
// (curl-like noise, strongest in Bronze), the soft glow and the hover highlight.
export function makeParticleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 400 },
      uSize: { value: 0.055 },
      uHover: { value: -1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uScale;
      uniform float uSize;
      uniform float uHover;
      attribute float aAlpha;
      attribute float aJitter;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vHover;
      vec3 swirl(vec3 p, float t) {
        // cheap divergence-free-ish field: curl of a few sines
        return vec3(
          sin(p.y * 7.0 + t * 3.1) - cos(p.z * 6.0 - t * 2.3),
          sin(p.z * 8.0 - t * 2.7) - cos(p.x * 5.0 + t * 3.7),
          sin(p.x * 6.5 + t * 2.1) - cos(p.y * 7.5 - t * 3.3)
        );
      }
      void main() {
        vec3 p = position + swirl(position, uTime) * 0.045 * aJitter;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float hov = float(abs(float(gl_VertexID) - uHover) < 0.5);
        gl_PointSize = uSize * uScale * (1.0 + hov * 2.5) / -mv.z;
        vColor = color;
        vAlpha = aAlpha;
        vHover = hov;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vHover;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float core = smoothstep(0.35, 0.0, d);
        float glow = smoothstep(1.0, 0.0, d) * 0.35;
        float ring = vHover * smoothstep(0.08, 0.0, abs(d - 0.8));
        float a = (core + glow) * vAlpha + ring;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor * (core * 1.6 + glow) + vec3(ring), a);
      }
    `,
  });
}
