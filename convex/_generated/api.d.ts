/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as autoFetch from "../autoFetch.js";
import type * as eval from "../eval.js";
import type * as evalData from "../evalData.js";
import type * as fetchSources from "../fetchSources.js";
import type * as finetune from "../finetune.js";
import type * as finetuneData from "../finetuneData.js";
import type * as ingest from "../ingest.js";
import type * as lib_chunk from "../lib/chunk.js";
import type * as lib_html from "../lib/html.js";
import type * as lib_openai from "../lib/openai.js";
import type * as planner from "../planner.js";
import type * as rag from "../rag.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  autoFetch: typeof autoFetch;
  eval: typeof eval;
  evalData: typeof evalData;
  fetchSources: typeof fetchSources;
  finetune: typeof finetune;
  finetuneData: typeof finetuneData;
  ingest: typeof ingest;
  "lib/chunk": typeof lib_chunk;
  "lib/html": typeof lib_html;
  "lib/openai": typeof lib_openai;
  planner: typeof planner;
  rag: typeof rag;
  seed: typeof seed;
  seedData: typeof seedData;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
