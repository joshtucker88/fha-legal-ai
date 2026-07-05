export interface TextChunk {
  text: string;
  sectionPath: string;
  chunkIndex: number;
}

const TARGET_CHARS = 1000;
const OVERLAP_CHARS = 150;

// Heuristic section header detection for legal text (e.g. "§ 3604", "Section 100.204",
// "(a)", "1.1 Statutes"). Used only to annotate chunks with a best-effort section path.
const SECTION_PATTERN =
  /^(?:(?:§+\s*[\w.\-]+)|(?:section\s+[\w.\-]+)|(?:sec\.\s*[\w.\-]+)|(?:\d+(?:\.\d+)+\s)|(?:\([a-z0-9]{1,3}\)\s)).*/i;

function detectSection(paragraph: string, fallback: string): string {
  const firstLine = paragraph.split("\n", 1)[0]?.trim() ?? "";
  if (firstLine && SECTION_PATTERN.test(firstLine)) {
    return firstLine.slice(0, 120);
  }
  return fallback;
}

/**
 * Splits raw legal text into overlapping, section-aware chunks. Paragraphs are the base
 * unit; long paragraphs are hard-split so no chunk greatly exceeds the target size.
 */
export function chunkText(raw: string): TextChunk[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: TextChunk[] = [];
  let buffer = "";
  let currentSection = "Document root";
  let bufferSection = currentSection;

  const flush = () => {
    const text = buffer.trim();
    if (text.length > 0) {
      chunks.push({
        text,
        sectionPath: bufferSection,
        chunkIndex: chunks.length,
      });
    }
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    currentSection = detectSection(paragraph, currentSection);

    // Hard-split paragraphs that are individually larger than the target.
    const pieces =
      paragraph.length > TARGET_CHARS ? hardSplit(paragraph, TARGET_CHARS) : [paragraph];

    for (const piece of pieces) {
      if (buffer.length === 0) {
        bufferSection = currentSection;
      }

      if (buffer.length + piece.length + 2 > TARGET_CHARS && buffer.length > 0) {
        const previous = buffer.trim();
        flush();
        // Carry a small overlap tail into the next chunk for retrieval continuity.
        buffer = previous.slice(Math.max(0, previous.length - OVERLAP_CHARS));
        bufferSection = currentSection;
      }

      buffer = buffer.length > 0 ? `${buffer}\n\n${piece}` : piece;
    }
  }

  flush();

  return chunks.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

function hardSplit(text: string, size: number): string[] {
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const sentenceBreak = text.lastIndexOf(". ", end);
      if (sentenceBreak > start + size * 0.5) {
        end = sentenceBreak + 1;
      }
    }
    pieces.push(text.slice(start, end).trim());
    start = end;
  }
  return pieces.filter((piece) => piece.length > 0);
}
