export const MINIMUM_SKELETON_MS = 1000;

export function waitForMinimumLoading(startedAt, minimumMs = MINIMUM_SKELETON_MS) {
  const remaining = minimumMs - (Date.now() - startedAt);
  if (remaining <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, remaining));
}
