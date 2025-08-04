import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, "useful_words.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");

// Parse CSV
const lines = csvContent.trim().split("\n");
const headers = lines[0].split(",");

// Find indices of the columns we want
const rankIndex = headers.indexOf("Rank");
const wordIndex = headers.indexOf("Word(s)");
const scoreIndex = headers.indexOf("Usefulness Score");

// Convert to JSON
const jsonData = [];
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(",");
  jsonData.push({
    index: parseInt(values[rankIndex]),
    words: values[wordIndex],
    score: parseInt(values[scoreIndex]),
  });
}

// Write JSON file
const jsonPath = path.join(__dirname, "useful_words.json");
fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

console.log(`Converted ${jsonData.length} records to JSON`);
