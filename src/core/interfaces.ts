export type Axis = 'x' | 'y' | 'z';

/**
 * Contract สำหรับวัตถุที่มีการอัปเดต Animation ในทุกๆ เฟรม (Polymorphism)
 */
export interface IUpdatable {
  update(deltaTime: number, elapsedTime: number): void;
}

/**
 * Contract สำหรับการคืนหน่วยความจำ GPU (Geometry, Material, Texture) เมื่อทำลายวัตถุ
 */
export interface IDisposable {
  dispose(): void;
}

/**
 * Contract สำหรับวัตถุที่รองรับการสร้างร่างโคลนแบบสมมาตร (Mirror)
 */
export interface IMirrorable<T> {
  cloneMirrored(axis?: Axis): T;
}

/**
 * Type Guard สำหรับตรวจสอบว่า Object3D ใดๆ มีเมธอด update() หรือไม่
 */
export function isUpdatable(obj: unknown): obj is IUpdatable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'update' in obj &&
    typeof (obj as IUpdatable).update === 'function'
  );
}

/**
 * Type Guard สำหรับตรวจสอบว่า Object3D ใดๆ รองรับการ dispose() หรือไม่
 */
export function isDisposable(obj: unknown): obj is IDisposable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'dispose' in obj &&
    typeof (obj as IDisposable).dispose === 'function'
  );
}
