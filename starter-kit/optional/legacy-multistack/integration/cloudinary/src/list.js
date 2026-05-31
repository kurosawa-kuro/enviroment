import { cloudinary } from "./config.js";

/**
 * フォルダ内の画像一覧を取得
 * @param {string} folder - フォルダ名
 * @param {number} maxResults - 最大取得数
 * @returns {Promise<object[]>} 画像リスト
 */
export async function listImages(folder = "starter", maxResults = 30) {
  try {
    const response = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by("created_at", "desc")
      .max_results(maxResults)
      .execute();

    console.log(`Found ${response.total_count} images in folder: ${folder}`);
    return response.resources;
  } catch (err) {
    console.error("List Error:", err.message);
    throw err;
  }
}

/**
 * すべてのリソースを取得（Admin API）
 * @param {string} resourceType - リソースタイプ (image, video, raw)
 * @param {number} maxResults - 最大取得数
 * @returns {Promise<object[]>} リソースリスト
 */
export async function listAllResources(resourceType = "image", maxResults = 30) {
  try {
    const response = await cloudinary.api.resources({
      resource_type: resourceType,
      max_results: maxResults,
    });

    console.log(`Found ${response.resources.length} ${resourceType} resources`);
    return response.resources;
  } catch (err) {
    console.error("List All Error:", err.message);
    throw err;
  }
}

/**
 * フォルダ一覧を取得
 * @returns {Promise<object[]>} フォルダリスト
 */
export async function listFolders() {
  try {
    const response = await cloudinary.api.root_folders();
    console.log(`Found ${response.folders.length} folders`);
    return response.folders;
  } catch (err) {
    console.error("List Folders Error:", err.message);
    throw err;
  }
}
