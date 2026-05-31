import { cloudinary } from "./config.js";

/**
 * ローカルファイルを Cloudinary にアップロード
 * @param {string} filePath - ローカルファイルパス
 * @param {string} folder - 保存先フォルダ
 * @param {object} options - 追加オプション
 * @returns {Promise<object>} アップロード結果
 */
export async function uploadFile(filePath, folder = "starter", options = {}) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
      ...options,
    });

    console.log("Uploaded:", result.public_id);
    console.log("URL:", result.secure_url);
    return result;
  } catch (err) {
    console.error("Upload Error:", err.message);
    throw err;
  }
}

/**
 * URL から Cloudinary にアップロード
 * @param {string} url - 画像URL
 * @param {string} folder - 保存先フォルダ
 * @param {object} options - 追加オプション
 * @returns {Promise<object>} アップロード結果
 */
export async function uploadFromUrl(url, folder = "starter", options = {}) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      resource_type: "auto",
      ...options,
    });

    console.log("Uploaded from URL:", result.public_id);
    console.log("URL:", result.secure_url);
    return result;
  } catch (err) {
    console.error("Upload from URL Error:", err.message);
    throw err;
  }
}
