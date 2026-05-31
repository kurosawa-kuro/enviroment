import { cloudinary } from "./config.js";

/**
 * 画像を削除
 * @param {string} publicId - Public ID
 * @param {string} resourceType - リソースタイプ
 * @returns {Promise<object>} 削除結果
 */
export async function deleteImage(publicId, resourceType = "image") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log("Deleted:", publicId, "->", result.result);
    return result;
  } catch (err) {
    console.error("Delete Error:", err.message);
    throw err;
  }
}

/**
 * 複数の画像を一括削除
 * @param {string[]} publicIds - Public ID の配列
 * @param {string} resourceType - リソースタイプ
 * @returns {Promise<object>} 削除結果
 */
export async function deleteMultiple(publicIds, resourceType = "image") {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    console.log("Deleted multiple:", Object.keys(result.deleted).length, "items");
    return result;
  } catch (err) {
    console.error("Delete Multiple Error:", err.message);
    throw err;
  }
}

/**
 * フォルダ内のすべての画像を削除
 * @param {string} folder - フォルダ名
 * @returns {Promise<object>} 削除結果
 */
export async function deleteByFolder(folder) {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folder);
    console.log("Deleted folder contents:", folder);
    return result;
  } catch (err) {
    console.error("Delete Folder Error:", err.message);
    throw err;
  }
}
