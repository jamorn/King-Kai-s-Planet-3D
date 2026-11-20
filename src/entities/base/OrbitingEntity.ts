// src/entities/base/OrbitingEntity.ts
import * as THREE from "three";
import { WorldEntity } from "./WorldEntity";
import { IUpdatable } from "../../core/interfaces";

/**
 * Abstract Class ระดับกลางสำหรับวัตถุที่เคลื่อนที่โคจรรอบจุดศูนย์กลางดาว
 * รองรับการเอียงระนาบวงโคจร (Tilt) เพื่อให้รถวิ่งเกาะไปตามถนนวงแหวนที่เอียงองศาได้อย่างแม่นยำ
 */
export abstract class OrbitingEntity extends WorldEntity implements IUpdatable {
  protected orbitRadius: number;
  protected orbitSpeed: number;
  protected orbitAngle: number;
  protected orbitPlaneQuaternion: THREE.Quaternion;

  // Scratch objects — ใช้ซ้ำทุกเฟรม ลด GC pressure (ไม่มีการ new ในลูป)
  private readonly _localPos = new THREE.Vector3();
  private readonly _forwardDir = new THREE.Vector3();
  private readonly _upDir = new THREE.Vector3();
  private readonly _rightDir = new THREE.Vector3();
  private readonly _correctedForward = new THREE.Vector3();
  private readonly _rotationMatrix = new THREE.Matrix4();

  /**
   * @param orbitRadius รัศมีวงโคจร (วัดจากจุดศูนย์กลางดาว)
   * @param orbitSpeed ความเร็วในการโคจร (เรเดียนต่อวินาที)
   * @param initialAngle มุมเริ่มต้นบนวงโคจร (เรเดียน)
   * @param planeTiltEuler การเอียงระนาบวงโคจร (ควรตั้งค่าให้ตรงกับมุมเอียงของถนนวงแหวน)
   */
  constructor(
    orbitRadius: number,
    orbitSpeed: number = 0.5,
    initialAngle: number = 0,
    planeTiltEuler: THREE.Euler = new THREE.Euler(0, 0, 0),
  ) {
    super();
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed;
    this.orbitAngle = initialAngle;
    this.orbitPlaneQuaternion = new THREE.Quaternion().setFromEuler(
      planeTiltEuler,
    );

    // ⚠️ ไม่เรียก initialize() ที่นี่!
    // คลาสลูก (concrete) ต้องกำหนด field ของตัวเองให้ครบก่อน แล้วค่อยเรียก initialize()
    // เพื่อให้ build() อ่าน field ของคลาสลูกได้อย่างปลอดภัย (แก้กับดัก Field Initialization Order)
  }

  /**
   * ให้คลาสลูกเรียกหลัง initialize() เพื่อจัดตำแหน่ง/ทิศทางเริ่มต้นบนวงโคจรทันที
   * (คืน this เพื่อ chain ได้)
   */
  protected applyInitialOrbit(): this {
    this.updateOrbitTransform();
    return this;
  }

  /**
   * อัปเดตตำแหน่งและมุมหมุนของวัตถุในแต่ละเฟรม
   */
  public update(deltaTime: number, _elapsedTime: number): void {
    this.orbitAngle += this.orbitSpeed * deltaTime;
    this.updateOrbitTransform();
  }

  /**
   * คำนวณพิกัดบนระนาบวงโคจรที่เอียงองศา พร้อมหันหัววัตถุไปตามทิศทางการเคลื่อนที่
   */
  protected updateOrbitTransform(): void {
    // 1. คำนวณตำแหน่งบนระนาบ 2D (แกน X-Z)
    this._localPos.set(
      Math.cos(this.orbitAngle) * this.orbitRadius,
      0,
      Math.sin(this.orbitAngle) * this.orbitRadius,
    );

    // 2. Tangent vector = derivative ของตำแหน่งตาม θ
    //    คูณ sign(orbitSpeed) เพื่อให้หัวรถหันตามทิศเคลื่อนที่จริงเมื่อวิ่งย้อนกลับ
    const dirSign = Math.sign(this.orbitSpeed) || 1;
    this._forwardDir
      .set(-Math.sin(this.orbitAngle), 0, Math.cos(this.orbitAngle))
      .multiplyScalar(dirSign)
      .normalize();

    // 3. หมุนทั้งตำแหน่งและทิศทางตามมุมเอียงของระนาบถนน (Plane Tilt)
    this._localPos.applyQuaternion(this.orbitPlaneQuaternion);
    this._forwardDir.applyQuaternion(this.orbitPlaneQuaternion);

    this.position.copy(this._localPos);

    // 4. สร้าง Basis ให้แกน Y ตั้งฉากผิวดาว (Up) และแกน Z หันไปข้างหน้า (Forward)
    this._upDir.copy(this._localPos).normalize();
    this._rightDir.crossVectors(this._upDir, this._forwardDir).normalize();
    this._correctedForward
      .crossVectors(this._rightDir, this._upDir)
      .normalize();

    this._rotationMatrix.makeBasis(
      this._rightDir,
      this._upDir,
      this._correctedForward,
    );
    this.quaternion.setFromRotationMatrix(this._rotationMatrix);
  }
}
