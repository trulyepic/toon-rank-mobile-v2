import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

// AsyncStorage keys (non-sensitive — store-review bookkeeping only).
const POSITIVE_EVENTS_KEY = "toonranks_review_positive_events_v1";
const LAST_PROMPT_AT_KEY = "toonranks_review_last_prompt_at_v1";
const PROMPT_COUNT_KEY = "toonranks_review_prompt_count_v1";

// Tuning knobs — keep the prompt rare and earned so it never feels intrusive.
// The OS rate-limits the native card too (iOS shows it at most ~3x/year), so
// these are an additional, more conservative gate on top of that.
const MIN_POSITIVE_EVENTS = 3; // require a few good moments before the first ask
const MIN_DAYS_BETWEEN_PROMPTS = 90; // never ask twice close together
const MAX_LIFETIME_PROMPTS = 3; // hard cap on how many times we ever ask
// Small delay so the card appears after the rating UI has settled, not mid-tap.
const PROMPT_DELAY_MS = 1200;

async function getNumber(key: string): Promise<number> {
  const raw = await AsyncStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Record a "happy moment" (e.g. the user just rated a series) and, if the
 * gating rules pass, ask the OS to show its native in-app review card.
 *
 * Always safe to call: it never throws and never blocks the calling flow.
 * The OS itself ultimately decides whether to actually display the prompt
 * (and may silently suppress it), so this is best-effort by design.
 */
export async function maybePromptForReview(): Promise<void> {
  try {
    // Count this positive event first, so progress accrues even when we skip.
    const events = (await getNumber(POSITIVE_EVENTS_KEY)) + 1;
    await AsyncStorage.setItem(POSITIVE_EVENTS_KEY, String(events));
    if (events < MIN_POSITIVE_EVENTS) return;

    const promptCount = await getNumber(PROMPT_COUNT_KEY);
    if (promptCount >= MAX_LIFETIME_PROMPTS) return;

    const lastPromptAt = await getNumber(LAST_PROMPT_AT_KEY);
    const daysSince = (Date.now() - lastPromptAt) / (1000 * 60 * 60 * 24);
    if (lastPromptAt > 0 && daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;

    // Is the native in-app review flow actually available on this build/device?
    // (Returns false in Expo Go, on simulators without a store, etc.)
    const [available, hasAction] = await Promise.all([
      StoreReview.isAvailableAsync(),
      StoreReview.hasAction(),
    ]);
    if (!available || !hasAction) return;

    // Record the ask up front: we can't observe whether the OS displayed the
    // card, so count the attempt to stay conservative and avoid re-asking.
    await AsyncStorage.multiSet([
      [PROMPT_COUNT_KEY, String(promptCount + 1)],
      [LAST_PROMPT_AT_KEY, String(Date.now())],
    ]);

    setTimeout(() => {
      void StoreReview.requestReview().catch(() => {
        // Ignore — review prompting must never affect the user.
      });
    }, PROMPT_DELAY_MS);
  } catch {
    // Never let review bookkeeping affect the calling flow.
  }
}
