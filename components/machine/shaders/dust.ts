import * as THREE from "three";

// Slow-drifting dust motes. Motion is computed in the vertex shader, so the CPU never
// touches the buffer after creation.
export function makeDustMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color("#9fb6cc") },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * 0.04 + aSeed * 40.0;
        p.x += sin(t * 0.7 + aSeed * 13.0) * 0.6 + uTime * 0.02;
        p.y += sin(t * 0.5 + aSeed * 7.0) * 0.4;
        p.z += cos(t * 0.6 + aSeed * 3.0) * 0.5;
        p.x = mod(p.x + 20.0, 40.0) - 20.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = mix(0.6, 2.2, fract(aSeed * 91.7));
        gl_PointSize = size * uPixelRatio * (18.0 / -mv.z);
        float twinkle = 0.55 + 0.45 * sin(uTime * 0.6 + aSeed * 50.0);
        vAlpha = twinkle * smoothstep(40.0, 8.0, -mv.z) * 0.55;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
}
