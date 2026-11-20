// src/core/CameraRig.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IDisposable, IUpdatable } from "./interfaces";

/**
 * คลาสจัดการกล้องและระบบควบคุมการหมุนดูรอบฉาก (Encapsulation)
 * รองรับการ "Fit พอดี" ทุกอัตราส่วนจอ (เดสก์ท็อป / แท็บเล็ต / มือถือแนวตั้ง)
 */
export class CameraRig implements IUpdatable, IDisposable {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;

  // ค่าคงที่สำหรับการคำนวณระยะ Fit
  private static readonly FOV_DEG = 45; // มุมมองแนวตั้งของกล้อง (องศา)
  private static readonly FIT_RADIUS = 15; // รัศมีเป้าหมายที่ต้องเห็นครบ (ดาว + หินลอย)
  private static readonly FIT_MARGIN = 1.12; // เผื่อขอบเล็กน้อยให้ดาวไม่ชิดขอบจอ
  private static readonly VIEW_DIR = new THREE.Vector3(16, 12, 22).normalize();

  constructor(domElement: HTMLElement, aspect: number) {
    // 1. ตั้งค่า PerspectiveCamera (FOV คงที่ ส่วนระยะกล้องคำนวณจาก aspect)
    this.camera = new THREE.PerspectiveCamera(
      CameraRig.FOV_DEG,
      aspect,
      0.1,
      500,
    );
    // 2. ตั้งค่า OrbitControls สำหรับหมุน/ซูมดูรอบดาวอย่างนุ่มนวล
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false; // ปิดการเลื่อนจุดศูนย์กลาง เพื่อล็อกเป้าไว้ที่ดาวท่านไคโอเสมอ
    this.controls.target.set(0, 0, 0);

    // 3. จัดระยะและขอบเขตซูมให้พอดีกับ aspect เริ่มต้น
    this.applyFit(aspect);
  }

  /**
   * อัปเดต Damping ของกล้องในแต่ละเฟรม
   */
  public update(_deltaTime: number, _elapsedTime: number): void {
    this.controls.update();
  }

  /**
   * อัปเดตสัดส่วนหน้าจอ + จัดระยะกล้องให้ "Fit พอดี" กับจอใหม่
   */
  public handleResize(width: number, height: number): void {
    if (height === 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.applyFit(aspect);
  }

  /**
   * คำนวณระยะกล้องที่ทำให้ทรงกลมรัศมี FIT_RADIUS พอดีเฟรม
   * เลือกค่าระยะที่ "ไกลกว่า" ระหว่างการ fit แนวตั้งและแนวนอน
   * เพื่อให้เห็นครบทั้งสองแกนไม่ว่าจะเป็นจอแนวตั้งหรือแนวนอน
   * แล้ววางกล้องตามทิศ VIEW_DIR ที่ระยะนั้น
   */
  private applyFit(aspect: number): void {
    const vFov = THREE.MathUtils.degToRad(CameraRig.FOV_DEG);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    // ระยะที่ทำให้ทรงกลมพอดีกับ frustum แต่ละแกน (บวก margin กันชิดขอบ)
    const distVertical = CameraRig.FIT_RADIUS / Math.sin(vFov / 2);
    const distHorizontal = CameraRig.FIT_RADIUS / Math.sin(hFov / 2);
    const fitDistance =
      Math.max(distVertical, distHorizontal) * CameraRig.FIT_MARGIN;

    // วางกล้องที่ระยะ fit ตามทิศเดิม
    this.camera.position.copy(
      CameraRig.VIEW_DIR.clone().multiplyScalar(fitDistance),
    );

    // ปรับขอบเขตซูมให้สอดคล้องกับระยะ fit
    // (กัน OrbitControls ดึงกล้องกลับเข้า/ออกจนดาวถูกตัดหรือลอยเล็กเกินบนจอเล็ก)
    this.controls.minDistance = Math.min(14, fitDistance * 0.9);
    this.controls.maxDistance = Math.max(45, fitDistance * 1.8);
    this.controls.update();
  }

  /**
   * คืนหน่วยความจำ Event Listeners ของ OrbitControls
   */
  public dispose(): void {
    this.controls.dispose();
  }
}
