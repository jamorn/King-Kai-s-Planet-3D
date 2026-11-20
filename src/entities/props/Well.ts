// src/entities/props/Well.ts
import * as THREE from "three";
import { SurfaceEntity } from "../base/SurfaceEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";

/**
 * คลาสสร้างบ่อน้ำทรงกลมขนาดเล็กหน้าบ้านท่านไคโอ (Kai's Stone Well)
 * สืบทอดจาก SurfaceEntity เพื่อนำไปวางบนผิวดาวหน้าตัวบ้าน
 */
export class Well extends SurfaceEntity {
  constructor() {
    super();
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  protected build(): void {
    this.buildStoneRim();
    this.buildWaterSurface();
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
   * 2. ผิวน้ำสีฟ้าใสสะท้อนแสงอยู่ภายในบ่อ
   */
  private buildWaterSurface(): void {
    const waterGeo = new THREE.CircleGeometry(0.56, 24);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = MaterialLibrary.get(
      "wellWater",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x29b6f6,
          roughness: 0.15,
          metalness: 0.3,
        }),
    );

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.32; // อยู่ต่ำกว่าขอบปากบ่อเล็กน้อย

    this.add(waterMesh);
  }
}
