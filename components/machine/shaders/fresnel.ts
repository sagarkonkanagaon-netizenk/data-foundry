import * as THREE from "three";

// Thin bright edges on glass: a fresnel rim plus a slow scan band that drifts up the
// vessel, like a calibration sweep. Rendered additively on a shell over the glass.
export function makeFresnelMaterial(color: string, { power = 3.2, intensity = 1.4, scan = 0.35 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
      uScan: { value: scan },
      uTime: { value: 0 },
      uAlert: { value: 0 },
      uAlertColor: { value: new THREE.Color("#d0645f") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vObj;
      void main() {
        vObj = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uAlertColor;
      uniform float uPower;
      uniform float uIntensity;
      uniform float uScan;
      uniform float uTime;
      uniform float uAlert;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vObj;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
        // scan band travelling up the object's local y
        float band = fract(vObj.y * 0.18 - uTime * 0.045);
        float scan = smoothstep(0.0, 0.015, band) * (1.0 - smoothstep(0.015, 0.06, band));
        vec3 col = mix(uColor, uAlertColor, uAlert);
        float a = f * uIntensity + scan * uScan * (0.25 + f);
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });
}
