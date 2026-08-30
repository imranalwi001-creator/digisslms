import sharp from "sharp";
import * as path from "node:path";
import * as fs from "node:fs";

async function makeLogoTransparent() {
  const inputPath = path.resolve(process.cwd(), "src/assets/digisschool-logo.png");
  const outputPath = path.resolve(process.cwd(), "src/assets/digisschool-logo-transparent.png");

  const image = sharp(inputPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Processing image: ${width}x${height}, channels: ${channels}`);

  // Sample corner color as background reference
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  console.log(`Background sample: R=${bgR}, G=${bgG}, B=${bgB}`);

  // Loop through pixels and set transparency for background
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Distance from sample background
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );

    // If pixel is very close to background color or very light grey/white
    if (dist < 28 || (r > 238 && g > 238 && b > 238)) {
      data[i + 3] = 0; // Completely transparent
    } else if (dist < 45) {
      // Smooth anti-aliased edge
      const alpha = Math.floor(((dist - 28) / (45 - 28)) * 255);
      data[i + 3] = alpha;
    }
  }

  // Save back to PNG
  const finalBuffer = await sharp(data, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .png()
    .toBuffer();

  // Overwrite assets and public files
  fs.writeFileSync(path.resolve(process.cwd(), "src/assets/digisschool-logo.png"), finalBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), "public/digisschool-logo.png"), finalBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), "public/favicon.png"), finalBuffer);
  fs.writeFileSync(path.resolve(process.cwd(), "public/favicon.ico"), finalBuffer);

  console.log("✅ Transparent logo generated and saved across all asset locations!");
}

makeLogoTransparent().catch(console.error);
