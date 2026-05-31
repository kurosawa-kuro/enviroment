import { cloudinary } from "./config.js";

/**
 * Cloudinary Search API で画像を検索
 * @param {string} query - 検索クエリ（Lucene 構文）
 * @param {number} maxResults - 最大取得数
 * @returns {Promise<object[]>} 検索結果
 *
 * クエリ例:
 * - folder:starter
 * - public_id:starter/sample
 * - format:png
 * - created_at>[2024-01-01]
 * - bytes>1000000 (1MB以上)
 * - width>1000 AND height>1000
 * - tags=profile
 */
export async function searchImages(query, maxResults = 30) {
  try {
    const response = await cloudinary.search
      .expression(query)
      .sort_by("created_at", "desc")
      .max_results(maxResults)
      .with_field("tags")
      .with_field("context")
      .execute();

    console.log(`Search "${query}": ${response.total_count} results`);
    return response.resources;
  } catch (err) {
    console.error("Search Error:", err.message);
    throw err;
  }
}

/**
 * タグで画像を検索
 * @param {string} tag - タグ名
 * @param {number} maxResults - 最大取得数
 * @returns {Promise<object[]>} 検索結果
 */
export async function searchByTag(tag, maxResults = 30) {
  return searchImages(`tags=${tag}`, maxResults);
}

/**
 * フォーマットで画像を検索
 * @param {string} format - フォーマット (png, jpg, webp, etc.)
 * @param {number} maxResults - 最大取得数
 * @returns {Promise<object[]>} 検索結果
 */
export async function searchByFormat(format, maxResults = 30) {
  return searchImages(`format:${format}`, maxResults);
}
