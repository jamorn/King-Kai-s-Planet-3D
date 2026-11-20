// src/core/CameraRig.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IDisposable, IUpdatable } from "./interfaces";

/**
 * คลาสจัดการกล้องและระบบควบคุมการหมุนดูรอบฉาก (Encapsulation)
 */
export class CameraRig implements IUpdatable, IDisposable {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly controls: OrbitControls;

  constructor(domElement: HTMLElement, aspect: number) {
    // 1. ตั้งค่า PerspectiveCamera ให้เห็นดาวทั้งดวงพร้อมท้องฟ้าปรโลก
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
    this.camera.position.set(16, 12, 22);

    // 2. ตั้งค่า OrbitControls สำหรับหมุน/ซูมดูรอบดาวอย่างนุ่มนวล
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false; // ปิดการเลื่อนจุดศูนย์กลาง เพื่อล็อกเป้าไว้ที่ดาวท่านไคโอเสมอ
    this.controls.minDistance = 14; // กันซูมทะลุผิวดาว (ดาวรัศมี 10)
    this.controls.maxDistance = 45; // กันซูมไกลจนหลุดขอบฟ้า
    this.controls.target.set(0, 0, 0);
  }

  /**
   * อัปเดต Damping ของกล้องในแต่ละเฟรม
   */
  public update(_deltaTime: number, _elapsedTime: number): void {
    this.controls.update();
  }

  /**
   * อัปเดตสัดส่วนหน้าจอเมื่อผู้ใช้ย่อ-ขยาย Browser
   */
  public handleResize(width: number, height: number): void {
    if (height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * คืนหน่วยความจำ Event Listeners ของ OrbitControls
   */
  public dispose(): void {
    this.controls.dispose();
  }
}
