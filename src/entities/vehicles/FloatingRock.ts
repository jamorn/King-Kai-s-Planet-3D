// src/entities/vehicles/FloatingRock.ts
import * as THREE from "three";
import { OrbitingEntity } from "../base/OrbitingEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";

/**
 * คลาสสร้างก้อนหินลอยฟ้ารอบดาวท่านไคโอ (Floating Debris / Asteroid)
 * สืบทอดจาก OrbitingEntity และเพิ่มการหมุนรอบตัวเอง (Self-Rotation) กับการลอยขึ้นลง
 */
export class FloatingRock extends OrbitingEntity {
  private rockMesh!: THREE.Mesh;
  private readonly spinSpeed: THREE.Vector3;
  private readonly bobFrequency: number;
  private readonly bobAmplitude: number;
  private readonly baseOrbitRadius: number;

  /**
   * @param orbitRadius รัศมีวงโคจรรอบดาว (ควรมากกว่า 11 เพื่อไม่ให้ชนผิวดาวรัศมี 10)
   * @param orbitSpeed ความเร็วในการโคจรรอบดาว
   * @param initialAngle มุมเริ่มต้นบนวงโคจร
   * @param planeTiltEuler การเอียงระนาบวงโคจร (ตั้งค่าให้หลากหลายเพื่อให้หินลอยกระจายรอบดาว)
   * @param rockScale ขนาดของก้อนหิน
   */
  constructor(
    orbitRadius: number = 13.5,
    orbitSpeed: number = 0.15,
    initialAngle: number = 0,
    planeTiltEuler: THREE.Euler = new THREE.Euler(0.4, 0.2, 0.3),
    rockScale: number = 0.45,
  ) {
    super(orbitRadius, orbitSpeed, initialAngle, planeTiltEuler);

    // ⚠️ base class ไม่ได้เรียก build() แล้ว → กำหนด field ทั้งหมดให้ครบก่อน
    // แล้วค่อย initialize() ให้ build() สร้างโมเดล (build() อ่าน field เหล่านี้ได้อย่างปลอดภัย)
    this.baseOrbitRadius = orbitRadius;
    this.spinSpeed = new THREE.Vector3(
      0.4 + Math.sin(initialAngle) * 0.3,
      0.6 + Math.cos(initialAngle) * 0.3,
      0.3,
    );
    this.bobFrequency = 1.5 + (initialAngle % 1);
    this.bobAmplitude = 0.25;

    this.scale.setScalar(rockScale);

    // กำหนด field ครบแล้ว → ค่อยสร้างโมเดล แล้วจัดตำแหน่งเริ่มต้นบนวงโคจร
    this.initialize();
    this.applyInitialOrbit();
  }

  /**
   * สร้างรูปทรงก้อนหินเหลี่ยมแบบ Low-Poly
   */
  protected build(): void {
    // ใช้ DodecahedronGeometry (ทรง 12 หน้า) แล้วปรับสเกลให้เบี้ยวเล็กน้อยเหมือนหินธรรมชาติ
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    rockGeo.scale(1.15, 0.85, 0.95);

    const rockMat = MaterialLibrary.get(
      "wood",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x6d4c41,
          roughness: 0.9,
          flatShading: true,
        }),
    );

    this.rockMesh = new THREE.Mesh(rockGeo, rockMat);
    this.add(this.rockMesh);
  }

  /**
   * อัปเดตตำแหน่งตามวงโคจร พร้อมขยับรัศมีขึ้น-ลงเบาๆ และหมุนก้อนหินรอบตัวเอง
   */
  public override update(deltaTime: number, elapsedTime: number): void {
    // 1. ขยับระยะห่างจากดาวขึ้น-ลงเป็นคลื่นไซน์ (Floating Effect)
    this.orbitRadius =
      this.baseOrbitRadius +
      Math.sin(elapsedTime * this.bobFrequency) * this.bobAmplitude;

    // 2. เรียกใช้การคำนวณวงโคจรจากคลาสแม่
    super.update(deltaTime, elapsedTime);

    // 3. หมุนตัวก้อนหินรอบตัวเองอย่างอิสระ
    if (this.rockMesh) {
      this.rockMesh.rotation.x += this.spinSpeed.x * deltaTime;
      this.rockMesh.rotation.y += this.spinSpeed.y * deltaTime;
      this.rockMesh.rotation.z += this.spinSpeed.z * deltaTime;
    }
  }
}
