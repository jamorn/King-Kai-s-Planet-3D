import * as THREE from "three";
import { Axis } from "../core/interfaces";

/**
 * Utility Class สำหรับจัดการเรื่องความสมมาตร (Mirror) และการทำซ้ำวัตถุในฉาก 3D
 *
 * ⚠️ หลักการสำคัญ:
 * หลีกเลี่ยงการตั้งค่า scale[axis] เป็นค่าลบ (ทั้งที่ transform และที่ geometry)
 * เพราะจะกลับ Winding Order ทำให้ Normal หันผิดด้าน และวัสดุ FrontSide จะดูเหมือนหน้าหาย
 *
 * วิธีที่ปลอดภัย: ย้ายตำแหน่งสลับฝั่ง + กลับมุมหมุน (rotation) ให้สมมาตร
 * ซึ่งเพียงพอสำหรับ mesh ทรงสมมาตรที่ใช้ในโปรเจกต์นี้ (Box, Cylinder, Sphere, Torus, Circle)
 * — ไม่ต้อง reflect geometry (geometry ที่สะท้อนตัวเองได้อยู่แล้ว)
 */
export class SymmetryHelper {
  /**
   * สะท้อน (Mirror) วัตถุข้ามแกนที่กำหนด แบบไม่กลับ Normal / Winding Order
   */
  public static mirror<T extends THREE.Object3D>(
    original: T,
    axis: Axis = "x",
  ): T {
    const cloned = original.clone() as T;

    // 1. ย้ายตำแหน่งไปฝั่งตรงข้ามของแกนที่กำหนด
    cloned.position[axis] = -original.position[axis];

    // 2. กลับทิศทางการหมุนให้สมมาตร (ไม่ใช้ scale ติดลบ เพื่อไม่ให้ Winding กลับ)
    if (axis === "x") {
      cloned.rotation.y = -original.rotation.y;
      cloned.rotation.z = -original.rotation.z;
    } else if (axis === "y") {
      cloned.rotation.x = -original.rotation.x;
      cloned.rotation.z = -original.rotation.z;
    } else if (axis === "z") {
      cloned.rotation.x = -original.rotation.x;
      cloned.rotation.y = -original.rotation.y;
    }

    return cloned;
  }

  /**
   * สร้างกลุ่มวัตถุคู่สมมาตรซ้าย-ขวา (แกน X) จากต้นแบบชิ้นเดียว
   */
  public static createSymmetricPair(
    mesh: THREE.Object3D,
    offsetX: number,
    y: number = 0,
    z: number = 0,
  ): THREE.Group {
    const pairGroup = new THREE.Group();
    mesh.position.set(offsetX, y, z);

    const mirroredMesh = this.mirror(mesh, "x");
    pairGroup.add(mesh, mirroredMesh);

    return pairGroup;
  }

  /**
   * สร้างชุดวัตถุสมมาตร 4 มุม (ซ้าย-ขวา และ หน้า-หลัง) เช่น ล้อรถ 4 ล้อ หรือขาโต๊ะ 4 ขา
   *
   * ⚠️ ห้าม mirror ที่ระดับ Group เพราะ mirror() สะท้อนเฉพาะ transform ของ Group เอง
   * (ไม่ reflect geometry ของ Mesh ลูก) ทำให้ได้สำเนาซ้อนทับกันแทนที่จะเป็นคู่หลังจริง
   * วิธีที่ถูกต้อง: สร้างคู่หลังด้วย createSymmetricPair อีกครั้งที่ z = -offsetZ
   */
  public static createQuadSymmetric(
    mesh: THREE.Object3D,
    offsetX: number,
    y: number,
    offsetZ: number,
  ): THREE.Group {
    const quadGroup = new THREE.Group();

    // คู่หน้า (z = +offsetZ) — ใช้ mesh ต้นแบบโดยตรง
    const frontPair = this.createSymmetricPair(mesh, offsetX, y, offsetZ);

    // คู่หลัง (z = -offsetZ) — ต้อง clone mesh ใหม่ เพื่อไม่ให้แชร์ object
    // กับคู่หน้า (createSymmetricPair จะแก้ position ของ mesh ที่ส่งเข้าไป)
    const backMesh = mesh.clone();
    const backPair = this.createSymmetricPair(backMesh, offsetX, y, -offsetZ);

    quadGroup.add(frontPair, backPair);
    return quadGroup;
  }
}
