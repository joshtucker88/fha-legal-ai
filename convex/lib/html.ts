/**
 * Lightweight, dependency-free HTML -> readable text extraction.
 *
 * This is intentionally regex-based (no DOM/parser dependency) so it can run inside a
 * Convex action. It strips non-content elements (scripts, styles, nav/header/footer),
 * converts block-level tags to paragraph breaks, removes remaining markup, decodes the
 * common HTML entities, and collapses whitespace. The result is paragraph text separated
 * by blank lines, which is exactly what chunkText() (convex/lib/chunk.ts) expects.
 *
 * It is not a full HTML parser and will not perfectly handle every page, but it produces
 * clean enough text for embedding authoritative legal sources (statutes, regulations).
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201d",
  ldquo: "\u201c",
  sect: "\u00a7",
  para: "\u00b6",
  copy: "\u00a9",
  reg: "\u00ae",
  deg: "\u00b0",
  eacute: "\u00e9",
};

function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const codePoint = Number.parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isFinite(codePoint) && codePoint > 0) {
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return match;
        }
      }
      return match;
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

/**
 * Extract readable paragraph text from an HTML document.
 * Returns paragraphs joined by blank lines, or an empty string if nothing usable remains.
 */
export function extractReadableText(html: string): string {
  let text = html;

  // Drop everything that never contributes readable body text.
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<head[\s\S]*?<\/head>/gi, " ");
  text = text.replace(/<(script|style|noscript|template|svg|iframe)[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ");

  // Convert block-level boundaries into paragraph breaks so structure survives.
  text = text.replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|pre)>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "\n- ");

  // Remove all remaining tags.
  text = text.replace(/<[^>]+>/g, " ");

  text = decodeEntities(text);

  // Normalize whitespace: collapse runs of spaces/tabs, trim each line, and reduce
  // large runs of blank lines to a single paragraph break.
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim());

  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.length === 0) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join("\n\n")
    .trim();
}
