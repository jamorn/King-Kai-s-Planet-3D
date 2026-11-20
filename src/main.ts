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

/**
 * วางวัตถุ SurfaceEntity ลงบนผิวดาว "ด้านหน้าประตูบ้าน" อย่างแม่นยำ
 * อ้างอิงทิศทางจริงของบ้านหลัง snapToSphere + rotateOnSurface:
 *   - forward = แกน +Z ของบ้าน (ทิศที่ประตูหันหน้าไป)
 *   - right   = แกน +X ของบ้าน (ทิศขวาของผู้ยืนหน้าประตู)
 * เลื่อนออกไปหน้าบ้านตาม forward + right แล้ว project กลับมาบนผิวดาว
 */
function placeWellInFrontOfHouse(
  entity: Well,
  house: THREE.Object3D,
  planetRadius: number = 10,
  options: {
    forwardDistance?: number;
    rightOffset?: number;
    sinkOffset?: number;
  } = {},
): void {
  const {
    forwardDistance = 3.2,
    rightOffset = 2.2,
    sinkOffset = 0.08,
  } = options;

  // 1. อ่าน basis ของบ้านใน world space
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

  // 6. หันหน้าบ่อน้ำเข้าหาตัวบ้าน
  entity.rotateOnSurface(Math.PI);
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

  // 3. สร้างโรงรถทรงครึ่งวงกลม (วางเยื้องไปด้านข้างของตัวบ้าน)
  const garage = new Garage();
  garage.snapToSphere(planetRadius, 0.32, 1.05, 0.18).rotateOnSurface(-0.4);
  engine.sceneManager.add(garage);

  // 4. สร้างพร็อพหน้าบ้าน: บ่อน้ำทรงกลม และ ม้านั่งยาวไม้
  // ⚠️ บ่อน้ำ: วาง "ด้านหน้าประตูบ้าน" โดยอิงทิศ forward/right จริงของบ้าน (หลัง snap+rotate)
  //    ไม่เดา azimuth ตายตัว → ไม่ทับ/ไม่ขวางประตู และเยื้องไปทางขวาของประตู
  const well = new Well();
  placeWellInFrontOfHouse(well, house);
  const bench = new Bench();
  bench.snapToSphere(planetRadius, 0.38, 0.48, 0.04).rotateOnSurface(0.15);

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
