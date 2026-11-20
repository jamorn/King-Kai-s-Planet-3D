// src/entities/props/Well.ts
import * as THREE from "three";
import { SurfaceEntity } from "../base/SurfaceEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";
import { Fish } from "./Fish";

/**
 * คลาสสร้างบ่อน้ำทรงกลมขนาดเล็กหน้าบ้านท่านไคโอ (Kai's Stone Well)
 * สืบทอดจาก SurfaceEntity เพื่อนำไปวางบนผิวดาวหน้าตัวบ้าน
 *
 * ภายในบ่อมี "ผิวน้ำใส" (โปร่งแสง + สะท้อนแสง) และ "ปลา 3 ตัว" ว่ายวนอัตโนมัติ
 */
export class Well extends SurfaceEntity {
  /** กลุ่มปลาในบ่อ (ต้องเก็บไว้เพื่ออัปเดตการว่ายทุกเฟรม) */
  private fishes!: Fish;

  /** รัศมีภายในของบ่อ (ใช้กำหนดวงว่ายของปลา) */
  private static readonly INNER_RADIUS = 0.56;
  /** ระดับผิวน้ำ (ความสูงจากก้นบ่อ) */
  private static readonly WATER_LEVEL = 0.32;

  constructor() {
    super();
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  protected build(): void {
    this.buildStoneRim();
    this.buildWaterSurface();
    this.buildFishes();
  }

  /**
   * 1. ขอบบ่อน้ำทรงกลมแบบมีผนังหนา (ใช้ LatheGeometry วาดหน้าตัดผนังบ่อ)
   */
  private buildStoneRim(): void {
    const outerRadius = 0.72;
    const innerRadius = 0.56;
    const height = 0.45;
    const lipExtend = 0.05; // ขอบปากบ่อยื่นออกมานิดหน่อยให้ดูมีมิติ

    // วาดหน้าตัดของกำแพงบ่อ (ไล่จากพื้นด้านใน -> ปากบ่อด้านใน -> ขอบปากบ่อบน -> ผนังด้านนอก -> พื้นด้านนอก)
    const points: THREE.Vector2[] = [
      new THREE.Vector2(innerRadius, 0),
      new THREE.Vector2(innerRadius, height),
      new THREE.Vector2(outerRadius + lipExtend, height),
      new THREE.Vector2(outerRadius + lipExtend, height - 0.08),
      new THREE.Vector2(outerRadius, height - 0.08),
      new THREE.Vector2(outerRadius, 0),
    ];

    const rimGeo = new THREE.LatheGeometry(points, 24);

    // ใช้ Material ลายอิฐถนนสีเทา-ขาว (ซึ่งอยู่ใน Cache แล้ว) เพื่อให้เข้าชุดกับทางเดิน
    const stoneMat = MaterialLibrary.get(
      "road",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xe0e0e0,
          side: THREE.DoubleSide,
        }),
    );

    const rimMesh = new THREE.Mesh(rimGeo, stoneMat);
    this.add(rimMesh);
  }

  /**
   * 2. ผิวน้ำสีฟ้าใส (โปร่งแสง) มองเห็นปลาที่ว่ายอยู่ด้านในได้
   */
  private buildWaterSurface(): void {
    const waterGeo = new THREE.CircleGeometry(Well.INNER_RADIUS, 32);
    waterGeo.rotateX(-Math.PI / 2);

    // น้ำใส: เปิด transparent + opacity ต่ำ + การสะท้อน/ความมันวาวสูง
    const waterMat = MaterialLibrary.get(
      "wellWater",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x7fd8ff,
          roughness: 0.05,
          metalness: 0.1,
          transparent: true,
          opacity: 0.35, // ใส มองทะลุเห็นปลา
          side: THREE.DoubleSide,
          envMapIntensity: 1.2,
        }),
    );

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = Well.WATER_LEVEL;
    waterMesh.renderOrder = 1; // วาดหลังปลา เพื่อให้เห็นปลาใต้ผิวน้ำ

    // แผ่นน้ำใต้ปลาเล็กน้อย (ก้นบ่อสีน้ำเงินเข้ม) ช่วยให้เห็นปลาชัดขึ้น
    const bottomGeo = new THREE.CircleGeometry(Well.INNER_RADIUS * 0.98, 32);
    bottomGeo.rotateX(-Math.PI / 2);
    const bottomMat = MaterialLibrary.get(
      "wellWaterBottom",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x0a4a66,
          roughness: 0.4,
          metalness: 0.2,
        }),
    );
    const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
    bottomMesh.position.y = 0.05;

    this.add(bottomMesh, waterMesh);
  }

  /**
   * 3. ปลา 3 ตัวว่ายวนในบ่อ (ว่ายอยู่ใต้ผิวน้ำเล็กน้อย)
   */
  private buildFishes(): void {
    const fishes = new Fish(3, Well.INNER_RADIUS);
    // ยกทั้งกลุ่มขึ้นมาระดับใต้ผิวน้ำ
    fishes.position.y = Well.WATER_LEVEL - 0.1;
    this.fishes = fishes;
    this.add(fishes);
  }

  /**
   * อัปเดตการว่ายของปลา (SceneManager เรียกผ่าน IUpdatable ทุกเฟรม)
   */
  public update(deltaTime: number, elapsedTime: number): void {
    this.fishes?.update(deltaTime, elapsedTime);
  }
}
