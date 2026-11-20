// src/core/LightRig.ts
import * as THREE from "three";
import { IDisposable } from "./interfaces";

/**
 * คลาสจัดการระบบแสงสว่างและเงา (Lighting & Shadow Rig)
 * ออกแบบโทนสีแสงให้เข้ากับบรรยากาศปรโลก (ท้องฟ้าสีชมพู-เมฆสีเหลืองทอง)
 */
export class LightRig extends THREE.Group implements IDisposable {
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;

  constructor() {
    super();

    // 1. แสงบรรยากาศ 2 ทิศทาง (บน: ชมพูพาสเทลจากท้องฟ้า, ล่าง: เหลืองอบอุ่นจากทะเลเมฆ)
    this.hemiLight = new THREE.HemisphereLight(0xffb7e2, 0xffe082, 1.1);
    this.hemiLight.position.set(0, 30, 0);

    // 2. แสงหลักสำหรับสร้างมิติและเงาตกกระทบ (Key Light)
    this.sunLight = new THREE.DirectionalLight(0xfff8e1, 1.8);
    this.sunLight.position.set(20, 28, 18);
    this.sunLight.castShadow = true;

    // ตั้งค่าความละเอียดและขอบเขตของเงาให้คลุมทั้งดาว (รัศมี 10) ได้คมชัด
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 75;

    const shadowBounds = 16;
    this.sunLight.shadow.camera.left = -shadowBounds;
    this.sunLight.shadow.camera.right = shadowBounds;
    this.sunLight.shadow.camera.top = shadowBounds;
    this.sunLight.shadow.camera.bottom = -shadowBounds;
    this.sunLight.shadow.bias = -0.0005; // ลดอาการ Shadow Acne บนผิวทรงกลม

    this.add(this.hemiLight, this.sunLight);
  }

  /**
   * คืนหน่วยความจำ Shadow Map
   */
  public dispose(): void {
    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
    }
    this.hemiLight.dispose();
    this.sunLight.dispose();
  }
}
