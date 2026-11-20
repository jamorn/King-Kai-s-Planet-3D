# 🌍 King Kai's Planet 3D (ดาวท่านไคโอ 3D)

โปรเจกต์จำลองดาวเคราะห์ของท่านไคโอ (King Kai / 界王) จากเรื่อง Dragon Ball ในรูปแบบ 3D Interactive บนเว็บเบราว์เซอร์ พัฒนาด้วยสถาปัตยกรรม **Full Object-Oriented Programming (OOP)** อย่างเต็มรูปแบบ

## 🛠️ Tech Stack

- **Vite** — Build Tool และ Dev Server ความเร็วสูง
- **TypeScript** — Type-safe JavaScript สำหรับการออกแบบ OOP ที่สมบูรณ์
- **Three.js** — 3D WebGL Rendering Engine
- **Tailwind CSS** — Utility-first CSS สำหรับจัดวาง Layout และ UI Overlay

---

## 🏗️ สถาปัตยกรรม Full OOP (Architecture)

โปรเจกต์นี้ประยุกต์ใช้หลักการ OOP ทั้ง 4 เสาหลักร่วมกับ Design Patterns:

1. **Abstraction & Interfaces:** กำหนด Contract กลางผ่าน `IUpdatable`, `IDisposable` และ `IMirrorable`
2. **Inheritance:** สืบทอดคลาสจาก `THREE.Group` ผ่านคลาสแม่ `WorldEntity` และแตกสายพฤติกรรมออกเป็น `SurfaceEntity` (วัตถุที่ยึดติดบนผิวดาว) และ `OrbitingEntity` (วัตถุที่โคจรรอบดาว)
3. **Polymorphism:** `SceneManager` วนลูปเรียกเมธอด `.update()` ของวัตถุทุกชนิดในฉากผ่าน Interface เดียวกัน
4. **Encapsulation & Flyweight Pattern:** จัดการ Material กลางผ่าน `MaterialLibrary` และสร้างลวดลายด้วย `TextureFactory` เพื่อลดการใช้หน่วยความจำ GPU

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
kai-planet-3d/
├── index.html                  # หน้าเว็บหลัก + UI Overlay (Tailwind CSS)
├── package.json                # Dependencies (three, @types/three, tailwindcss)
├── tsconfig.json               # ตั้งค่า TypeScript Compiler
├── vite.config.ts              # ตั้งค่า Vite
├── README.md                   # เอกสารอธิบายโปรเจกต์
│
└── src/
    ├── main.ts                     # จุดเริ่มต้นโปรแกรม ประกอบฉากผ่าน AppEngine
    ├── style.css                   # นำเข้า @import "tailwindcss";
    ├── vite-env.d.ts               # Type Definitions สำหรับ Vite Client
    ├── css.d.ts                    # Type Definitions สำหรับการนำเข้าไฟล์ .css
    │
    ├── core/                       # แกนหลักของ Engine & ระบบจัดการทรัพยากร
    │   ├── interfaces.ts           # IUpdatable, IDisposable, IMirrorable
    │   ├── AppEngine.ts            # คุม Renderer, Resize, Render Loop
    │   ├── SceneManager.ts         # จัดการ Scene และวนลูปเรียก update() แบบ Polymorphism
    │   ├── CameraRig.ts            # ห่อหุ้ม PerspectiveCamera + OrbitControls
    │   ├── LightRig.ts             # จัดการแสงและเงา
    │   ├── SkyEnvironment.ts       # ท้องฟ้าไล่เฉดสีชมพู-เหลืองทอง
    │   └── MaterialLibrary.ts      # คลังเก็บ Material กลาง (Static Cache)
    │
    ├── entities/                   # คลาส 3D ที่ extends THREE.Group โดยตรง
    │   ├── base/                   # โฟลเดอร์รวมคลาสแม่ (Abstract Classes)
    │   │   ├── WorldEntity.ts      # extends THREE.Group + Template Method
    │   │   ├── SurfaceEntity.ts    # คลาสแม่ของวัตถุที่ปักบนดาว (มี snapToSphere())
    │   │   └── OrbitingEntity.ts   # คลาสแม่ของวัตถุที่โคจรรอบดาว (implements IUpdatable)
    │   │
    │   ├── planet/                 # กลุ่มตัวดาวและสิ่งก่อสร้าง
    │   │   ├── KaiPlanet.ts        # ตัวดาวทรงกลม + ถนนวงแหวน
    │   │   ├── KaiHouse.ts         # extends SurfaceEntity (บ้านบังเกอร์ + ผ้าม่าน + หลังคา 3 ชั้น)
    │   │   └── Garage.ts           # extends SurfaceEntity (โรงรถครึ่งวงกลม)
    │   │
    │   ├── vehicles/               # กลุ่มยานพาหนะและสิ่งเคลื่อนที่
    │   │   ├── KaiCar.ts           # extends OrbitingEntity (รถแดงหลังคาขาววิ่งวนบนถนน)
    │   │   └── FloatingRock.ts     # extends OrbitingEntity (ก้อนหินลอยรอบดาว)
    │   │
    │   └── props/                  # พร็อพตกแต่งบนผิวดาว
    │       ├── Tree.ts             # extends SurfaceEntity (ต้นไม้)
    │       ├── Well.ts             # extends SurfaceEntity (บ่อน้ำวงกลม)
    │       └── Bench.ts            # extends SurfaceEntity (ม้านั่งยาวหน้าบ้าน)
    │
    └── utils/                      # เครื่องมือเสริม
        ├── SymmetryHelper.ts       # ตัวช่วยทำ Mirror ซ้าย-ขวา (ขาโต๊ะ, ล้อรถ, หน้าต่าง)
        └── TextureFactory.ts       # สร้างลายอิฐบ้านและลายอิฐถนนด้วย HTML5 Canvas
```

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Getting Started)

1. **สร้างโปรเจกต์ Vite + TypeScript:**

   ```bash
   npm create vite@latest kai-planet-3d -- --template vanilla-ts
   cd kai-planet-3d
   ```

2. **ติดตั้ง Three.js และ Tailwind CSS (v4):**

   ```bash
   npm install three tailwindcss @tailwindcss/vite
   npm install -D @types/three
   ```

3. **รัน Development Server:**
   ```bash
   npm run dev
   ```
