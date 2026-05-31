import { uploadFile, uploadFromUrl } from "./upload.js";
import { listImages, listFolders } from "./list.js";
import { searchImages } from "./search.js";
import { deleteImage } from "./delete.js";
import fs from "fs";
import path from "path";

const FOLDER = "starter";

async function createSampleImage() {
  const samplePath = "./sample.png";

  // 簡単なテスト用PNG画像を作成（1x1 赤いピクセル）
  const pngData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe,
    0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  fs.writeFileSync(samplePath, pngData);
  console.log("Created sample.png for testing");
  return samplePath;
}

async function main() {
  console.log("=".repeat(50));
  console.log("  Cloudinary Node.js Starter - Demo");
  console.log("=".repeat(50));
  console.log();

  try {
    // 1) サンプル画像を作成
    console.log("1) Creating sample image...");
    const samplePath = await createSampleImage();
    console.log();

    // 2) アップロード
    console.log("2) Uploading to Cloudinary...");
    const uploaded = await uploadFile(samplePath, FOLDER);
    console.log("   Public ID:", uploaded.public_id);
    console.log("   URL:", uploaded.secure_url);
    console.log();

    // 3) フォルダ内の画像一覧
    console.log("3) Listing images in folder...");
    const images = await listImages(FOLDER);
    images.forEach((img) => {
      console.log("   -", img.public_id, `(${img.format}, ${img.bytes} bytes)`);
    });
    console.log();

    // 4) 検索
    console.log("4) Searching...");
    const searchResult = await searchImages(`public_id:${uploaded.public_id}`);
    console.log("   Found:", searchResult.length, "image(s)");
    console.log();

    // 5) 削除（スキップ）
    // console.log("5) Deleting uploaded image...");
    // await deleteImage(uploaded.public_id);
    // console.log();

    // クリーンアップ
    // fs.unlinkSync(samplePath);
    // console.log("Cleaned up local sample.png");

    console.log();
    console.log("=".repeat(50));
    console.log("  Demo completed successfully!");
    console.log("=".repeat(50));
  } catch (err) {
    console.error("Demo failed:", err.message);
    process.exit(1);
  }
}

main();
