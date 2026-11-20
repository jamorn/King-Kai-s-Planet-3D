// src/entities/props/Bench.ts
import * as THREE from 'three';
import { SurfaceEntity } from '../base/SurfaceEntity';
import { MaterialLibrary } from '../../core/MaterialLibrary';
import { SymmetryHelper } from '../../utils/SymmetryHelper';

/**
 * คลาสสร้างม้านั่งยาวไม้หน้าบ้านท่านไคโอ (Kai's Wooden Bench)
 * สืบทอดจาก SurfaceEntity และใช้ Quad Mirror สร้างขาโต๊ะทั้ง 4 มุมจากต้นแบบชิ้นเดียว
 */
export class Bench extends SurfaceEntity {
  constructor() {
    super();
    // ⚠️ base class ไม่ได้เรียก build() แล้ว → ต้องเรียก initialize() เอง
    this.initialize();
  }

  protected build(): void {
    const woodMat = MaterialLibrary.get('wood', () =>
      new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 })
    );
    const plankMat = MaterialLibrary.get('benchPlank', () =>
      new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.8 })
    );

    const benchWidth = 1.45;
    const benchDepth = 0.52;
    const seatHeight = 0.36;

    // 1. แผ่นไม้รองนั่งด้านบน (แบ่งเป็น 2 แผ่นวางเรียงขนานกันให้ดูมีดีเทล)
    const plankGeo = new THREE.BoxGeometry(benchWidth, 0.05, benchDepth * 0.45);
    const frontPlank = new THREE.Mesh(plankGeo, plankMat);
    frontPlank.position.set(0, seatHeight, benchDepth * 0.25);

    const backPlank = SymmetryHelper.mirror(frontPlank, 'z');

    // 2. คานไม้ยึดใต้ที่นั่ง (ซ้าย-ขวา)
    const braceGeo = new THREE.BoxGeometry(0.06, 0.07, benchDepth * 0.85);
    const leftBrace = new THREE.Mesh(braceGeo, woodMat);
    const braces = SymmetryHelper.createSymmetricPair(
      leftBrace,
      -benchWidth * 0.38,
      seatHeight - 0.05,
      0
    );

    // 3. ขาม้านั่ง 4 มุม (สร้างขาหน้าซ้าย 1 ขา แล้วใช้ Quad Mirror แตกออกเป็น 4 มุมอัตโนมัติ!)
    const legGeo = new THREE.BoxGeometry(0.08, seatHeight, 0.08);
    const frontLeftLeg = new THREE.Mesh(legGeo, woodMat);

    const fourLegs = SymmetryHelper.createQuadSymmetric(
      frontLeftLeg,
      -benchWidth * 0.4,
      seatHeight / 2,
      benchDepth * 0.36
    );

    this.add(frontPlank, backPlank, braces, fourLegs);
  }
}

