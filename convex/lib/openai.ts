declare const process: { env: Record<string, string | undefined> };

const OPENAI_BASE = "https://api.openai.com/v1";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

function requireApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Configure it with `npx convex env set OPENAI_API_KEY <key>` before ingesting or asking.",
    );
  }
  return key;
}

export function chatModel(): string {
  return process.env.OPENAI_CHAT_MODEL ?? DEFAULT_CHAT_MODEL;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const apiKey = requireApiKey();
  const response = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI embeddings request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as EmbeddingResponse;
  return payload.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
}

export async function chatComplete(
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<string> {
  const apiKey = requireApiKey();
  const model = chatModel();

  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI chat request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as ChatResponse;
  const content = payload.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI chat response contained no content.");
  }
  return content;
}
