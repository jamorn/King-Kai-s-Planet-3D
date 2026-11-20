// src/core/AppEngine.ts
import * as THREE from "three";
import { CameraRig } from "./CameraRig";
import { SceneManager } from "./SceneManager";
import { MaterialLibrary } from "./MaterialLibrary";
import { IDisposable } from "./interfaces";

/**
 * Main Engine Controller (Facade Pattern)
 * ควบคุม Lifecycle ทั้งหมดของแอปพลิเคชัน 3D ตั้งแต่การสร้าง Renderer, Loop ไปจนถึงการทำลาย
 */
export class AppEngine implements IDisposable {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly sceneManager: SceneManager;
  public readonly cameraRig: CameraRig;

  private readonly container: HTMLElement;
  private readonly clock: THREE.Clock;
  private animationFrameId: number | null = null;

  constructor(containerSelector: string) {
    const targetElement =
      document.querySelector<HTMLElement>(containerSelector);
    if (!targetElement) {
      throw new Error(
        `[AppEngine] ไม่พบ Element เป้าหมาย: ${containerSelector}`,
      );
    }
    this.container = targetElement;

    // 1. เตรียมคลัง Material กลางก่อนเริ่มสร้างวัตถุใดๆ
    MaterialLibrary.initDefaults();

    // 2. ตั้งค่า WebGLRenderer พร้อมเปิดระบบเงาแบบนุ่มนวล (PCFSoftShadowMap)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    // 3. ประกอบระบบกล้องและระบบจัดการฉาก
    const aspect =
      this.container.clientWidth / Math.max(this.container.clientHeight, 1);
    this.cameraRig = new CameraRig(this.renderer.domElement, aspect);
    this.sceneManager = new SceneManager();

    // ⚠️ autoStart = false เพื่อไม่ให้ clock เดินตั้งแต่ตอนสร้าง engine
    // (clock จะเริ่มเดินจริงตอนเรียก start() เท่านั้น ป้องกัน delta ก้อนใหญ่เฟรมแรก)
    this.clock = new THREE.Clock(false);

    // 4. ผูก Event Listener สำหรับการปรับขนาดหน้าจอ
    window.addEventListener("resize", this.onWindowResize);
  }

  /**
   * เริ่มต้นการทำงานของ Render Loop
   */
  public start(): void {
    if (this.animationFrameId !== null) return;
    // reset เวลาสะสม ให้ getDelta() เฟรมแรกมีค่าใกล้ 0 (กันรถกระโดดหลัง stop()→start())
    this.clock.stop();
    this.clock.start();
    this.animate();
  }

  /**
   * หยุดการทำงานของ Render Loop ชั่วคราว
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main Animation Loop (60+ FPS)
   */
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // clamp delta ไม่ให้เกิน 0.1s กันกรณี tab ถูกพัก/เครื่องหน่วง → เหตุการณ์กระตุกหรือทะลุผ่าน
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // อัปเดตกล้องและวัตถุทุกชิ้นในฉากแบบ Polymorphism
    this.cameraRig.update(deltaTime, elapsedTime);
    this.sceneManager.update(deltaTime, elapsedTime);

    this.renderer.render(this.sceneManager.scene, this.cameraRig.camera);
  };

  /**
   * จัดการเมื่อมีการปรับขนาดหน้าจอ Browser
   */
  private onWindowResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.cameraRig.handleResize(width, height);
    this.renderer.setSize(width, height);
  };

  /**
   * คืนทรัพยากรทั้งหมดเมื่อปิดหน้าเว็บหรือเปลี่ยนหน้า (Clean Shutdown)
   */
  public dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.onWindowResize);

    this.sceneManager.dispose();
    this.cameraRig.dispose();
    MaterialLibrary.disposeAll();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
