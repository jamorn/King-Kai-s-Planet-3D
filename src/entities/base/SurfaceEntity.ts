// src/entities/base/SurfaceEntity.ts
import * as THREE from "three";
import { WorldEntity } from "./WorldEntity";

/**
 * Abstract Class ระดับกลางสำหรับวัตถุที่ยึดติดอยู่บนพื้นผิวทรงกลมของดาว
 * จัดการการคำนวณพิกัด Spherical และการปรับแกน Y ให้ตั้งฉากกับผิวดาวอัตโนมัติ
 */
export abstract class SurfaceEntity extends WorldEntity {
  /**
   * วางวัตถุลงบนผิวดาวตามค่าละติจูด/ลองจิจูด (พิกัดทรงกลม)
   * @param planetRadius รัศมีของตัวดาว
   * @param polarAngle มุมจากขั้วโลกเหนือลงมา (0 = บนสุด, Math.PI / 2 = เส้นศูนย์สูตร) หน่วยเรเดียน
   * @param azimuthAngle มุมหมุนรอบแกน Y (0 ถึง Math.PI * 2) หน่วยเรเดียน
   * @param sinkOffset ระยะที่กดฐานวัตถุให้จมลงไปในผิวดาวเล็กน้อยเพื่อไม่ให้เห็นรอยลอย
   */
  public snapToSphere(
    planetRadius: number,
    polarAngle: number,
    azimuthAngle: number,
    sinkOffset: number = 0.05,
  ): this {
    const effectiveRadius = planetRadius - sinkOffset;

    // 1. แปลงพิกัดทรงกลม (Spherical) เป็นพิกัดฉาก (Cartesian X, Y, Z)
    const spherical = new THREE.Spherical(
      effectiveRadius,
      polarAngle,
      azimuthAngle,
    );
    this.position.setFromSpherical(spherical);

    // 2. คำนวณเวกเตอร์ตั้งฉากกับผิวดาว (Surface Normal) ที่จุดนั้น
    const surfaceNormal = this.position.clone().normalize();
    const upVector = new THREE.Vector3(0, 1, 0);

    // 3. หมุนแกน Y ของวัตถุให้ชี้พุ่งออกจากจุดศูนย์กลางดาว (ตั้งฉากกับพื้นผิว 100%)
    this.quaternion.setFromUnitVectors(upVector, surfaceNormal);

    return this;
  }

  /**
   * หมุนวัตถุรอบแกนตั้งของตัวเอง (Local Y) หลังจากวางบนผิวดาวแล้ว
   * เพื่อหันหน้าบ้านหรือหน้าม้านั่งไปยังทิศทางที่ต้องการ
   */
  public rotateOnSurface(angleRad: number): this {
    this.rotateY(angleRad);
    return this;
  }
}
