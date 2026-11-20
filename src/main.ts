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
  const well = new Well();
  well.snapToSphere(planetRadius, 0.42, 0.12, 0.08);

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

  // คืนทรัพยากรเมื่อปิดหน้าเว็บ
  window.addEventListener("beforeunload", () => {
    engine.dispose();
  });
}

bootstrap();
