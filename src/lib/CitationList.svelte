<script lang="ts">
  import type { Citation } from "./convex";
  import { layerLabel } from "./labels";

  export let citations: Citation[];
</script>

<ol class="citation-list">
  {#each citations as citation, index}
    <li class="citation-card">
      <span class="citation-index">[{index + 1}]</span>
      <div>
        <strong>{citation.title}</strong>
        <p class="citation-meta">
          {layerLabel(citation.authorityLayer)} / {citation.jurisdiction} / rank
          {citation.authorityRank} / relevance {citation.score.toFixed(3)}
        </p>
        {#if citation.citation}
          <p class="citation-cite">{citation.citation} — {citation.sectionPath}</p>
        {/if}
        {#if citation.url}
          <a href={citation.url} target="_blank" rel="noreferrer">Open source</a>
        {/if}
      </div>
    </li>
  {/each}
</ol>
