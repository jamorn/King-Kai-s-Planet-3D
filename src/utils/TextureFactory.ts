import * as THREE from "three";

/**
 * Factory Class สำหรับสร้าง Procedural Textures ด้วย HTML5 Canvas
 * ช่วยลดภาระการโหลดไฟล์รูปภาพภายนอก และปรับแต่งสีสันได้ยืดหยุ่น
 */
export class TextureFactory {
  /**
   * สร้าง Texture ลายก้อนอิฐสีส้ม-เหลือง สำหรับผนังบ้านท่านไคโอและโรงรถ
   */
  public static createHouseBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // สีพื้นหลังร่องปูน (สีน้ำตาลอมส้มเข้ม)
    ctx.fillStyle = "#9c5a25";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rows = 8;
    const cols = 4;
    const brickHeight = canvas.height / rows;
    const brickWidth = canvas.width / cols;
    const gap = 6; // ความหนาของร่องปูน

    // เฉดสีอิฐโทนส้ม-เหลืองนวล ตามภาพต้นฉบับ
    const palette = ["#f5b041", "#f39c12", "#f8c471", "#eb984e"];

    for (let row = 0; row < rows; row++) {
      // สลับฟันปลาทุกแถวคู่-คี่
      const offsetX = row % 2 === 0 ? 0 : brickWidth / 2;

      for (let col = -1; col <= cols; col++) {
        const x = col * brickWidth + offsetX;
        const y = row * brickHeight;

        // สุ่มเลือกเฉดสีอิฐให้ดูมีมิติเป็นธรรมชาติ
        const colorIndex = (row * 3 + col + 4) % palette.length;
        ctx.fillStyle = palette[colorIndex];

        ctx.fillRect(
          x + gap / 2,
          y + gap / 2,
          brickWidth - gap,
          brickHeight - gap,
        );
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(3, 2);

    return texture;
  }

  /**
   * สร้าง Texture ลายอิฐปูถนนสีเทา-ขาว สำหรับถนนวงแหวนรอบดาว
   */
  public static createRoadBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // สีร่องระหว่างแผ่นหิน (สีเทาเข้ม)
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rows = 12;
    const cols = 3;
    const tileHeight = canvas.height / rows;
    const tileWidth = canvas.width / cols;
    const gap = 5;

    const stoneShades = ["#ecf0f1", "#dfe6e9", "#d5dbdb"];

    for (let row = 0; row < rows; row++) {
      const offsetX = row % 2 === 0 ? 0 : tileWidth / 2;

      for (let col = -1; col <= cols; col++) {
        const x = col * tileWidth + offsetX;
        const y = row * tileHeight;

        const shade = stoneShades[(row + col + 3) % stoneShades.length];
        ctx.fillStyle = shade;

        ctx.fillRect(
          x + gap / 2,
          y + gap / 2,
          tileWidth - gap,
          tileHeight - gap,
        );
      }
    }

    // วาดเส้นขอบถนนซ้าย-ขวาให้ดูคมชัด
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(0, 0, 12, canvas.height);
    ctx.fillRect(canvas.width - 12, 0, 12, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat.set(1, 24); // วนซ้ำรอบวงแหวนถนน

    return texture;
  }
}