// src/entities/planet/KaiPlanet.ts
import * as THREE from "three";
import { WorldEntity } from "../base/WorldEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";

/**
 * คลาสสร้างดาวเคราะห์ของท่านไคโอ (ตัวดาวทรงกลมสีเขียว + ถนนวงแหวนลายอิฐคาดเฉียง)
 */
export class KaiPlanet extends WorldEntity {
  public readonly radius: number;
  public readonly roadTilt: THREE.Euler;

  constructor(
    radius: number = 10,
    roadTilt: THREE.Euler = new THREE.Euler(0.25, 0, -0.45),
  ) {
    super();

    // 1. กำหนดค่า Property ให้ครบก่อน (field ของคลาสลูกจะพร้อมใช้หลัง super() เท่านั้น)
    this.radius = radius;
    this.roadTilt = roadTilt.clone(); // clone กันผู้เรียกไปแก้ object เดิมทีหลัง

    // 2. ค่อยสร้างโมเดล (build() จะอ่าน this.radius / this.roadTilt ได้ปลอดภัย)
    this.initialize();

    // 3. ปรับมุมเอียงของถนนให้ตรงกับพารามิเตอร์
    const roadMesh = this.getObjectByName("planet-road");
    if (roadMesh) {
      roadMesh.rotation.copy(this.roadTilt);
    }
  }

  /**
   * สร้างทรงกลมพื้นหญ้าและแถบถนนวงแหวน (ใช้ this.radius โดยตรง ไม่ hardcode)
   */
  protected build(): void {
    const baseRadius = this.radius;

    // 1. ตัวดาวทรงกลมสีเขียวตอง
    const planetGeo = new THREE.SphereGeometry(baseRadius, 64, 64);
    const grassMat = MaterialLibrary.get(
      "grass",
      () => new THREE.MeshStandardMaterial({ color: 0x8bc34a }),
    );
    const planetMesh = new THREE.Mesh(planetGeo, grassMat);
    planetMesh.name = "planet-surface";

    // 2. ถนนวงแหวนลายอิฐคาดรอบดาว (ใช้ SphereGeometry ตัดเฉพาะแถบเส้นศูนย์สูตรให้โค้งรับผิวดาว 100%)
    const roadArcWidth = 0.17; // ความกว้างแถบถนน (เรเดียน)
    const roadGeo = new THREE.SphereGeometry(
      baseRadius * 1.0025, // ยกสูงกว่าผิวดาวเล็กน้อยเพื่อป้องกัน Z-fighting
      64,
      16,
      0,
      Math.PI * 2,
      Math.PI / 2 - roadArcWidth / 2,
      roadArcWidth,
    );

    const roadMat = MaterialLibrary.get(
      "road",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xdcdcdc,
          side: THREE.DoubleSide,
        }),
    );
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.name = "planet-road";

    this.add(planetMesh, roadMesh);
  }
}
