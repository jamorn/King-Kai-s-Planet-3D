// src/entities/base/WorldEntity.ts
import * as THREE from "three";
import { Axis, IDisposable, IMirrorable } from "../../core/interfaces";
import { SymmetryHelper } from "../../utils/SymmetryHelper";

/**
 * Abstract Base Class สูงสุดของวัตถุ 3D ทุกชิ้นในฉาก
 * สืบทอดจาก THREE.Group โดยตรงเพื่อให้สั่ง scene.add(entity) ได้ทันที
 *
 * ⚠️ สัญญาสำคัญ (Template Method Pattern):
 * constructor ไม่เรียก build() เพื่อเลี่ยงกับดัก Field Initialization Order
 * (field ของคลาสลูกจะถูก init หลัง super() เสร็จเท่านั้น)
 * ลำดับที่ถูกต้องคือ: new Xxx() → entity.initialize() → (วางตำแหน่ง) → sceneManager.add()
 */
export abstract class WorldEntity
  extends THREE.Group
  implements IDisposable, IMirrorable<WorldEntity>
{
  private isInitialized = false;

  constructor() {
    super();
  }

  /**
   * ลำดับการสร้างโมเดลและเปิดเงา (Template Method)
   * ต้องเรียกเองหลัง super() ใน constructor ของคลาสลูก (เมื่อ field ทุกตัวถูก init แล้ว)
   * เรียกซ้ำได้ปลอดภัย (idempotent)
   */
  public initialize(): this {
    if (this.isInitialized) return this;
    this.isInitialized = true;

    this.build();
    this.enableShadows();
    return this;
  }
  /**
   * คลาสลูกทุกตัวต้อง implement เมธอดนี้เพื่อสร้างชิ้นส่วน Geometry ของตัวเอง
   */
  protected abstract build(): void;
  /**
   * เปิดใช้งานการรับและสร้างเงา (Cast/Receive Shadow) ให้กับ Mesh ทั้งหมด
   * ยกเว้น mesh ที่ userData.noShadow = true (เช่น หลอดไฟหน้า/ไฟท้ายที่ "เปล่งแสง")
   */
  public enableShadows(): void {
    this.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.noShadow) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * สร้างร่างโคลนที่สะท้อนข้ามแกนที่กำหนด (Mirror)
   */
  public cloneMirrored(axis: Axis = "x"): WorldEntity {
    return SymmetryHelper.mirror(this, axis);
  }

  /**
   * คืนหน่วยความจำ Geometry ทั้งหมดในกลุ่มนี้
   * (หมายเหตุ: Material จะถูกจัดการผ่าน MaterialLibrary.disposeAll() แยกต่างหาก)
   */
  public dispose(): void {
    this.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry.dispose();
      }
    });
  }
}
