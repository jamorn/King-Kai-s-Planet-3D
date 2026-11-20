// src/entities/vehicles/KaiCar.ts
import * as THREE from "three";
import { OrbitingEntity } from "../base/OrbitingEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";
import { SymmetryHelper } from "../../utils/SymmetryHelper";

/**
 * คลาสสร้างรถคลาสสิกสีแดงหลังคาขาวของท่านไคโอ (King Kai's Classic Car)
 * สืบทอดจาก OrbitingEntity เพื่อวิ่งวนรอบถนนวงแหวนอัตโนมัติ
 */
export class KaiCar extends OrbitingEntity {
  private wheels: THREE.Object3D[];

  constructor(
    orbitRadius: number = 10.03,
    orbitSpeed: number = 0.45,
    initialAngle: number = 0,
    planeTiltEuler: THREE.Euler = new THREE.Euler(0.25, 0, -0.45),
  ) {
    super(orbitRadius, orbitSpeed, initialAngle, planeTiltEuler);

    // ⚠️ สำคัญมาก: base class ไม่ได้เรียก build() ใน constructor แล้ว
    // จึงต้องกำหนด field ของตัวเองให้ครบก่อน แล้วค่อย initialize() ให้ build() รัน
    this.wheels = [];
    this.initialize();
    this.applyInitialOrbit();
  }

  /**
   * ประกอบชิ้นส่วนรถคลาสสิก 1950s (ตัวถังแดง, หลังคาขาว, ไฟหน้า/ท้ายแบบ Mirror, ล้อ 4 ล้อ)
   */
  protected build(): void {
    const redMat = MaterialLibrary.get(
      "carRed",
      () => new THREE.MeshStandardMaterial({ color: 0xd32f2f }),
    );
    const whiteMat = MaterialLibrary.get(
      "whiteTrim",
      () => new THREE.MeshStandardMaterial({ color: 0xfafafa }),
    );
    const glassMat = MaterialLibrary.get(
      "darkInterior",
      () => new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    const tireMat = MaterialLibrary.get(
      "tireBlack",
      () => new THREE.MeshStandardMaterial({ color: 0x212121 }),
    );
    const goldMat = MaterialLibrary.get(
      "orangeRoof",
      () => new THREE.MeshStandardMaterial({ color: 0xf39c12 }),
    );

    // 1. ตัวถังรถท่อนล่างสีแดง (หันหน้ารถไปทางแกน +Z)
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.38, 1.85),
      redMat,
    );
    chassis.position.y = 0.32;

    // 2. ห้องโดยสารท่อนบนสีขาว
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.34, 0.95),
      whiteMat,
    );
    cabin.position.set(0, 0.66, -0.1);

    // 3. กระจกหน้าและกระจกหลังสีเข้ม
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.24, 0.98),
      glassMat,
    );
    windshield.position.set(0, 0.66, -0.1);

    // 4. กันชนหน้า-หลังสีขาว (สร้างกันชนหน้า 1 ชิ้น แล้ว Mirror ไปด้านหลัง)
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.12, 0.14),
      whiteMat,
    );
    frontBumper.position.set(0, 0.22, 0.96);
    const rearBumper = SymmetryHelper.mirror(frontBumper, "z");

    // 5. ไฟหน้าทรงกลมคู่ซ้าย-ขวา (สร้าง 1 ดวง แล้ว Mirror ไปอีกข้าง)
    const headlightGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 12);
    headlightGeo.rotateX(Math.PI / 2);
    const leftHeadlight = new THREE.Mesh(headlightGeo, goldMat);
    leftHeadlight.userData.noShadow = true; // หลอดไฟ (เปล่งแสง) ไม่ควรทิ้งเงา
    const headlights = SymmetryHelper.createSymmetricPair(
      leftHeadlight,
      -0.3,
      0.38,
      0.93,
    );

    // 6. ล้อรถ 4 ล้อ (ปั้น 1 ล้อ แล้วแตกออกเป็น 4 มุมด้วย createQuadSymmetric!)
    const wheelUnit = this.createWheelUnit(tireMat, whiteMat);
    const fourWheels = SymmetryHelper.createQuadSymmetric(
      wheelUnit,
      -0.48,
      0.18,
      0.56,
    );

    // เก็บ Reference ของล้อทั้ง 4 ไว้สำหรับสั่งหมุนตอนรถวิ่ง
    fourWheels.traverse((child) => {
      if (child.name === "car-wheel") {
        this.wheels.push(child);
      }
    });

    this.add(
      chassis,
      cabin,
      windshield,
      frontBumper,
      rearBumper,
      headlights,
      fourWheels,
    );
  }

  /**
   * สร้างชุดล้อ 1 ข้าง (ยางสีดำ + กระทะล้อสีขาวตรงกลาง)
   */
  private createWheelUnit(
    tireMat: THREE.Material,
    hubMat: THREE.Material,
  ): THREE.Group {
    const wheelGroup = new THREE.Group();
    wheelGroup.name = "car-wheel";

    const tireGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);

    const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.15, 12);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, hubMat);

    wheelGroup.add(tire, hub);
    return wheelGroup;
  }

  /**
   * อัปเดตตำแหน่งรถตามวงโคจร (เรียก super.update) พร้อมหมุนล้อทั้ง 4 ตามความเร็วรถ
   */
  public override update(deltaTime: number, elapsedTime: number): void {
    super.update(deltaTime, elapsedTime);

    // คำนวณความเร็วเชิงเส้น (v = omega * r) เพื่อหมุนล้อให้สัมพันธ์กับระยะทางที่วิ่งจริง
    const linearSpeed = this.orbitSpeed * this.orbitRadius;
    const wheelRadius = 0.18;
    const wheelSpinDelta = (linearSpeed / wheelRadius) * deltaTime;

    for (const wheel of this.wheels) {
      wheel.rotation.x += wheelSpinDelta;
    }
  }
}
