import * as THREE from "three";

// Soft volumetric-looking cone: brightest at the apex, fading toward the base and at
// grazing angles. Used for the Sentinel's scan light and the ambient light shafts.
export function makeBeamMaterial(color: string, opacity = 0.18) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float along = pow(vUv.y, 1.6);                 // 1 at apex, 0 at base
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float streak = 0.85 + 0.15 * sin(vUv.x * 60.0 + uTime * 0.7);
        float a = along * pow(facing, 1.5) * streak * uOpacity;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
}
