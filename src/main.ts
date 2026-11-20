// src/main.ts
import * as THREE from "three";
import "./style.css";
import { AppEngine } from "./core/AppEngine";
import { KaiPlanet } from "./entities/planet/KaiPlanet";
import { KaiHouse } from "./entities/planet/KaiHouse";
import { Garage } from "./entities/planet/Garage";
import { KaiCar } from "./entities/vehicles/KaiCar";
import { FloatingRock } from "./entities/vehicles/FloatingRock";
import { Tree } from "./entities/props/Tree";
import { Well } from "./entities/props/Well";
import { Bench } from "./entities/props/Bench";
import type { SurfaceEntity } from "./entities/base/SurfaceEntity";

/**
 * คำนวณตำแหน่งบนผิวดาว "ด้านหน้าบ้าน" จากทิศ forward/right จริงของบ้าน
 * แล้ว snap วัตถุลงผิวดาวให้อัตโนมัติ (ใช้ร่วมกันทั้งบ่อน้ำและม้านั่ง)
 *
 * ขั้นตอน:
 *   1. อ่าน basis ของบ้านใน world space (forward = +Z, right = +X)
 *   2. ตัดองค์ประกอบ radial ออกให้ทั้งสองเวกเตอร์นอนบนระนาบ tangent
 *   3. เลื่อนจากจุดบ้านตาม forward + right แล้ว project กลับมาบนผิวดาว
 *   4. snapToSphere ที่ตำแหน่งนั้น
 *
 * @returns มุม spherical ที่วัตถุถูกวาง (เผื่อผู้เรียกอยากหมุนต่อ)
 */
function placeInFrontOfHouse(
  entity: SurfaceEntity,
  house: THREE.Object3D,
  planetRadius: number,
  opts: { forwardDistance: number; rightOffset: number; sinkOffset: number },
): THREE.Spherical {
  const { forwardDistance, rightOffset, sinkOffset } = opts;

  // 1. basis ของบ้านใน world space
  house.updateMatrixWorld();
  const houseQuat = house.getWorldQuaternion(new THREE.Quaternion());
  const houseForward = new THREE.Vector3(0, 0, 1).applyQuaternion(houseQuat);
  const houseRight = new THREE.Vector3(1, 0, 0).applyQuaternion(houseQuat);

  // 2. จุดอ้างอิงบนผิวดาว + surface normal
  const housePos = new THREE.Vector3().setFromMatrixPosition(house.matrixWorld);
  const surfaceNormal = housePos.clone().normalize();

  // 3. ตัดองค์ประกอบ radial ออกให้ forward/right นอนบนระนาบ tangent
  houseForward.addScaledVector(surfaceNormal, -houseForward.dot(surfaceNormal));
  houseRight.addScaledVector(surfaceNormal, -houseRight.dot(surfaceNormal));
  if (houseForward.lengthSq() < 1e-6) houseForward.copy(houseRight);
  houseForward.normalize();
  houseRight.normalize();

  // 4. เลื่อนออกไปหน้า + ขวา แล้ว project กลับมาบนผิวดาว
  const targetOnSurface = housePos
    .clone()
    .addScaledVector(houseForward, forwardDistance)
    .addScaledVector(houseRight, rightOffset)
    .normalize()
    .multiplyScalar(planetRadius);

  // 5. แปลงเป็นมุม spherical แล้ว snap ลงผิวดาว
  const spherical = new THREE.Spherical().setFromVector3(targetOnSurface);
  entity.snapToSphere(planetRadius, spherical.phi, spherical.theta, sinkOffset);

  return spherical;
}

/**
 * วางบ่อน้ำลงบนผิวดาวด้านหน้าประตูบ้าน เยื้องไปทางขวา และหันหน้าเข้าหาบ้าน
 */
function placeWellInFrontOfHouse(
  entity: Well,
  house: THREE.Object3D,
  planetRadius: number = 10,
): void {
  // ระยะปลอดภัย: หน้าบ้าน 3.2 + เยื้องขวา 2.2 (ไม่ทับรัศมีบ้าน ~2.3)
  placeInFrontOfHouse(entity, house, planetRadius, {
    forwardDistance: 3.2,
    rightOffset: 2.2,
    sinkOffset: 0.08,
  });
  // หันหน้าบ่อน้ำเข้าหาตัวบ้าน
  entity.rotateOnSurface(Math.PI);
}

/**
 * วางม้านั่งลงบนผิวดาวด้านหน้าบ้าน เยื้องไปทาง "ซ้าย" (ตรงข้ามบ่อน้ำ)
 * ระยะห่างมากพอ (หน้าบ้าน 3.6) เพื่อไม่ให้แผ่นไม้/ขาจมเข้าไปในผนังบ้าน
 */
function placeBenchInFrontOfHouse(
  entity: Bench,
  house: THREE.Object3D,
  planetRadius: number = 10,
): void {
  placeInFrontOfHouse(entity, house, planetRadius, {
    forwardDistance: 3.6, // ม้านั่งอยู่หน้าบ้านแต่ไกลกว่าบ่อน้ำเล็กน้อย
    rightOffset: -2.4, // เยื้องซ้าย (ตรงข้ามบ่อน้ำ)
    sinkOffset: 0.04,
  });
  // หันด้านยาวของม้านั่งให้ขนานกับหน้าบ้าน (หน้าเข้าหาบ้าน)
  entity.rotateOnSurface(Math.PI);
}

/**
 * หันวัตถุให้ "แกน +Z" (ปากโรงรถ/หน้าวัตถุ) ขนานกับแนวถนนวงแหวนที่จุดนั้น
 * ใช้คณิตศาสตร์เดียวกับ OrbitingEntity.updateOrbitTransform:
 *   1. tangent ของวงกลมที่จุดนั้น (บนระนาบ X-Z)
 *   2. หมุน tangent ด้วย roadTilt (ให้ขนานถนนจริงบนลูกโลก)
 *   3. สร้าง basis (right, up, forward) → setFromRotationMatrix
 *   4. snapToSphere ซ้ำเพื่อให้ตำแหน่ง/up ยังตั้งฉากผิวดาว แล้วค่อย set quaternion
 *
 * เป้าหมาย: รถที่วิ่งมาบนถนนจะหันจอดเข้าปากอุโมงค์ได้พอดี
 */
function orientAlongRoad(
  entity: SurfaceEntity,
  planetRadius: number,
  polarAngle: number,
  azimuthAngle: number,
  roadTilt: THREE.Euler,
  sinkOffset: number = 0.18,
): void {
  // 1. ตำแหน่งจริงของวัตถุหลัง snap (เพื่อให้ basis up ตรงผิวดาวจริง)
  entity.snapToSphere(planetRadius, polarAngle, azimuthAngle, sinkOffset);
  const upDir = entity.position.clone().normalize();

  // 2. tangent ของเส้นวงกลม ณ azimuth นี้ (ระนาบ X-Z)
  //    ⚠️ ใส่เครื่องหมายลบ ให้ปากโรงรถ (แกน +Z) หันไปทางเดียวกับที่รถวิ่งมาบนถนน
  //    (tangent ดิบ (-sin,0,cos) ชี้ทวนเข็ม → กลับด้านให้หันรับรถที่วิ่งตามเข็ม)
  const tangent = new THREE.Vector3(
    Math.sin(azimuthAngle),
    0,
    -Math.cos(azimuthAngle),
  );

  // 3. หมุน tangent ตาม roadTilt (ให้ขนานระนาบถนนจริงที่เอียง)
  const tiltQuat = new THREE.Quaternion().setFromEuler(roadTilt);
  tangent.applyQuaternion(tiltQuat);

  // 4. ตัดองค์ประกอบ radial ออกให้ tangent นอนบนระนาบ tangent ของผิวดาว
  tangent.addScaledVector(upDir, -tangent.dot(upDir));
  if (tangent.lengthSq() < 1e-6) {
    // fallback กรณี tangent ขนาน up (ไม่ควรเกิด) → ใช้แกน X world
    tangent.set(1, 0, 0).addScaledVector(upDir, -upDir.x);
  }
  tangent.normalize();

  // 5. สร้าง basis ตั้งฉาก: right = up × forward, forward = right × up
  const rightDir = new THREE.Vector3().crossVectors(upDir, tangent).normalize();
  const forwardDir = new THREE.Vector3()
    .crossVectors(rightDir, upDir)
    .normalize();

  const basis = new THREE.Matrix4().makeBasis(rightDir, upDir, forwardDir);
  entity.quaternion.setFromRotationMatrix(basis);
}

/**
 * ผูกปุ่มย่อ/ขยาย panel ข้อมูลดาว (info panel)
 * - คลิกหัว panel เพื่อสลับสถานะย่อ/ขยายได้เอง
 * - ตั้งค่าเริ่มต้นเป็น "ย่อ" แล้วค่อยเรียกมาจาก hideLoadingScreen
 *   เพื่อให้ panel ย่อ "หลัง" loading หายไปแล้วจริงๆ
 */
function setupInfoPanel(): () => void {
  const panel = document.getElementById("info-panel");
  const toggle = document.getElementById("info-panel-toggle");

  const setExpanded = (expanded: boolean): void => {
    panel?.classList.toggle("is-collapsed", !expanded);
    toggle?.setAttribute("aria-expanded", String(expanded));
  };

  // คลิกหัว panel → สลับสถานะ (ถ้ากำลังย่ออยู่ ให้ขยาย, ถ้าขยายอยู่ ให้ย่อ)
  toggle?.addEventListener("click", () => {
    const currentlyCollapsed =
      panel?.classList.contains("is-collapsed") ?? false;
    setExpanded(currentlyCollapsed);
  });

  // เริ่มต้นให้ panel ขยายเต็มก่อน (ระหว่าง loading) แล้วค่อยย่อทีหลัง
  setExpanded(true);

  // คืนฟังก์ชันสำหรับสั่งย่อ (ให้ hideLoadingScreen เรียกหลัง loading หาย)
  return () => setExpanded(false);
}

/**
 * ซ่อน Loading Screen หลังเฟรมแรก render เสร็จจริง
 * (รอ 2 เฟรมให้ GPU วาดเฟรมแรกเสร็จก่อน เพื่อไม่ให้เห็นจอว่างคั่นกลาง)
 *
 * @param onHidden  callback ที่จะเรียก "หลัง" loading จางหายเสร็จแล้ว
 *                  (ใช้ให้ info panel ค่อยย่อหลังผู้ใช้เห็นฉากจริงแล้ว)
 */
function hideLoadingScreen(onHidden?: () => void, minDurationMs = 1500): void {
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) {
    onHidden?.();
    return;
  }

  const startTime = performance.now();
  const FADE_MS = 800;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minDurationMs - elapsed);

      window.setTimeout(() => {
        loadingScreen.classList.add("is-hidden");
        window.setTimeout(() => {
          loadingScreen.remove();
          // แจ้ง caller ว่า loading หายแล้ว (ค่อยย่อ panel ตอนนี้)
          onHidden?.();
        }, FADE_MS);
      }, remaining);
    });
  });
}

/**
 * จุดเริ่มต้นของแอปพลิเคชัน (Application Bootstrap)
 * ประกอบวัตถุ Full OOP ทั้งหมดลงในฉากดาวท่านไคโอ
 */
function bootstrap(): void {
  const engine = new AppEngine("#app");
  const planetRadius = 10;

  // 1. สร้างดาวเคราะห์ท่านไคโอ + ถนนวงแหวนคาดเฉียง
  const planet = new KaiPlanet(planetRadius, new THREE.Euler(0.25, 0, -0.45));
  engine.sceneManager.add(planet);

  // 2. สร้างบ้านท่านไคโอ (วางบริเวณยอดบนของดาวและกดจมดินเล็กน้อยให้แนบสนิท)
  const house = new KaiHouse();
  house.snapToSphere(planetRadius, 0.18, 0.35, 0.25).rotateOnSurface(0.2);
  engine.sceneManager.add(house);

  // 3. สร้างโรงรถทรงครึ่งวงกลม (วางให้ห่างจากบ้านพอ ไม่ชนกัน)
  //    - ขยับ azimuth ออกห่างจากบ้านชัดเจน (บ้านอยู่ azimuth 0.35)
  //    - หัน "ปากอุโมงค์" (แกน +Z) ขนานกับแนวถนนวงแหวน เพื่อให้รถวิ่งเข้าจอดได้จริง
  const GARAGE_POLAR = 0.42;
  const GARAGE_AZIMUTH = 1.75;
  const garage = new Garage();
  garage.snapToSphere(planetRadius, GARAGE_POLAR, GARAGE_AZIMUTH, 0.18);
  orientAlongRoad(
    garage,
    planetRadius,
    GARAGE_POLAR,
    GARAGE_AZIMUTH,
    planet.roadTilt,
  );
  engine.sceneManager.add(garage);

  // 4. สร้างพร็อพหน้าบ้าน: บ่อน้ำทรงกลม และ ม้านั่งยาวไม้
  // ⚠️ ทั้งคู่วางโดยอิงทิศ forward/right จริงของบ้าน (หลัง snap+rotate) ไม่เดา azimuth
  //    → อยู่ด้านหน้าบ้าน เยื้องคนละฝั่ง และไม่ทับ/ไม่ขวางประตูหรือตัวบ้าน
  const well = new Well();
  placeWellInFrontOfHouse(well, house);

  // ม้านั่ง: อยู่หน้าบ้านแต่เยื้องไปทาง "ซ้าย" (ตรงข้ามบ่อน้ำ) ให้ห่างพอไม่จมผนังบ้าน
  const bench = new Bench();
  placeBenchInFrontOfHouse(bench, house);

  engine.sceneManager.add(well, bench);

  // 5. ปลูกต้นไม้พุ่มกลมกระจายรอบดาว (หลบแนวถนนวงแหวน)
  const treeConfigs: Array<{ polar: number; azimuth: number; scale: number }> =
    [
      { polar: 0.48, azimuth: -0.55, scale: 1.15 },
      { polar: 0.35, azimuth: 2.35, scale: 0.95 },
      { polar: 0.85, azimuth: 2.85, scale: 1.2 },
      { polar: 1.95, azimuth: 0.75, scale: 1.05 },
      { polar: 2.35, azimuth: -1.45, scale: 0.9 },
      { polar: 2.65, azimuth: 2.1, scale: 1.1 },
      { polar: 1.25, azimuth: -2.2, scale: 0.85 },
    ];

  for (const cfg of treeConfigs) {
    const tree = new Tree(cfg.scale);
    tree
      .snapToSphere(planetRadius, cfg.polar, cfg.azimuth, 0.12)
      .rotateOnSurface(cfg.azimuth);
    engine.sceneManager.add(tree);
  }

  // 6. สร้างรถคลาสสิกสีแดงวิ่งวนตามแนวถนนวงแหวน (ใช้มุมเอียงเดียวกับ planet.roadTilt)
  const classicCar = new KaiCar(planetRadius + 0.03, 0.45, 0, planet.roadTilt);
  engine.sceneManager.add(classicCar);

  // 7. สร้างก้อนหินลอยฟ้ารอบเกาะ 6 ก้อน ในวงโคจรและมุมเอียงที่ต่างกัน
  const rockCount = 6;
  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2;
    const rock = new FloatingRock(
      13.2 + (i % 3) * 1.1,
      0.12 + (i % 2) * 0.06,
      angle,
      new THREE.Euler(0.35 * ((i % 3) - 1), i * 0.5, 0.25),
      0.35 + (i % 3) * 0.15,
    );
    engine.sceneManager.add(rock);
  }

  // 8. เริ่มต้น Render Loop!
  engine.start();

  // 9. ตั้งค่า panel ข้อมูล (ได้ตัวสั่งย่อกลับมา) แล้วซ่อน Loading Screen
  //    → เมื่อ loading จางหายเสร็จ ค่อยย่อ panel เพื่อไม่ให้บังการแสดงผลดาว
  const collapseInfoPanel = setupInfoPanel();
  hideLoadingScreen(collapseInfoPanel);

  // คืนทรัพยากรเมื่อปิดหน้าเว็บ
  window.addEventListener("beforeunload", () => {
    engine.dispose();
  });
}

bootstrap();
