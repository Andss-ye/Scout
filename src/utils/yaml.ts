import fs from "node:fs/promises";
import matter from "gray-matter";
import { SKILL_FRONTMATTER_REQUIRED } from "../spec/claude.js";

export interface SkillFrontmatter {
  name: string;
  description: string;
  [k: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
  valid: boolean;
  errors: string[];
}

export async function parseSkillFile(absPath: string): Promise<ParsedSkill> {
  const raw = await fs.readFile(absPath, "utf8");
  return parseSkill(raw);
}

export function parseSkill(raw: string): ParsedSkill {
  const { data, content } = matter(raw);
  const errors: string[] = [];
  for (const field of SKILL_FRONTMATTER_REQUIRED) {
    if (typeof data[field] !== "string" || data[field].length === 0) {
      errors.push(`missing or invalid frontmatter field: ${field}`);
    }
  }
  return {
    frontmatter: data as SkillFrontmatter,
    body: content,
    valid: errors.length === 0,
    errors,
  };
}
