import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// Markdown-native 404 for missed `.md` URLs (wired via the afterFiles
// rewrite in next.config.js, so it only runs when no real .md mirror
// matched). Returns closest-match links from llms.txt instead of an HTML
// error page, so agents can self-correct.

function suggestions(requested: string): { title: string; url: string }[] {
  try {
    const llms = fs.readFileSync(path.join(process.cwd(), "public", "llms.txt"), "utf8");
    const links: { title: string; url: string }[] = [];
    const linkRegex = /^- \[([^\]]+)\]\((\S+?\.md)\)/gm;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(llms)) !== null) {
      links.push({ title: match[1], url: match[2] });
    }
    const tokens = requested
      .replace(/\.md$/, "")
      .toLowerCase()
      .split(/[/-]/)
      .filter((t) => t.length > 2);
    return links
      .map((link) => {
        const haystack = link.url.toLowerCase();
        const score = tokens.filter((t) => haystack.includes(t)).length;
        return { ...link, score };
      })
      .filter((link) => link.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch {
    return [];
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const requested = typeof req.query.requested === "string" ? req.query.requested : "";
  const matches = suggestions(requested);

  const lines = [
    "# 404 — Page not found",
    "",
    `No markdown page exists at \`/${requested}\`.`,
    "",
  ];
  if (matches.length) {
    lines.push("Closest matches:", "");
    for (const match of matches) {
      lines.push(`- [${match.title}](${match.url})`);
    }
    lines.push("");
  }
  lines.push(
    "Full page index: https://docs.genlayer.com/llms.txt",
    "Complete documentation: https://docs.genlayer.com/llms-full.txt",
    ""
  );

  res
    .status(404)
    .setHeader("Content-Type", "text/markdown; charset=utf-8")
    .send(lines.join("\n"));
}
