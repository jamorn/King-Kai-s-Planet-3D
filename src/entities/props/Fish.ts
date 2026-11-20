// src/entities/props/Fish.ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * ปลากระพง/ปลาตะเพียน procedural (พอร์ตจาก fix/ref.html — "Procedural Fish")
 *
 * จุดเด่น:
 *  - Geometry สร้างจาก CatmullRomCurve3 ตามสันหลัง/ท้อง/ข้าง ปีก/หาง (ฟิน) รวมเป็นชิ้นเดียว
 *  - Material เป็น MeshPhongMaterial ที่ customize shader (onBeforeCompile)
 *    เพื่อให้ตัวว่าย (body wave) ตามเวลา และวาดลาย/ตา/เหงือก/ครีบด้วย vUv
 *  - ใช้ Uniform `time` วนว่ายอัตโนมัติ
 *
 * ไฟล์นี้ encapsulate ทุกอย่างในคลาสเดียว (รันได้เองโดยไม่พึ่งพา scene ภายนอก)
 */

let sharedGeometryCache: THREE.BufferGeometry | null = null;
var _shaderNoise = `
  float N (vec2 st) {
      return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
  }
  float smoothNoise( vec2 ip ){
      vec2 lv = fract( ip );
      vec2 id = floor( ip );
      lv = lv * lv * ( 3. - 2. * lv );
      float bl = N( id );
      float br = N( id + vec2( 1, 0 ));
      float b = mix( bl, br, lv.x );
      float tl = N( id + vec2( 0, 1 ));
      float tr = N( id + vec2( 1, 1 ));
      float t = mix( tl, tr, lv.x );
      return mix( b, t, lv.y );
  }
`;

/**
 * สร้าง Geometry ปลาแบบ procedural (cache ไว้ใช้ร่วมกันทุกตัว ประหยัด GPU)
 */
function createFishGeometry(): THREE.BufferGeometry {
  if (sharedGeometryCache) return sharedGeometryCache;

  const divisions = 200;

  const topCurve = new THREE.CatmullRomCurve3(
    [
      [0, 0],
      [0.1, 0.15],
      [1, 0.75],
      [3.5, 1.5],
      [9, 0.5],
      [9.5, 0.45],
      [10, 0.55],
    ].map((p) => new THREE.Vector3(p[0], p[1], 0)),
  );
  const topPoints = topCurve.getSpacedPoints(100);

  const bottomCurve = new THREE.CatmullRomCurve3(
    [
      [0, 0],
      [0.1, -0.15],
      [0.5, -0.35],
      [4.5, -1],
      [8, -0.6],
      [9.5, -0.45],
      [10, -0.55],
    ].map((p) => new THREE.Vector3(p[0], p[1], 0)),
  );
  const bottomPoints = bottomCurve.getSpacedPoints(100);

  const sideCurve = new THREE.CatmullRomCurve3(
    [
      [0, 0, 0],
      [0.1, 0, 0.125],
      [1, 0, 0.375],
      [4, -0.25, 0.6],
      [8, 0, 0.25],
      [10, 0, 0.05],
    ].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const sidePoints = sideCurve.getSpacedPoints(100);

  const frames = computeFrames();
  const pts: number[] = [];
  const parts: number[] = [];
  frames.forEach((f) => {
    f.forEach((p) => {
      pts.push(p.x, p.y, p.z);
      parts.push(0);
    });
  });

  // ===== หาง =====
  const tailCurve = new THREE.CatmullRomCurve3(
    [
      [11, -1],
      [12.5, -1.5],
      [12, 0],
      [12.5, 1.5],
      [11, 1],
    ].map((p) => new THREE.Vector3(p[0], p[1], p[2])),
  );
  const tailPoints = tailCurve.getPoints(divisions / 2);
  const tailPointsRev = tailPoints.map((p) => p).reverse();
  tailPointsRev.shift();
  const fullTailPoints = tailPoints.concat(tailPointsRev);

  const tailfinSlices = 5;
  const tailRatioStep = 1 / tailfinSlices;
  const vTemp = new THREE.Vector3();
  const tailPts: number[] = [];
  const tailParts: number[] = [];
  for (let i = 0; i <= tailfinSlices; i++) {
    const ratio = i * tailRatioStep;
    frames[frames.length - 1].forEach((p, idx) => {
      vTemp.lerpVectors(p, fullTailPoints[idx], ratio);
      tailPts.push(vTemp.x, vTemp.y, vTemp.z);
      tailParts.push(1);
    });
  }
  const gTail = new THREE.PlaneGeometry(1, 1, divisions, tailfinSlices);
  gTail.setAttribute("position", new THREE.Float32BufferAttribute(tailPts, 3));
  gTail.setAttribute("parts", new THREE.Float32BufferAttribute(tailParts, 1));
  gTail.computeVertexNormals();

  // ===== ครีบหลัง/ท้อง/เชิงกราน =====
  const dorsalCurve = new THREE.CatmullRomCurve3(
    [
      [3, 1.45],
      [3.25, 2.25],
      [3.75, 3],
      [6, 2],
      [7, 1],
    ].map((p) => new THREE.Vector3(p[0], p[1], 0)),
  );
  const dorsalPoints = dorsalCurve.getSpacedPoints(100);
  const gDorsal = createFin(topPoints, dorsalPoints, true);

  const rectCurve = new THREE.CatmullRomCurve3(
    [
      [6, -0.9],
      [7.25, -1.5],
      [7.5, -0.75],
    ].map((p) => new THREE.Vector3(p[0], p[1], 0)),
  );
  const rectPoints = rectCurve.getSpacedPoints(40);
  const gRect = createFin(bottomPoints, rectPoints, false);

  const pelvicCurve = new THREE.CatmullRomCurve3(
    [
      [2.25, -0.7],
      [3.75, -2],
      [4, -1],
    ].map((p) => new THREE.Vector3(p[0], p[1], 0)),
  );
  const pelvicPoints = pelvicCurve.getSpacedPoints(40);
  const gPelvic = createFin(bottomPoints, pelvicPoints, false);
  gPelvic.translate(0, 0.6, 0);
  const gPelvicL = gPelvic.clone();
  gPelvicL.rotateX(THREE.MathUtils.degToRad(-20));
  gPelvicL.translate(0, -0.6, 0);
  const gPelvicR = gPelvic.clone();
  gPelvicR.rotateX(THREE.MathUtils.degToRad(20));
  gPelvicR.translate(0, -0.6, 0);

  // ===== ลำตัว =====
  const bodyGeom = new THREE.PlaneGeometry(1, 1, divisions, frames.length - 1);
  bodyGeom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  bodyGeom.setAttribute("parts", new THREE.Float32BufferAttribute(parts, 1));
  bodyGeom.computeVertexNormals();

  const merged = mergeGeometries(
    [bodyGeom, gTail, gDorsal, gRect, gPelvicL, gPelvicR],
    false,
  );
  if (!merged) {
    throw new Error("[Fish] ไม่สามารถรวม geometry ของปลาได้");
  }

  merged.computeBoundingBox();
  sharedGeometryCache = merged;
  return merged;

  // ----- helper functions (closures) -----

  function createFin(
    basePoints: THREE.Vector3[],
    contourPoints: THREE.Vector3[],
    isTop: boolean,
  ): THREE.BufferGeometry {
    const basePts: THREE.Vector3[] = [];
    const shift = 0.05;
    const shiftSign = isTop ? 1 : -1;
    const vAdd = new THREE.Vector3(0, -shift * shiftSign, 0);
    contourPoints.forEach((p) => {
      basePts.push(getPoint(basePoints, p.x).add(vAdd));
    });
    const basePtsRev = basePts.map((p) => p.clone()).reverse();
    basePtsRev.shift();
    const contourPointsRev = contourPoints.map((p) => p.clone()).reverse();
    contourPointsRev.shift();
    basePts.forEach((p, idx, arr) => {
      if (idx > 0 && idx < arr.length - 1) p.setZ(shift * shiftSign);
    });
    basePtsRev.forEach((p, idx, arr) => {
      if (idx < arr.length - 1) p.setZ(-shift * shiftSign);
    });
    let fullPoints: THREE.Vector3[] = [];
    fullPoints = fullPoints.concat(
      contourPoints,
      contourPointsRev,
      basePts,
      basePtsRev,
    );
    const ps: number[] = [];
    const parts: number[] = [];
    fullPoints.forEach((p) => {
      ps.push(p.x, p.y, p.z);
      parts.push(1);
    });
    const plane = new THREE.PlaneGeometry(
      1,
      1,
      (contourPoints.length - 1) * 2,
      1,
    );
    plane.setAttribute("position", new THREE.Float32BufferAttribute(ps, 3));
    plane.setAttribute("parts", new THREE.Float32BufferAttribute(parts, 1));
    plane.computeVertexNormals();
    return plane;
  }

  function computeFrames(): THREE.Vector3[][] {
    const f: THREE.Vector3[][] = [];
    const step = 0.05;
    f.push(new Array(divisions + 1).fill(0).map(() => new THREE.Vector3()));
    for (let i = step; i < 10; i += step) {
      f.push(getFrame(i));
    }
    f.push(getFramePoints(topPoints[100], bottomPoints[100], sidePoints[100]));
    return f;
  }

  function getFrame(x: number): THREE.Vector3[] {
    const top = getPoint(topPoints, x);
    const bottom = getPoint(bottomPoints, x);
    const side = getPoint(sidePoints, x);
    return getFramePoints(top, bottom, side);
  }

  function getFramePoints(
    top: THREE.Vector3,
    bottom: THREE.Vector3,
    side: THREE.Vector3,
  ): THREE.Vector3[] {
    const sideR = side;
    const sideL = sideR.clone().setZ(sideR.z * -1);
    const baseCurve = new THREE.CatmullRomCurve3(
      [bottom, sideR, top, sideL],
      true,
    );
    return baseCurve.getSpacedPoints(divisions);
  }

  function getPoint(curvePoints: THREE.Vector3[], x: number): THREE.Vector3 {
    const v = new THREE.Vector3();
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const i1 = curvePoints[i];
      const i2 = curvePoints[i + 1];
      if (x >= i1.x && x <= i2.x) {
        const a = (x - i1.x) / (i2.x - i1.x);
        return v.lerpVectors(i1, i2, a);
      }
    }
    return v;
  }
}

/**
 * สร้าง Material ปลา procedural (ว่ายน้ำได้เองด้วย uniform time)
 * onBeforeCompile → inject body wave + ลายผิว (ตา/เหงือก/ครีบ/สะท้อนแสง caustic)
 */
function createFishMaterial(color: number): THREE.MeshPhongMaterial {
  const m = new THREE.MeshPhongMaterial({
    color,
    wireframe: false,
    shininess: 120,
    specular: 0xffffff,
  });

  m.defines = { USE_UV: " " };
  m.userData = {
    uniforms: {
      time: { value: 0 },
      totalLength: { value: 12 },
    },
  };

  m.onBeforeCompile = (shader) => {
    shader.uniforms.time = m.userData.uniforms.time;
    shader.uniforms.totalLength = m.userData.uniforms.totalLength;

    shader.vertexShader = `
      uniform float time;
      uniform float totalLength;
      attribute float parts;
      varying float vParts;
      varying vec4 vPos;
      varying vec3 vN;
      float getWave(float x){
          float currX = mod(x - (time * 4.), 3.1415926535 * 2.);
          return sin(currX) * 0.375 * pow((x / totalLength), 2.);
      }
      float getAngle(float x){
          float d = 0.001;
          float dz = getWave(x + d) - getWave(x);
          return atan( dz, d );
      }
      mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
      }
      vec3 rotate(vec3 v, vec3 axis, float angle) {
          mat4 m = rotationMatrix(axis, angle);
          return (m * vec4(v, 1.0)).xyz;
      }
      ${shader.vertexShader}
    `
      .replace(
        `#include <beginnormal_vertex>`,
        `#include <beginnormal_vertex>
          float ang = getAngle(position.x);
          objectNormal = normalize(rotate(vec3(normal), vec3(0, 1, 0), ang));
          vN = objectNormal;
        `,
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
          vParts = parts;
          transformed.z += getWave(position.x);
          vPos = modelMatrix * vec4(transformed, 1.0);
        `,
      );

    shader.fragmentShader = `
      uniform float time;
      varying float vParts;
      varying vec4 vPos;
      varying vec3 vN;
      ${_shaderNoise}
      ${shader.fragmentShader}
    `
      .replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
          vec3 col = diffuse;
          float parts = floor(vParts + 0.01);
          if (parts == 0.){
              col = diffuse;
              float wave = sin(vUv.y * PI2 * 6.) * 0.5 + 0.5;
              col *= wave * 0.25 + 0.85;
              col = mix(diffuse, col, smoothstep(0.9, 0.5, abs(vUv.x - 0.5) * 2.));
              col = mix(col, diffuse * 0.65, smoothstep(0.2, 0.0, vUv.y));
              float head = abs(sin(vUv.x * PI2));
              head = head * 0.05 + 0.175;
              col = mix(diffuse * 0.7, col, smoothstep(1. - head, 1. - (head + 0.025), vUv.y));
              vec2 eyeUv = vUv;
              eyeUv.x = abs(vUv.x - 0.5) * 0.35;
              float eyeDist = distance(vec2(0.07, 0.875), eyeUv);
              float eye = smoothstep(0.02, 0.0175, eyeDist);
              col = mix(col, vec3(1, 1, 0) * 0.5, eye);
              eye = smoothstep(0.015, 0.0125, eyeDist);
              col = mix(col, vec3(0.1), eye);
              vec2 mouthUv = vUv;
              mouthUv.x = abs(vUv.x - 0.5) * 2.;
              mouthUv.x -= mouthUv.y * 0.25;
              float mouth = 1. - (cos(mouthUv.x * PI2) * 0.5 + 0.5);
              mouth = pow(mouth, 64.) * 0.05 + 0.001;
              mouth = 1. - mouth;
              col = mix(diffuse * 0.4, col, smoothstep(mouth, mouth - 0.001, mouthUv.y));
          }
          if (parts == 1.){
              col = (vec3(0.375, 0.1, 0.05) * 4.5) * diffuse;
              float wave = sin(vUv.x * PI2 * 70.) * 0.5 + 0.5;
              wave *= sin(vUv.y * PI2 * 5.) * 0.5 + 0.5;
              col *= wave * 0.35 + 0.85;
              vec2 tailUv = vUv;
              tailUv.y -= 0.5;
              tailUv.y = abs(tailUv.y) * 2.;
              col = mix(diffuse * 0.25, col, smoothstep(1., 0.5, tailUv.y));
          }
          vec4 diffuseColor = vec4( col, opacity );
        `,
      )
      .replace(
        `#include <dithering_fragment>`,
        `#include <dithering_fragment>
          vec2 cPos = vPos.xz - (1, 0.25) * vPos.y;
          vec2 cUv = (cPos - vec2(time * 1.5, 0.));
          float caustic = abs(smoothNoise(cUv) - 0.5);
          caustic = pow(smoothstep(0.5, 0., caustic), 2.);
          float causticFade = smoothNoise(cPos - vec2(time, 0.));
          caustic *= causticFade;
          float causticShade = clamp(dot(normalize(vec3(1, 1, 0.25)), vN), 0., 1.);
          caustic *= causticShade;
          gl_FragColor.rgb += vec3(caustic) * 0.25;
        `,
      );
  };

  return m;
}

/**
 * ปลาตัวเดียว — Mesh ที่ว่ายน้ำได้เอง (ผ่าน uniform time) และค่อยๆ อัปเดตทิศทาง
 * ให้ว่ายวนเป็นวงกลมภายในบ่อ
 */
class FishMesh extends THREE.Mesh {
  /** รัศมีวงกลมที่ว่าย */
  private orbitRadius: number;
  /** มุมปัจจุบันบนวงกลม (radian) */
  private angle: number;
  /** ความเร็วเชิงมุม (radian/วินาที) */
  private angularSpeed: number;
  /** ระดับความสูงของตัวปลา (y) */
  private swimHeight: number;
  /** เฟสของการกระเพื่อมขึ้นลง */
  private bobPhase: number;
  /** จำนวนเวลา private clock */
  private elapsed: number;

  constructor(
    geometry: THREE.BufferGeometry,
    color: number,
    scale: number,
    orbitRadius: number,
    swimHeight: number,
  ) {
    super(geometry, createFishMaterial(color));

    this.orbitRadius = orbitRadius;
    this.angle = Math.random() * Math.PI * 2;
    this.angularSpeed = (0.4 + Math.random() * 0.4) * 0.6;
    this.swimHeight = swimHeight;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.elapsed = 0;

    this.scale.setScalar(scale);
  }

  /**
   * อัปเดตตำแหน่งการว่าย (เรียกทุกเฟรม)
   * - ปลาว่ายเป็นวงกลมในแนวนอน
   * - มีการเด้งขึ้นลงเล็กน้อย (bob)
   * - หันหัวตามทิศทางการว่าย
   */
  public swim(deltaTime: number, elapsedTime: number): void {
    this.elapsed += deltaTime;
    this.angle += this.angularSpeed * deltaTime;

    const x = Math.cos(this.angle) * this.orbitRadius;
    const z = Math.sin(this.angle) * this.orbitRadius;
    const bob = Math.sin(elapsedTime * 2.5 + this.bobPhase) * 0.02;

    this.position.set(x, this.swimHeight + bob, z);

    // ---- หันหัวปลาให้ชี้ตามทิศทางการเคลื่อนที่ ----
    // geometry: หัวอยู่ที่ +X, หางอยู่ที่ x≈12 → forward ของปลาคือ +X
    // ทิศเคลื่อนที่จริงของตำแหน่ง (cos, sin) ตามเวลา = derivative:
    //   dX/dt = -sin(angle) * angularSpeed
    //   dZ/dt =  cos(angle) * angularSpeed
    // (ใช้ angularSpeed ตรงๆ ไม่เดา sign → หัวชี้ตามทิศที่ตำแหน่งกำลังเคลื่อนไปจริง)
    const velX = -Math.sin(this.angle) * this.angularSpeed;
    const velZ = Math.cos(this.angle) * this.angularSpeed;
    // three.js: rotation.y = θ หมุน +X ไปทาง (cosθ, 0, -sinθ)
    // ต้องให้ (cosθ, -sinθ) ∝ (velX, velZ) → θ = atan2(-velZ, velX)
    if (Math.abs(velX) + Math.abs(velZ) > 1e-6) {
      this.rotation.y = Math.atan2(-velZ, velX);
    }

    // อัปเดต uniform time ให้ตัวปลาโบกตัว
    const mat = this.material as THREE.MeshPhongMaterial;
    const uniforms = (
      mat.userData as { uniforms?: { time?: { value: number } } }
    ).uniforms;
    if (uniforms?.time) {
      uniforms.time.value = elapsedTime * 1.5;
    }
  }
}

/**
 * กลุ่มปลาในบ่อน้ำ (implements IUpdatable เพื่อให้ SceneManager สั่ง update อัตโนมัติ)
 */
export class Fish extends THREE.Group {
  /** สีปลา 3 ตัว ให้ดูแตกต่างกันชัด (แดง/ส้ม/ฟ้า) */
  private static readonly COLORS = [0xff5544, 0xffaa33, 0x44ccff];

  constructor(count: number = 3, wellRadius: number = 0.5) {
    super();

    const geometry = createFishGeometry();
    const orbitRadius = Math.max(0.1, wellRadius * 0.55);

    for (let i = 0; i < count; i++) {
      const color = Fish.COLORS[i % Fish.COLORS.length];
      const scale = (0.018 + Math.random() * 0.006) * (0.9 + i * 0.08);
      const fish = new FishMesh(
        geometry,
        color,
        scale,
        orbitRadius * (0.6 + Math.random() * 0.4),
        0.06, // อยู่ใต้ผิวน้ำเล็กน้อย (บ่อสูง 0.32)
      );
      // กระจายมุมเริ่มต้นให้ไม่ซ้อนกัน
      fish.rotation.y = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      this.add(fish);
    }
  }

  /**
   * อัปเดตการว่ายของปลาทุกตัว (SceneManager เรียกอัตโนมัติผ่าน IUpdatable duck-typing)
   */
  public update(deltaTime: number, elapsedTime: number): void {
    this.children.forEach((child) => {
      if (child instanceof FishMesh) {
        child.swim(deltaTime, elapsedTime);
      }
    });
  }
}
