/**
 * The contract both API implementations must satisfy.
 *
 * `index.ts` picks between `remoteApi` and `mockApi` at runtime from a single
 * flag, so every call site is typed against whichever one it happened to be
 * written for. Nothing previously forced the two to agree — a method added to
 * one could go missing from the other and only surface as a runtime crash in
 * the mode nobody was testing.
 *
 * This file is types only. It compiles to nothing and cannot change behaviour;
 * its entire job is to fail the build when the two sides drift.
 *
 * The live implementation is the contract, not the demo one: `remoteApi` is
 * what production actually serves, so the demo is what must keep up.
 */
import type { mockApi } from "./mock";
import type { remoteApi } from "./remote";

/** Every method the app may call through `api`. */
export type NuvolaApi = typeof remoteApi;

/**
 * Compile-time proof that the demo implementation covers the live surface,
 * with compatible signatures. If a method is added to `remoteApi` and not to
 * `mockApi` — or its signature changes on one side — this assignment stops
 * type-checking and `npm run typecheck` fails.
 *
 * Extra methods on the demo side are allowed on purpose. `mockApi` carries a
 * `verifyTwoFactor` that `remoteApi` does not: the live 2FA path goes through
 * `twoFactor.ts` against a real endpoint, and that file currently reaches the
 * demo one with a double cast (`mockApi as unknown as {...}`, twoFactor.ts:62)
 * precisely because the method sits outside the shared surface. Reconciling
 * that is a behaviour change and belongs in its own slice, not here.
 */
type DemoCoversLive = typeof mockApi extends NuvolaApi ? true : never;
const demoCoversLive: DemoCoversLive = true;
void demoCoversLive;
