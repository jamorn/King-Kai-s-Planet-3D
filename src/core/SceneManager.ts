// src/core/SceneManager.ts
import * as THREE from "three";
import {
  IDisposable,
  IUpdatable,
  isDisposable,
  isUpdatable,
} from "./interfaces";
import { LightRig } from "./LightRig";
import { SkyEnvironment } from "./SkyEnvironment";

/**
 * คลาสจัดการฉาก 3D ทั้งหมด (Scene & Entity Registry)
 * ใช้หลักการ Polymorphism เพื่ออัปเดตและทำลายวัตถุทุกชนิดในฉากผ่าน Interface กลาง
 */
export class SceneManager implements IUpdatable, IDisposable {
  public readonly scene: THREE.Scene;
  private readonly updatables: Set<IUpdatable> = new Set();
  private readonly disposables: Set<IDisposable> = new Set();

  private readonly sky: SkyEnvironment;
  private readonly lights: LightRig;

  constructor() {
    this.scene = new THREE.Scene();

    // ติดตั้งท้องฟ้าปรโลกและระบบแสงเงาเป็นพื้นฐานของฉาก
    this.sky = new SkyEnvironment();
    this.lights = new LightRig();

    this.add(this.sky, this.lights);
  }

  /**
   * เพิ่มวัตถุเข้าสู่ฉากพร้อมลงทะเบียนระบบ Update และ Dispose อัตโนมัติ (Polymorphism)
   */
  public add(...objects: THREE.Object3D[]): void {
    for (const obj of objects) {
      this.scene.add(obj);

      if (isUpdatable(obj)) {
        this.updatables.add(obj);
      }

      if (isDisposable(obj)) {
        this.disposables.add(obj);
      }
    }
  }

  /**
   * ลบวัตถุออกจากฉากและถอนการลงทะเบียน
   */
  public remove(obj: THREE.Object3D): void {
    this.scene.remove(obj);

    if (isUpdatable(obj)) {
      this.updatables.delete(obj);
    }

    if (isDisposable(obj)) {
      obj.dispose();
      this.disposables.delete(obj);
    }
  }

  /**
   * วนลูปเรียก update() ของวัตถุทุกชิ้นที่เคลื่อนไหวได้ (เช่น รถ, หินลอยฟ้า)
   */
  public update(deltaTime: number, elapsedTime: number): void {
    this.updatables.forEach((entity) => {
      entity.update(deltaTime, elapsedTime);
    });
  }

  /**
   * ล้างทรัพยากรทั้งหมดในฉากเมื่อปิดแอปพลิเคชัน
   */
  public dispose(): void {
    this.disposables.forEach((item) => {
      item.dispose();
    });
    this.updatables.clear();
    this.disposables.clear();
    this.scene.clear();
  }
}
