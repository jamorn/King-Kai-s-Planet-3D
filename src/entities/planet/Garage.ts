// src/entities/planet/Garage.ts
import * as THREE from "three";
import { SurfaceEntity } from "../base/SurfaceEntity";
import { MaterialLibrary } from "../../core/MaterialLibrary";
import { SymmetryHelper } from "../../utils/SymmetryHelper";

/**
 * คลาสสร้างโรงรถทรงอุโมงค์ครึ่งวงกลมของท่านไคโอ (Kai's Garage)
 * สืบทอดจาก SurfaceEntity เพื่อนำไปวางบนผิวดาวข้างๆ ตัวบ้านได้ทันที
 */
export class Garage extends SurfaceEntity {
  constructor() {
    super();
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  protected build(): void {
    this.buildTunnelBody();
    this.buildFrontDoorAndTrim();
  }

  /**
   * 1. ตัวโรงรถทรงกระบอกผ่าครึ่งซีก (ลายอิฐสีส้ม-เหลืองเข้าชุดกับตัวบ้าน)
   */
  private buildTunnelBody(): void {
    const radius = 1.45;
    const length = 2.4;

    const brickMat = MaterialLibrary.get(
      "houseBrick",
      () => new THREE.MeshStandardMaterial({ color: 0xf39c12 }),
    );

    // ทรงกระบอกผ่าครึ่งตามแนวยาว (thetaLength = Math.PI)
    const tunnelGeo = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      24,
      1,
      false,
      0,
      Math.PI,
    );
    const tunnelMesh = new THREE.Mesh(tunnelGeo, brickMat);
    // หมุนให้นอนราบไปกับพื้นและหันปากอุโมงค์มาทางแกน +Z
    tunnelMesh.rotation.z = Math.PI / 2;
    tunnelMesh.rotation.y = Math.PI / 2;

    // ปิดแผ่นหลังโรงรถด้วยครึ่งวงกลม
    const backCapGeo = new THREE.CircleGeometry(radius, 24, 0, Math.PI);
    const backCapMesh = new THREE.Mesh(backCapGeo, brickMat);
    backCapMesh.position.z = -length / 2;
    backCapMesh.rotation.y = Math.PI;

    this.add(tunnelMesh, backCapMesh);
  }

  /**
   * 2. ซุ้มขอบสีขาวด้านหน้า + ประตูบานเลื่อนสีเทาอ่อนพร้อมร่องบานเกล็ด
   */
  private buildFrontDoorAndTrim(): void {
    const frontZ = 1.2;

    const whiteMat = MaterialLibrary.get(
      "whiteTrim",
      () => new THREE.MeshStandardMaterial({ color: 0xfafafa }),
    );
    const roadMat = MaterialLibrary.get(
      "road",
      () => new THREE.MeshStandardMaterial({ color: 0xdcdcdc }),
    );

    // ขอบคิ้วโค้งครึ่งวงกลมด้านหน้า (ใช้ TorusGeometry ผ่าครึ่ง)
    const archTrimGeo = new THREE.TorusGeometry(1.42, 0.08, 8, 24, Math.PI);
    const archTrimMesh = new THREE.Mesh(archTrimGeo, whiteMat);
    archTrimMesh.position.z = frontZ;

    // แผ่นประตูครึ่งวงกลมด้านใน
    const doorPlateGeo = new THREE.CircleGeometry(1.38, 24, 0, Math.PI);
    const doorPlateMesh = new THREE.Mesh(doorPlateGeo, roadMat);
    doorPlateMesh.position.z = frontZ - 0.02;

    // เสาขอบประตูซ้าย-ขวา (สร้าง 1 ต้น แล้วใช้ Mirror ไปอีกฝั่ง)
    const pillarGeo = new THREE.BoxGeometry(0.16, 1.35, 0.16);
    const leftPillar = new THREE.Mesh(pillarGeo, whiteMat);
    leftPillar.position.set(-1.35, 0.67, frontZ);

    const rightPillar = SymmetryHelper.mirror(leftPillar, "x");

    // แถบเส้นแนวนอนบนบานประตูม้วน
    const shutterGroup = new THREE.Group();
    for (let i = 1; i <= 4; i++) {
      const yPos = i * 0.24;
      // คำนวณความกว้างของเส้นตามรัศมีวงกลม (x = sqrt(r^2 - y^2))
      const halfWidth = Math.sqrt(Math.max(0, 1.3 * 1.3 - yPos * yPos));
      const slatGeo = new THREE.BoxGeometry(halfWidth * 1.9, 0.04, 0.04);
      const slatMesh = new THREE.Mesh(slatGeo, whiteMat);
      slatMesh.position.set(0, yPos, frontZ);
      shutterGroup.add(slatMesh);
    }

    this.add(
      archTrimMesh,
      doorPlateMesh,
      leftPillar,
      rightPillar,
      shutterGroup,
    );
  }
}
