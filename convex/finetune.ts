import { v } from "convex/values";
import { query } from "./_generated/server";
import { SYSTEM_PROMPT } from "./rag";
import { finetuneExamples } from "./finetuneData";

/**
 * Build one OpenAI chat fine-tuning JSONL line from a system/user/assistant triple.
 * Each line is a standalone JSON object; callers join them with "\n".
 */
function toJsonlLine(
  system: string,
  user: string,
  assistant: string,
): string {
  return JSON.stringify({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
      { role: "assistant", content: assistant },
    ],
  });
}

const exportReturnValidator = v.object({
  jsonl: v.string(),
  count: v.number(),
});

/**
 * Export the curated, attorney-reviewable Q&A dataset (convex/finetuneData.ts) as OpenAI
 * chat fine-tuning JSONL. The system message is the exact production prompt (SYSTEM_PROMPT
 * from rag.ts) so training data matches live behavior. Returns the newline-delimited JSONL
 * as a single string plus the example count. Run with:
 *   npx convex run finetune:exportJsonl
 *
 * NOTE: These examples must be reviewed by a licensed attorney before real fine-tuning.
 */
export const exportJsonl = query({
  args: {},
  returns: exportReturnValidator,
  handler: async () => {
    const lines = finetuneExamples.map((example) =>
      toJsonlLine(SYSTEM_PROMPT, example.question, example.answer),
    );
    return { jsonl: lines.join("\n"), count: lines.length };
  },
});

/**
 * Export previously-recorded assistant answers (the `messages` table) as fine-tuning JSONL.
 * Only "suitable" messages are included: those that were answered from retrieved context
 * (citations present), which excludes empty-corpus/refusal responses. This is a secondary
 * source; the curated dataset above is the primary deliverable, and any message-derived
 * examples must still be attorney-reviewed before real fine-tuning.
 */
export const exportFromMessages = query({
  args: { limit: v.optional(v.number()) },
  returns: exportReturnValidator,
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_created")
      .order("desc")
      .take(limit);

    const lines = messages
      .filter((message) => message.citations.length > 0)
      .map((message) =>
        toJsonlLine(SYSTEM_PROMPT, message.question, message.answer),
      );

    return { jsonl: lines.join("\n"), count: lines.length };
  },
});
