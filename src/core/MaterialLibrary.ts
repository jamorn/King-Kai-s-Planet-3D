// src/core/MaterialLibrary.ts
import * as THREE from "three";
import { TextureFactory } from "../utils/TextureFactory";

/**
 * คลังเก็บ Material กลาง (Flyweight Pattern)
 * ป้องกันการสร้าง Material ซ้ำซ้อนและช่วยจัดการการคืนหน่วยความจำ (Dispose) ในจุดเดียว
 */
export class MaterialLibrary {
  private static cache: Map<string, THREE.MeshStandardMaterial> = new Map();

  /**
   * ดึง Material จาก Cache หากยังไม่มีจะสร้างใหม่ผ่าน Factory Function
   */
  public static get(
    key: string,
    creator: () => THREE.MeshStandardMaterial,
  ): THREE.MeshStandardMaterial {
    if (!this.cache.has(key)) {
      this.cache.set(key, creator());
    }
    return this.cache.get(key)!;
  }

  /**
   * เตรียม Material มาตรฐานทั้งหมดที่ใช้ในดาวท่านไคโอ
   */
  public static initDefaults(): void {
    // 1. พื้นหญ้าสีเขียวสด (สไตล์ลูกเทนนิส)
    this.get(
      "grass",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x8bc34a,
          roughness: 0.85,
          metalness: 0.05,
        }),
    );

    // 2. ถนนวงแหวนลายอิฐสีเทา-ขาว
    this.get(
      "road",
      () =>
        new THREE.MeshStandardMaterial({
          map: TextureFactory.createRoadBrickTexture(),
          roughness: 0.8,
          side: THREE.DoubleSide,
        }),
    );

    // 3. ผนังบ้านและโรงรถลายอิฐสีส้ม-เหลือง
    this.get(
      "houseBrick",
      () =>
        new THREE.MeshStandardMaterial({
          map: TextureFactory.createHouseBrickTexture(),
          roughness: 0.7,
        }),
    );

    // 4. หลังคาและขอบวงแหวนสีขาว
    this.get(
      "whiteTrim",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xfafafa,
          roughness: 0.4,
        }),
    );

    // 5. แถบหลังคาสีส้มสด
    this.get(
      "orangeRoof",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xf39c12,
          roughness: 0.5,
        }),
    );

    // 6. ผ้าม่านทางเข้าสีม่วง
    this.get(
      "purpleCurtain",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x9b59b6,
          roughness: 0.9,
          side: THREE.DoubleSide,
        }),
    );

    // 7. พื้นที่มืดด้านในประตูและหน้าต่าง
    this.get(
      "darkInterior",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x1a1a1a,
          roughness: 1.0,
        }),
    );

    // 8. ลำต้นไม้และก้อนหินลอยฟ้า
    this.get(
      "wood",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x6d4c41,
          roughness: 0.9,
        }),
    );

    // 9. พุ่มใบไม้สีเขียวเข้ม
    this.get(
      "foliage",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x43a047,
          roughness: 0.8,
          flatShading: true,
        }),
    );

    // 10. ตัวถังรถคลาสสิกสีแดง
    this.get(
      "carRed",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xd32f2f,
          roughness: 0.3,
          metalness: 0.2,
        }),
    );

    // 11. ยางล้อรถสีดำด้าน
    this.get(
      "tireBlack",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x212121,
          roughness: 0.9,
        }),
    );
  }

  /**
   * ล้าง Material และ Texture ทั้งหมดออกจากหน่วยความจำ GPU
   */
  public static disposeAll(): void {
    this.cache.forEach((material) => {
      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
    });
    this.cache.clear();
  }
}
