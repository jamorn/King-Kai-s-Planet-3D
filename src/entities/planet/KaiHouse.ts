// src/entities/planet/KaiHouse.ts
import * as THREE from "three";
import { SurfaceEntity } from "../base/SurfaceEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";
import { SymmetryHelper } from "../../utils/SymmetryHelper";

/**
 * คลาสสร้างบ้านทรงบังเกอร์/อิกลูของท่านไคโอ (Kai's House)
 * สืบทอดจาก SurfaceEntity เพื่อยึดติดกับผิวดาวและหันทิศทางได้อิสระ
 */
export class KaiHouse extends SurfaceEntity {
  constructor() {
    super();
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  protected build(): void {
    this.buildBunkerBody();
    this.buildRoofAndAntennas();
    this.buildArchEntrance();
    this.buildSideWindows();
  }

  /**
   * 1. ตัวบ้านหลักทรงบังเกอร์ลายอิฐสีส้ม-เหลือง (ใช้ LatheGeometry หมุนรอบแกน)
   */
  private buildBunkerBody(): void {
    const points: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(2.3, 0),
    ];

    // วาดเส้นโค้งพาราโบลาให้ผนังตั้งชันขึ้นแล้วค่อยสอบโค้งมนด้านบน
    const height = 2.4;
    const baseRadius = 2.3;
    const topRadius = 1.45;
    const segments = 16;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * height;
      // ใช้ฟังก์ชันยกกำลังเพื่อให้ทรงป่องช่วงล่างและสอบโค้งช่วงบนเหมือนบังเกอร์ในรูป
      const r = baseRadius - (baseRadius - topRadius) * Math.pow(t, 1.7);
      points.push(new THREE.Vector2(r, y));
    }
    points.push(new THREE.Vector2(0, height));

    const bodyGeo = new THREE.LatheGeometry(points, 36);
    const brickMat = MaterialLibrary.get(
      "houseBrick",
      () => new THREE.MeshStandardMaterial({ color: 0xf39c12 }),
    );

    const bodyMesh = new THREE.Mesh(bodyGeo, brickMat);
    this.add(bodyMesh);
  }

  /**
   * 2. หลังคาโดม 3 ชั้น (ขาว - ส้ม - ขาว) พร้อมเสาอากาศ 2 เส้น
   */
  private buildRoofAndAntennas(): void {
    const roofGroup = new THREE.Group();
    roofGroup.position.y = 2.35;

    const whiteMat = MaterialLibrary.get(
      "whiteTrim",
      () => new THREE.MeshStandardMaterial({ color: 0xfafafa }),
    );
    const orangeMat = MaterialLibrary.get(
      "orangeRoof",
      () => new THREE.MeshStandardMaterial({ color: 0xf39c12 }),
    );

    // ชั้นที่ 1: วงแหวนสีขาวฐานหลังคา
    const tier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.48, 0.25, 32),
      whiteMat,
    );
    tier1.position.y = 0.12;

    // ชั้นที่ 2: แถบสีส้มสดตรงกลาง
    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.25, 0.28, 32),
      orangeMat,
    );
    tier2.position.y = 0.38;

    // ชั้นที่ 3: ฝาครอบโดมสีขาวด้านบนสุด
    const tier3 = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      whiteMat,
    );
    tier3.scale.y = 0.45;
    tier3.position.y = 0.5;

    // เสาอากาศหลักตรงกลาง
    const mainAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 1.1, 8),
      whiteMat,
    );
    mainAntenna.position.set(0, 1.1, 0);

    // เสาอากาศรองด้านข้าง
    const subAntenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.03, 0.75, 8),
      whiteMat,
    );
    subAntenna.position.set(0.35, 0.9, -0.2);

    roofGroup.add(tier1, tier2, tier3, mainAntenna, subAntenna);
    this.add(roofGroup);
  }

  /**
   * 3. ซุ้มประตูทางเข้าด้านหน้า + ผ้าม่านสีม่วง (ใช้ Mirror ซ้าย-ขวา)
   */
  private buildArchEntrance(): void {
    const entranceGroup = new THREE.Group();
    entranceGroup.position.set(0, 0, 2.15);

    const whiteMat = MaterialLibrary.get(
      "whiteTrim",
      () => new THREE.MeshStandardMaterial({ color: 0xfafafa }),
    );
    const darkMat = MaterialLibrary.get(
      "darkInterior",
      () => new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    const purpleMat = MaterialLibrary.get(
      "purpleCurtain",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x9b59b6,
          side: THREE.DoubleSide,
        }),
    );

    // วาดซุ้มประตูโค้งรูปตัว U คว่ำด้วย ExtrudeGeometry
    const archShape = new THREE.Shape();
    archShape.moveTo(-0.65, 0);
    archShape.lineTo(-0.65, 0.85);
    archShape.absarc(0, 0.85, 0.65, Math.PI, 0, true);
    archShape.lineTo(0.65, 0);
    archShape.lineTo(0.45, 0);
    archShape.lineTo(0.45, 0.85);
    archShape.absarc(0, 0.85, 0.45, 0, Math.PI, false);
    archShape.lineTo(-0.45, 0);

    const archGeo = new THREE.ExtrudeGeometry(archShape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    });
    const archFrame = new THREE.Mesh(archGeo, whiteMat);

    // ฉากหลังมืดด้านในประตู
    const interior = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.25, 0.1),
      darkMat,
    );
    interior.position.set(0, 0.65, 0.15);

    // ผ้าม่านสีม่วง 1 ข้าง แล้วใช้ SymmetryHelper.mirror() สร้างอีกข้าง
    const curtainGeo = new THREE.CylinderGeometry(
      0.08,
      0.24,
      1.15,
      12,
      1,
      true,
      0,
      Math.PI,
    );
    const leftCurtain = new THREE.Mesh(curtainGeo, purpleMat);
    leftCurtain.position.set(-0.28, 0.58, 0.32);
    leftCurtain.rotation.z = -0.15; // รวบม่านเอียงไปด้านข้างเล็กน้อย

    const rightCurtain = SymmetryHelper.mirror(leftCurtain, "x");

    entranceGroup.add(archFrame, interior, leftCurtain, rightCurtain);
    this.add(entranceGroup);
  }

  /**
   * 4. หน้าต่างช่องยาวแนวนอนด้านข้าง (สร้าง 1 ข้าง แล้ว Mirror ไปอีกฝั่ง)
   */
  private buildSideWindows(): void {
    const darkMat = MaterialLibrary.get(
      "darkInterior",
      () => new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    const whiteMat = MaterialLibrary.get(
      "whiteTrim",
      () => new THREE.MeshStandardMaterial({ color: 0xfafafa }),
    );

    const windowUnit = new THREE.Group();

    // กรอบหน้าต่างสีขาวบางๆ
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.36, 1.15),
      whiteMat,
    );
    // ช่องกระจกสีเข้มด้านใน
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.21, 0.24, 1.02),
      darkMat,
    );

    windowUnit.add(frame, glass);

    // วางฝั่งซ้ายของตัวบ้านและเอียงรับกับความลาดชันของบังเกอร์
    windowUnit.position.set(-2.05, 1.05, 0.15);
    windowUnit.rotation.set(0, -0.1, -0.22);

    // ใช้ SymmetryHelper สร้างหน้าต่างฝั่งขวาแบบสมมาตรอัตโนมัติ
    const rightWindow = SymmetryHelper.mirror(windowUnit, "x");

    this.add(windowUnit, rightWindow);
  }
}
