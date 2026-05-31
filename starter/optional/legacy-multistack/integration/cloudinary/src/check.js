import { cloudinary } from "./config.js";

console.log("=== Cloudinary Configuration Check ===");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "***" : "(not set)");
console.log();

try {
  console.log("Testing API connection...");
  const result = await cloudinary.api.ping();
  console.log("API Status:", result.status);
  console.log("Connection successful!");
} catch (err) {
  console.error("Connection failed:", err.message || err);
  console.error("Error details:", JSON.stringify(err, null, 2));
  console.log();
  console.log("Please check:");
  console.log("1. Cloud Name, API Key, API Secret are correct");
  console.log("2. Account is active (not suspended)");
  console.log("3. API access is enabled in Cloudinary Console");
}
