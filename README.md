# X Cockpit

Svelte + Convex cockpit for a RAG-first Fair Housing Act (FHA) legal research assistant,
built on the Utility Belt Harness workflow.

## Stack

- Svelte + Vite front end
- Convex local development backend (native vector search)
- OpenAI embeddings (`text-embedding-3-small`) + generation (`gpt-4o-mini`, configurable)
- Node 22 runtime
- Docker build target for the web cockpit

## What it does

- **Corpus planner**: track which authoritative FHA sources to collect, ranked by authority.
- **Ingest**: paste legal text -> section-aware chunking -> OpenAI embeddings -> stored in Convex with authority/jurisdiction metadata.
- **Ask**: a question is embedded, matched against the corpus via Convex vector search, re-ranked by legal authority, and answered **only** from retrieved passages with numbered citations and a legal-safety disclaimer.

This is legal information tooling, not legal advice. All output should be reviewed by a
licensed fair housing attorney before use in a matter.

## Development

Install dependencies:

```bash
npm install
```

Start Convex in development:

```bash
npm run convex:dev
```

Provide the OpenAI key to the Convex backend (never commit it to a file):

```bash
npx convex env set OPENAI_API_KEY sk-...
# optional: override the generation model (defaults to gpt-4o-mini)
npx convex env set OPENAI_CHAT_MODEL gpt-4o
```

Start the Svelte app:

```bash
npm run dev
```

Convex development writes `.env.local` with `VITE_CONVEX_URL`; `.env.local` is intentionally ignored.

If `OPENAI_API_KEY` is unset, ingest and ask calls fail with a clear message telling you to
set it; nothing else in the cockpit breaks.

### Using the assistant

1. In the **Ingest Source** panel, paste an authoritative passage (statute, regulation,
   HUD/DOJ guidance, or case text), set its jurisdiction, authority layer, and rank
   (1 = highest authority), then ingest.
2. In the **Ask The Corpus** panel, ask a question and optionally filter by jurisdiction.
   The answer is grounded only in ingested sources and lists the cited authority.

## Build

```bash
npm run build
```

Container build:

```bash
docker build -t x-cockpit .
```
