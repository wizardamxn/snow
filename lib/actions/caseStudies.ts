"use server";

import fs from "fs";
import path from "path";

export async function getCaseStudy(id: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "content", "caseStudies", `${id}.md`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading case study:", error);
    return null;
  }
}
