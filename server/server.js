import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeStudents } from "./normalize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDENTS_FILE = path.join(__dirname, "db", "students.json");
const PORT = 3001;

const app = express();
app.use(cors());

app.get("/api/students", async (req, res) => {
  try {
    const raw = await readFile(STUDENTS_FILE, "utf8");
    // Windows editors often save JSON with a UTF-8 BOM, which JSON.parse rejects
    const students = JSON.parse(raw.replace(/^\uFEFF/, ""));
    // normalizeStudents() silently maps non-arrays to [], which would serve an
    // empty roster as if it were real data. Fail loudly instead.
    if (!Array.isArray(students)) {
      throw new Error("students.json must contain a JSON array");
    }
    res.json(normalizeStudents(students));
  } catch (err) {
    console.error("Failed to load students:", err.message);
    res.status(500).json({ error: "Failed to load student data" });
  }
});

app.listen(PORT, () => {
  console.log(`EduSkills server listening on http://localhost:${PORT}`);
});
