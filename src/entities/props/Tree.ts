// src/entities/props/Tree.ts
import * as THREE from "three";
import { SurfaceEntity } from "../base/SurfaceEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";

/**
 * คลาสสร้างต้นไม้พุ่มกลมสไตล์อนิเมะ (Kai Planet Tree)
 * สืบทอดจาก SurfaceEntity เพื่อนำไปปักรอบผิวดาวให้ตั้งฉากอัตโนมัติ
 */
export class Tree extends SurfaceEntity {
  constructor(treeScale: number = 1.0) {
    super();
    this.scale.setScalar(treeScale);
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  /**
   * ประกอบลำต้นสีน้ำตาลและกลุ่มพุ่มใบไม้สีเขียวซ้อนกัน 4 ก้อนให้ดูฟูมีมิติ
   */
  protected build(): void {
    const woodMat = MaterialLibrary.get(
      "wood",
      () => new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 }),
    );
    const foliageMat = MaterialLibrary.get(
      "foliage",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x43a047,
          roughness: 0.8,
          flatShading: true,
        }),
    );

    // 1. ลำต้นหลัก (โคนใหญ่ ปลายเรียว)
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.26, 1.35, 10);
    const trunkMesh = new THREE.Mesh(trunkGeo, woodMat);
    trunkMesh.position.y = 0.675;

    // 2. กิ่งก้านแยกซ้าย-ขวา (ยื่นออกมาใต้พุ่มใบ)
    const branchGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.55, 8);
    const leftBranch = new THREE.Mesh(branchGeo, woodMat);
    leftBranch.position.set(-0.22, 1.15, 0);
    leftBranch.rotation.z = 0.55;

    const rightBranch = new THREE.Mesh(branchGeo, woodMat);
    rightBranch.position.set(0.2, 1.2, 0.1);
    rightBranch.rotation.z = -0.5;
    rightBranch.rotation.x = 0.3;

    // 3. พุ่มใบไม้หลายก้อนซ้อนกัน (ใช้ IcosahedronGeometry detail 1 เพื่อให้ดูเป็นพุ่มกลมมน)
    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = 1.65;

    const foliageClusters: Array<{
      pos: [number, number, number];
      radius: number;
    }> = [
      { pos: [0, 0.35, 0], radius: 0.85 }, // พุ่มยอดบนสุด
      { pos: [-0.52, -0.05, 0.2], radius: 0.68 }, // พุ่มซ้ายหน้า
      { pos: [0.55, 0.0, 0.15], radius: 0.65 }, // พุ่มขวาหน้า
      { pos: [0.05, -0.05, -0.52], radius: 0.7 }, // พุ่มด้านหลัง
    ];

    for (const cluster of foliageClusters) {
      const leafGeo = new THREE.IcosahedronGeometry(cluster.radius, 1);
      const leafMesh = new THREE.Mesh(leafGeo, foliageMat);
      leafMesh.position.set(...cluster.pos);
      // หมุนมุมพุ่มใบเล็กน้อยไม่ให้เหลี่ยมซ้ำกัน
      leafMesh.rotation.set(cluster.pos[0], cluster.pos[2], 0);
      canopyGroup.add(leafMesh);
    }

    this.add(trunkMesh, leftBranch, rightBranch, canopyGroup);
  }
}
