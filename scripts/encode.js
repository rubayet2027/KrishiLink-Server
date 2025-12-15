const fs = require("fs");
const path = require("path");

// Check if a custom path was provided as argument
const keyPath = process.argv[2] || "./firebase-admin-key.json";

try {
  const key = fs.readFileSync(path.resolve(keyPath), "utf8");
  const base64 = Buffer.from(key).toString("base64");
  
  // Output only the base64 string for easy copying
  console.log(base64);
} catch (error) {
  console.error("Error: Could not read file");
  console.log("Usage: node scripts/encode.js [path-to-firebase-key.json]");
  process.exit(1);
}
