import type { AuthorityLayer, SourceStatus, SourceUseCase } from "./convex";

export function layerLabel(layer: AuthorityLayer): string {
  switch (layer) {
    case "primaryLaw":
      return "Primary law";
    case "agencyGuidance":
      return "Agency guidance";
    case "enforcementData":
      return "Enforcement data";
    case "caseLaw":
      return "Case law";
    case "secondaryMaterial":
      return "Secondary material";
    case "evaluation":
      return "Evaluation";
  }
}

export function useCaseLabel(nextUseCase: SourceUseCase): string {
  switch (nextUseCase) {
    case "rag":
      return "RAG";
    case "fineTune":
      return "Fine-tune";
    case "evaluation":
      return "Eval";
    case "context":
      return "Context";
  }
}

export function statusLabel(status: SourceStatus): string {
  switch (status) {
    case "todo":
      return "To collect";
    case "collecting":
      return "Collecting";
    case "ready":
      return "Ready";
    case "reviewed":
      return "Reviewed";
  }
}
