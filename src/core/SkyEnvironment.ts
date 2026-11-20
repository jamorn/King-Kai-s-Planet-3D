// src/core/SkyEnvironment.ts
import * as THREE from "three";
import { IDisposable } from "./interfaces";

/**
 * คลาสสร้างท้องฟ้าปรโลก (Sky Dome) ด้วย Custom Shader
 * ไล่เฉดสีจากชมพูด้านบน (Top) ผ่านขาวนวลตรงเส้นขอบฟ้า ลงมาเป็นเหลืองทองด้านล่าง (Bottom)
 */
export class SkyEnvironment extends THREE.Mesh implements IDisposable {
  private readonly skyGeo: THREE.SphereGeometry;
  private readonly skyMat: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.SphereGeometry(250, 32, 32);

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide, // วาดพื้นผิวด้านในของทรงกลม (ล้อมรอบกล้อง)
      depthWrite: false, // ไม่ให้ท้องฟ้าไปบังการคำนวณความลึกของวัตถุอื่น
      uniforms: {
        topColor: { value: new THREE.Color(0xff4da6) }, // ชมพูสดด้านบน
        horizonColor: { value: new THREE.Color(0xfff0f5) }, // ขาวอมชมพูตรงกลาง
        bottomColor: { value: new THREE.Color(0xffca28) }, // เหลืองทองทะเลเมฆด้านล่าง
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;

        void main() {
          // แปลงความสูงเป็นค่าตั้งแต่ -1.0 (ล่างสุด) ถึง +1.0 (บนสุด)
          float h = normalize(vWorldPosition).y;

          vec3 finalColor;
          if (h >= 0.0) {
            // ครึ่งบน: ไล่จากสีขาวนวลตรงกลางขึ้นไปหาสีชมพูสด
            finalColor = mix(horizonColor, topColor, pow(h, 0.75));
          } else {
            // ครึ่งล่าง: ไล่จากสีขาวนวลตรงกลางลงไปหาสีเหลืองทอง
            finalColor = mix(horizonColor, bottomColor, pow(-h, 0.65));
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    super(geometry, material);
    this.skyGeo = geometry;
    this.skyMat = material;
  }

  /**
   * คืนหน่วยความจำ Geometry และ ShaderMaterial
   */
  public dispose(): void {
    this.skyGeo.dispose();
    this.skyMat.dispose();
  }
}
