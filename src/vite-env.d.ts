/// <reference types="vite/client" />
/*
Q: src/vite-env.d.ts เราจะต้อง declare อะไรเพิ่มไหม
A: ไม่ต้อง declare อะไรเพิ่มเลยครับ ใช้แค่บรรทัดเดียว (/// <reference types="vite/client" />) เพียงพอแล้วสำหรับโปรเจกต์นี้

เหตุผลที่เพียงพอแล้ว:

• รองรับ Assets ของ Vite ครบ: vite/client มี Type Definition สำหรับไฟล์ .css, รูปภาพ (.png, .jpg, .svg), import.meta.env และ import.meta.hot ให้อยู่แล้ว
• โปรเจกต์นี้เป็น Procedural 100%: ตัวโมเดล Texture และ Shader ทั้งหมดในโปรเจกต์เราสร้างขึ้นจากโค้ด TypeScript และ HTML5 Canvas ล้วนๆ ไม่มีการ import ไฟล์โมเดล 3D (เช่น .glb, .gltf) หรือไฟล์ Shader แยก (.glsl) เข้ามา

กรณีไหนถึงจะต้อง declare เพิ่มในอนาคต?

คุณค่อยกลับมาเพิ่ม declare module ในไฟล์นี้ เฉพาะเมื่อ อนาคตมีการขยับขยายโปรเจกต์ไปใช้ไฟล์นามสกุลเฉพาะทาง เช่น:
• นำเข้าโมเดล 3D ภายนอก (.glb, .gltf, .obj)
• นำเข้าไฟล์ Shader แยก (.glsl, .vert, .frag)
• สร้างตัวแปร Environment เองในไฟล์ .env (เช่น VITE_APP_TITLE) แล้วอยากให้ TypeScript ทำ Auto-complete

// ตัวอย่างถ้าอนาคตอยากเพิ่ม (ตอนนี้ยังไม่ต้องใส่)
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.glb' {
  const src: string;
  export default src;
}


*/
