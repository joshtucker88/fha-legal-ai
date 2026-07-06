<script lang="ts">
  import { onMount } from "svelte";
  import {
    answerQuestion,
    convexConfigured,
    corpusSources,
    createCorpusSource,
    evalRuns,
    ingestDocument,
    legalDocuments,
    legalMessages,
    seedPlanner,
    updateSourceStatus,
    type AnswerResult,
    type AuthorityLayer,
    type CorpusSource,
    type EvalRun,
    type LegalMessage,
    type SourceStatus,
    type SourceUseCase,
  } from "./lib/convex";
  import CitationList from "./lib/CitationList.svelte";
  import { layerLabel, statusLabel, useCaseLabel } from "./lib/labels";

  const statuses: SourceStatus[] = ["todo", "collecting", "ready", "reviewed"];
  const authorityLayers: AuthorityLayer[] = [
    "primaryLaw",
    "agencyGuidance",
    "enforcementData",
    "caseLaw",
    "secondaryMaterial",
    "evaluation",
  ];
  const useCases: SourceUseCase[] = ["rag", "fineTune", "evaluation", "context"];

  const corpusTargets = [
    {
      label: "RAG Corpus",
      value: "Authoritative law first",
      detail: "Statutes, regulations, HUD/DOJ guidance, state/local law, and selected controlling cases.",
    },
    {
      label: "Behavior Tuning",
      value: "5k-20k examples",
      detail: "Attorney-reviewed Q&A, intake triage, memo outlines, and citation-grounded issue spotting.",
    },
    {
      label: "Gold Evaluation",
      value: "300-1k prompts",
      detail: "Citation accuracy, jurisdiction control, protected-class analysis, and legal-safety refusals.",
    },
  ];

  const issueMap = [
    {
      label: "Disability / ESA",
      detail:
        "Treat two VA-supported emotional support animals as a reasonable accommodation and test necessity, documentation, direct threat, and undue-burden defenses.",
    },
    {
      label: "Tribal Membership",
      detail:
        "Track race, ancestry, national origin, and cultural-participation facts without assuming tribal-housing law applies to off-reservation Chicago housing.",
    },
    {
      label: "Veteran Status",
      detail:
        "Veteran status is not a standalone federal FHA protected class, but VA disability evidence, military status protections, source-of-income rules, and local/state laws may matter.",
    },
    {
      label: "Forum Strategy",
      detail:
        "Compare HUD, Illinois Department of Human Rights, Chicago Commission on Human Relations, and civil litigation timing before choosing a route.",
    },
  ];

  const metadataFields = [
    "source_title",
    "authority_layer",
    "jurisdiction",
    "effective_date",
    "retrieved_at",
    "citation_string",
    "url",
    "chunk_id",
    "section_path",
    "protected_class_tags",
    "issue_tags",
    "authority_rank",
    "review_status",
  ];

  const validationGates = [
    {
      label: "Authority Ranking",
      detail:
        "Federal statutes and regulations outrank guidance, controlling cases outrank persuasive cases, and secondary material never overrides primary law.",
    },
    {
      label: "Citation Integrity",
      detail:
        "Every answerable legal claim needs a retrievable citation string, source URL, section path, and quote span before it can be used for evaluation or supervised examples.",
    },
    {
      label: "Jurisdiction Control",
      detail:
        "Separate federal, Illinois, Chicago, tribal-housing, and persuasive authority so the assistant does not blend rules from the wrong forum.",
    },
    {
      label: "Legal Safety",
      detail:
        "Evaluation prompts should test uncertainty, attorney-review handoff, no invented deadlines, and refusal to present itself as a lawyer.",
    },
  ];

  const aiPrompt = `I'm building a fair-housing-focused legal AI assistant for U.S. practice, starting with disability reasonable accommodations and emotional support animals in Illinois/Chicago condo housing.

Please produce a source-by-source data plan. Separate sources into: primary law, agency guidance, enforcement data, case law, secondary material, and evaluation data.

For each source, say whether it belongs in RAG, fine-tuning, evaluation, or context only. Include authority ranking, suggested metadata fields, chunking strategy, citation validation rules, and minimum viable vs production corpus size.

Also account for these issue areas: FHA disability accommodation, assistance animals supported by VA medical documentation, off-reservation tribal-member impacts, potential race/national-origin/ancestry framing, veteran-status adjacency, Illinois law, Chicago local law, and condo association obligations.

Do not give legal advice or invent citations. Identify where a licensed attorney or fair housing organization should review the plan.`;

  let title = "";
  let authorityLayer: AuthorityLayer = "primaryLaw";
  let useCase: SourceUseCase = "rag";
  let authorityRank = 13;
  let sourceUrl = "";
  let note = "";
  let busy = false;
  let message = "";

  const jurisdictionOptions = [
    "all",
    "US_federal",
    "Illinois",
    "Chicago",
    "Seventh_Circuit",
    "tribal",
  ];

  let question = "";
  let askJurisdiction = "all";
  let asking = false;
  let askError = "";
  let currentAnswer: AnswerResult | null = null;

  let docTitle = "";
  let docText = "";
  let docSourceUrl = "";
  let docJurisdiction = "US_federal";
  let docAuthorityLayer: AuthorityLayer = "primaryLaw";
  let docAuthorityRank = 1;
  let docCitation = "";
  let docEffectiveDate = "";
  let ingesting = false;
  let ingestMessage = "";

  $: totalDocuments = $legalDocuments.length;
  $: totalChunks = $legalDocuments.reduce((sum, doc) => sum + doc.chunkCount, 0);

  let selectedRunId: string | null = null;
  $: latestRun = $evalRuns.length > 0 ? $evalRuns[0] : null;
  $: selectedRun =
    $evalRuns.find((run) => run._id === selectedRunId) ?? latestRun;

  function formatPercent(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  function formatRunTimestamp(createdAt: number): string {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function jurisdictionLabel(filter: string): string {
    return filter && filter.toLowerCase() !== "all" ? filter : "All jurisdictions";
  }

  let historyQuery = "";
  $: filteredHistory = ((): LegalMessage[] => {
    const needle = historyQuery.trim().toLowerCase();
    if (!needle) {
      return $legalMessages;
    }
    return $legalMessages.filter(
      (entry) =>
        entry.question.toLowerCase().includes(needle) ||
        entry.answer.toLowerCase().includes(needle),
    );
  })();

  function askAgain(entry: LegalMessage): void {
    question = entry.question;
    askJurisdiction = jurisdictionOptions.includes(entry.jurisdictionFilter)
      ? entry.jurisdictionFilter
      : "all";
    void ask();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function metricRate(metric: EvalRun["metrics"][number]): number {
    return metric.applicable > 0 ? metric.passed / metric.applicable : 0;
  }

  async function ask() {
    if (!convexConfigured) {
      askError = "Connect Convex first (run npm run convex:dev).";
      return;
    }
    if (!question.trim()) {
      askError = "Enter a question.";
      return;
    }

    asking = true;
    askError = "";

    try {
      currentAnswer = await answerQuestion(question.trim(), askJurisdiction);
    } catch (error: unknown) {
      askError = error instanceof Error ? error.message : "Failed to answer question.";
    } finally {
      asking = false;
    }
  }

  async function ingest() {
    if (!convexConfigured) {
      ingestMessage = "Connect Convex first (run npm run convex:dev).";
      return;
    }
    if (!docTitle.trim() || !docText.trim()) {
      ingestMessage = "Document title and text are required.";
      return;
    }

    ingesting = true;
    ingestMessage = "";

    try {
      const result = await ingestDocument({
        title: docTitle.trim(),
        text: docText,
        sourceUrl: docSourceUrl.trim(),
        jurisdiction: docJurisdiction.trim() || "US_federal",
        authorityLayer: docAuthorityLayer,
        authorityRank: Number(docAuthorityRank),
        citation: docCitation.trim(),
        effectiveDate: docEffectiveDate.trim(),
      });
      ingestMessage = result.deduped
        ? `"${docTitle.trim()}" was already in the corpus (matched by source URL); nothing re-ingested.`
        : `Ingested "${docTitle.trim()}" into ${result.chunkCount} chunk(s).`;
      docTitle = "";
      docText = "";
      docSourceUrl = "";
      docCitation = "";
      docEffectiveDate = "";
    } catch (error: unknown) {
      ingestMessage = error instanceof Error ? error.message : "Failed to ingest document.";
    } finally {
      ingesting = false;
    }
  }

  $: total = $corpusSources.length;
  $: ready = $corpusSources.filter(
    (source) => source.status === "ready" || source.status === "reviewed",
  ).length;
  $: ragSources = $corpusSources.filter((source) => source.useCase === "rag").length;
  $: reviewed = $corpusSources.filter((source) => source.status === "reviewed").length;

  onMount(() => {
    if (!convexConfigured) {
      message = "Set VITE_CONVEX_URL or run npm run convex:dev to connect live data.";
      return;
    }

    seedPlanner().catch((error: unknown) => {
      message = error instanceof Error ? error.message : "Failed to seed legal planner.";
    });
  });

  async function addSource() {
    if (!title.trim()) {
      message = "Source title is required.";
      return;
    }

    busy = true;
    message = "";

    try {
      await createCorpusSource({
        title: title.trim(),
        authorityLayer,
        useCase,
        authorityRank: Number(authorityRank),
        sourceUrl: sourceUrl.trim(),
        note: note.trim(),
      });
      title = "";
      sourceUrl = "";
      note = "";
      authorityRank += 1;
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "Failed to create source.";
    } finally {
      busy = false;
    }
  }

  async function setStatus(source: CorpusSource, status: SourceStatus) {
    if (source.status === status) {
      return;
    }

    try {
      await updateSourceStatus(source._id, status);
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : "Failed to update status.";
    }
  }

  function buildMarkdownPlan(sources: CorpusSource[]): string {
    const sourceSections = sources
      .map(
        (source) => `### ${source.authorityRank}. ${source.title}
- Layer: ${layerLabel(source.authorityLayer)}
- Use: ${useCaseLabel(source.useCase)}
- Status: ${statusLabel(source.status)}
- URL: ${source.sourceUrl || "TBD"}
- Notes: ${source.note || "None"}`,
      )
      .join("\n\n");

    return `# Fair Housing Legal AI Corpus Plan

## Architecture
Use a RAG-first legal assistant over authoritative Fair Housing Act, HUD/DOJ, Illinois, Chicago, assistance-animal, and selected case-law materials. Use fine-tuning only for answer style, intake triage, issue spotting, and memo structure.

## Corpus Targets
${corpusTargets.map((target) => `- ${target.label}: ${target.value}. ${target.detail}`).join("\n")}

## Issue Coverage
${issueMap.map((issue) => `- ${issue.label}: ${issue.detail}`).join("\n")}

## Required Metadata
${metadataFields.map((field) => `- ${field}`).join("\n")}

## Validation Gates
${validationGates.map((gate) => `- ${gate.label}: ${gate.detail}`).join("\n")}

## Source Checklist
${sourceSections || "- No sources loaded yet."}

## AI Prompt
${aiPrompt}
`;
  }

  function buildJsonPlan(sources: CorpusSource[]): string {
    const payload = {
      name: "Fair Housing Legal AI Corpus Plan",
      architecture: "RAG-first with supervised tuning for behavior, intake, and memo style.",
      corpusTargets,
      issueMap,
      metadataFields,
      validationGates,
      sources: sources.map((source) => ({
        title: source.title,
        authorityLayer: source.authorityLayer,
        authorityLayerLabel: layerLabel(source.authorityLayer),
        useCase: source.useCase,
        useCaseLabel: useCaseLabel(source.useCase),
        status: source.status,
        statusLabel: statusLabel(source.status),
        authorityRank: source.authorityRank,
        sourceUrl: source.sourceUrl,
        note: source.note,
      })),
      aiPrompt,
    };

    return JSON.stringify(payload, null, 2);
  }

  async function copyText(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      message = `${label} copied to clipboard.`;
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : `Failed to copy ${label}.`;
    }
  }
</script>

<main class="shell">
  <section class="hero">
    <p class="eyebrow">Utility Belt Harness / FHA Legal AI</p>
    <h1>Fair Housing Corpus Planner</h1>
    <p>
      A RAG-first build board for a specialized legal assistant covering Fair Housing
      Act reasonable accommodations, assistance animals, Illinois/Chicago housing law,
      tribal-member context, and veteran-status adjacency.
    </p>
    <p class="disclaimer">
      Planning tool only. It is not legal advice and should be reviewed by a licensed
      fair housing attorney or qualified legal aid organization before use in a matter.
    </p>
  </section>

  <section class="grid two-column assistant" aria-label="FHA legal assistant">
    <section class="panel ask-panel">
      <p class="eyebrow">RAG Assistant</p>
      <h2>Ask The Corpus</h2>
      <p class="assistant-sub">
        Answers are grounded only in ingested, authority-ranked sources. Corpus:
        {totalDocuments} document(s), {totalChunks} chunk(s).
      </p>

      <form class="ask-form" on:submit|preventDefault={ask}>
        <textarea
          bind:value={question}
          placeholder="e.g. Can a condo association deny an emotional support animal under the FHA?"
          aria-label="Legal question"
        ></textarea>
        <div class="ask-controls">
          <select bind:value={askJurisdiction} aria-label="Jurisdiction filter">
            {#each jurisdictionOptions as option}
              <option value={option}>{option === "all" ? "All jurisdictions" : option}</option>
            {/each}
          </select>
          <button disabled={asking || !convexConfigured} type="submit">
            {asking ? "Researching..." : "Ask"}
          </button>
        </div>
      </form>

      {#if askError}
        <p class="notice">{askError}</p>
      {/if}

      {#if currentAnswer}
        <article class="answer-box">
          <p class="meta">Model: {currentAnswer.model}{currentAnswer.usedContext ? "" : " / no matching context"}</p>
          <p class="answer-text">{currentAnswer.answer}</p>

          {#if currentAnswer.citations.length > 0}
            <p class="eyebrow">Cited Authority</p>
            <CitationList citations={currentAnswer.citations} />
          {/if}
        </article>
      {/if}
    </section>

    <section class="panel ingest-panel">
      <p class="eyebrow">Corpus Builder</p>
      <h2>Ingest Source</h2>
      <p class="assistant-sub">
        Paste authoritative legal text. It is chunked, embedded, and stored with authority
        metadata for retrieval. Rank 1 = highest authority (statutes/regulations).
      </p>

      {#if ingestMessage}
        <p class="notice">{ingestMessage}</p>
      {/if}

      <form class="ingest-form" on:submit|preventDefault={ingest}>
        <input bind:value={docTitle} placeholder="Document title" aria-label="Document title" />
        <input bind:value={docCitation} placeholder="Citation (e.g. 42 U.S.C. 3604(f))" aria-label="Citation" />
        <div class="ingest-row">
          <input bind:value={docJurisdiction} placeholder="Jurisdiction" aria-label="Jurisdiction" />
          <select bind:value={docAuthorityLayer} aria-label="Authority layer">
            {#each authorityLayers as layer}
              <option value={layer}>{layerLabel(layer)}</option>
            {/each}
          </select>
          <input
            bind:value={docAuthorityRank}
            type="number"
            min="1"
            max="100"
            aria-label="Authority rank"
          />
        </div>
        <div class="ingest-row">
          <input bind:value={docSourceUrl} placeholder="Source URL (optional)" aria-label="Source URL" />
          <input bind:value={docEffectiveDate} placeholder="Effective date (optional)" aria-label="Effective date" />
        </div>
        <textarea
          bind:value={docText}
          placeholder="Paste the statute, regulation, HUD/DOJ guidance, or case text here."
          aria-label="Document text"
        ></textarea>
        <button disabled={ingesting || !convexConfigured} type="submit">
          {ingesting ? "Ingesting..." : "Ingest Document"}
        </button>
      </form>

      {#if $legalDocuments.length > 0}
        <div class="doc-list">
          {#each $legalDocuments as doc}
            <article class="doc-row">
              <div>
                <strong>{doc.title}</strong>
                <p class="citation-meta">
                  {layerLabel(doc.authorityLayer)} / {doc.jurisdiction} / rank {doc.authorityRank} /
                  {doc.chunkCount} chunk(s)
                </p>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </section>

  <section class="panel history-panel" aria-label="Research history">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Session Log</p>
        <h2>Research History</h2>
      </div>
      <p>
        Every question asked against the corpus is recorded with its grounded
        answer and cited authority. Showing the {$legalMessages.length} most recent.
      </p>
    </div>

    {#if $legalMessages.length === 0}
      <p class="empty">No questions yet — ask the corpus above to start a research log.</p>
    {:else}
      <div class="history-filter">
        <input
          bind:value={historyQuery}
          placeholder="Filter history by keyword…"
          aria-label="Filter research history"
        />
        {#if historyQuery.trim()}
          <span class="history-count">{filteredHistory.length} / {$legalMessages.length}</span>
        {/if}
      </div>

      {#if filteredHistory.length === 0}
        <p class="empty">No entries match “{historyQuery.trim()}”.</p>
      {:else}
      <div class="history-list">
        {#each filteredHistory as entry}
          <details class="history-item" class:no-context={entry.citations.length === 0}>
            <summary>
              <span class="history-badge {entry.citations.length > 0 ? '' : 'muted'}">
                {entry.citations.length > 0 ? `${entry.citations.length} cited` : "No context"}
              </span>
              <span class="history-question">{entry.question}</span>
              <span class="history-meta">
                {jurisdictionLabel(entry.jurisdictionFilter)} · {formatRunTimestamp(entry.createdAt)}
              </span>
            </summary>
            <div class="history-body">
              <p class="answer-text">{entry.answer}</p>

              {#if entry.citations.length > 0}
                <p class="eyebrow">Cited Authority</p>
                <CitationList citations={entry.citations} />
              {/if}

              <div class="history-actions">
                <button
                  type="button"
                  class="history-again"
                  on:click={() => askAgain(entry)}
                  disabled={asking || !convexConfigured}
                >
                  {asking ? "Researching…" : "Ask again"}
                </button>
                <span class="meta history-model">Model: {entry.model || "unknown"}</span>
              </div>
            </div>
          </details>
        {/each}
      </div>
      {/if}
    {/if}
  </section>

  <section class="panel eval-panel" aria-label="Evaluation report">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Graded Evaluation Harness</p>
        <h2>Evaluation</h2>
      </div>
      <p>
        Read-only report of the graded eval set scored against the live corpus.
        Runs are produced by <code>npm run eval</code>.
      </p>
    </div>

    {#if !selectedRun}
      <p class="empty">No evaluation runs yet — run <code>npm run eval</code>.</p>
    {:else}
      {#if $evalRuns.length > 1}
        <div class="eval-run-select">
          <label for="eval-run">Run</label>
          <select id="eval-run" bind:value={selectedRunId} aria-label="Select evaluation run">
            {#each $evalRuns as run}
              <option value={run._id}>
                {formatRunTimestamp(run.createdAt)} — {formatPercent(run.passRate)} ({run.passed}/{run.totalCases})
              </option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="eval-summary">
        <article>
          <span>Model</span>
          <strong>{selectedRun.model || "unknown"}</strong>
        </article>
        <article>
          <span>Pass Rate</span>
          <strong>{formatPercent(selectedRun.passRate)}</strong>
        </article>
        <article>
          <span>Passed / Total</span>
          <strong>{selectedRun.passed} / {selectedRun.totalCases}</strong>
        </article>
        <article>
          <span>Recorded</span>
          <strong class="eval-timestamp">{formatRunTimestamp(selectedRun.createdAt)}</strong>
        </article>
      </div>

      <p class="eyebrow">Per-Dimension Metrics</p>
      <div class="eval-metrics">
        {#each selectedRun.metrics as metric}
          <div class="eval-metric">
            <div class="eval-metric-head">
              <span class="eval-metric-name">{metric.name}</span>
              <span class="eval-metric-count">{metric.passed}/{metric.applicable}</span>
            </div>
            <div class="eval-metric-track" role="presentation">
              <div class="eval-metric-fill" style={`width: ${(metricRate(metric) * 100).toFixed(0)}%`}></div>
            </div>
          </div>
        {:else}
          <p class="empty">No scored dimensions in this run.</p>
        {/each}
      </div>

      <p class="eyebrow">Cases</p>
      <div class="eval-cases">
        {#each selectedRun.cases as evalCase}
          <details class="eval-case" class:failed={!evalCase.passed}>
            <summary>
              <span class="badge {evalCase.passed ? 'pass' : 'fail'}">
                {evalCase.passed ? "PASS" : "FAIL"}
              </span>
              <span class="eval-case-id">{evalCase.id}</span>
              <span class="eval-case-meta">
                {evalCase.category} · {evalCase.jurisdictionFilter}
              </span>
            </summary>
            <div class="eval-case-body">
              <p class="eval-case-question">{evalCase.question}</p>

              <ul class="eval-checks">
                {#each evalCase.checks as check}
                  <li class:check-failed={!check.passed}>
                    <span class="check-dot {check.passed ? 'pass' : 'fail'}" aria-hidden="true"></span>
                    <span class="check-name">{check.name}</span>
                    <span class="check-detail">{check.detail}</span>
                  </li>
                {/each}
              </ul>

              <p class="eyebrow">Answer Preview</p>
              <p class="eval-answer">{evalCase.answerPreview}</p>

              {#if evalCase.citations.length > 0}
                <p class="eyebrow">Citations</p>
                <div class="pill-list">
                  {#each evalCase.citations as citation}
                    <span>{citation}</span>
                  {/each}
                </div>
              {:else}
                <p class="eval-empty-cites">No citations returned for this case.</p>
              {/if}
            </div>
          </details>
        {/each}
      </div>
    {/if}
  </section>

  <section class="grid metrics" aria-label="Cockpit metrics">
    <article>
      <span>Sources</span>
      <strong>{total}</strong>
    </article>
    <article>
      <span>Ready / Reviewed</span>
      <strong>{ready}</strong>
    </article>
    <article>
      <span>RAG Items</span>
      <strong>{ragSources}</strong>
    </article>
    <article>
      <span>Attorney Reviewed</span>
      <strong>{reviewed}</strong>
    </article>
  </section>

  <section class="grid targets" aria-label="Recommended corpus targets">
    {#each corpusTargets as target}
      <article>
        <p class="eyebrow">{target.label}</p>
        <h2>{target.value}</h2>
        <p>{target.detail}</p>
      </article>
    {/each}
  </section>

  <section class="grid two-column">
    <div>
      <section class="panel">
        <p class="eyebrow">Protected-Class And Fact Map</p>
        <h2>Issue Coverage</h2>
        <div class="issue-list">
          {#each issueMap as issue}
            <article>
              <h3>{issue.label}</h3>
              <p>{issue.detail}</p>
            </article>
          {/each}
        </div>
      </section>
    </div>

    <section class="panel prompt-panel">
      <p class="eyebrow">Prompt For Another AI</p>
      <h2>Data Acquisition Ask</h2>
      <div class="action-row" aria-label="Export actions">
        <button type="button" on:click={() => copyText(aiPrompt, "AI prompt")}>
          Copy Prompt
        </button>
        <button type="button" on:click={() => copyText(buildMarkdownPlan($corpusSources), "Markdown plan")}>
          Copy Markdown
        </button>
        <button type="button" on:click={() => copyText(buildJsonPlan($corpusSources), "JSON plan")}>
          Copy JSON
        </button>
      </div>
      <textarea readonly aria-label="Copyable AI prompt">{aiPrompt}</textarea>
    </section>
  </section>

  <section class="grid rubric" aria-label="Ingestion rubric">
    <article class="panel">
      <p class="eyebrow">Ingestion Schema</p>
      <h2>Required Metadata</h2>
      <div class="pill-list">
        {#each metadataFields as field}
          <span>{field}</span>
        {/each}
      </div>
    </article>

    <article class="panel">
      <p class="eyebrow">Review Gate</p>
      <h2>Validation Rules</h2>
      <div class="issue-list">
        {#each validationGates as gate}
          <article>
            <h3>{gate.label}</h3>
            <p>{gate.detail}</p>
          </article>
        {/each}
      </div>
    </article>
  </section>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Live Convex Checklist</p>
        <h2>Source Plan</h2>
      </div>
      <p>
        Rank binding and authoritative materials above explanatory data. Fine-tuning
        examples should be citation-grounded and attorney-reviewed.
      </p>
    </div>

    {#if message}
      <p class="notice">{message}</p>
    {/if}

    <form class="composer" on:submit|preventDefault={addSource}>
      <input bind:value={title} placeholder="New source title" aria-label="Source title" />
      <select bind:value={authorityLayer} aria-label="Authority layer">
        {#each authorityLayers as layer}
          <option value={layer}>{layerLabel(layer)}</option>
        {/each}
      </select>
      <select bind:value={useCase} aria-label="Use case">
        {#each useCases as nextUseCase}
          <option value={nextUseCase}>{useCaseLabel(nextUseCase)}</option>
        {/each}
      </select>
      <input
        bind:value={authorityRank}
        type="number"
        min="1"
        max="100"
        aria-label="Authority rank"
      />
      <input bind:value={sourceUrl} placeholder="Source URL" aria-label="Source URL" />
      <textarea bind:value={note} placeholder="Collection notes" aria-label="Source notes"></textarea>
      <button disabled={busy || !convexConfigured} type="submit">
        {busy ? "Adding..." : "Add Source"}
      </button>
    </form>

    <div class="sources">
      {#each $corpusSources as source}
        <article class="source-card">
          <div>
            <p class="meta">
              #{source.authorityRank} / {layerLabel(source.authorityLayer)} / {useCaseLabel(source.useCase)}
            </p>
            <h3>{source.title}</h3>
            <p>{source.note || "No notes yet."}</p>
            {#if source.sourceUrl}
              <a href={source.sourceUrl} target="_blank" rel="noreferrer">Open source</a>
            {/if}
          </div>

          <div class="status" aria-label={`Status for ${source.title}`}>
            {#each statuses as status}
              <button
                class:active={source.status === status}
                type="button"
                on:click={() => setStatus(source, status)}
              >
                {statusLabel(status)}
              </button>
            {/each}
          </div>
        </article>
      {:else}
        <p class="empty">No sources yet. Seed data appears when Convex is running.</p>
      {/each}
    </div>
  </section>
</main>
