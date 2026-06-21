export const SCORE_WEIGHTS = {
  authored: 2,
  published: 5,
  reviews: 3,
  events: 4,
  circulars: 1,
} as const;

export interface ContributionMetrics {
  authored: number;
  published: number;
  reviews: number;
  events: number;
  circulars: number;
}

export interface ContributorEntry {
  userId: string;
  name: string | null;
  nameHi: string | null;
  metrics: ContributionMetrics;
  score: number;
  level: string;
  levelHi: string;
}

export function computeScore(metrics: ContributionMetrics): number {
  return (
    metrics.published * SCORE_WEIGHTS.published +
    metrics.authored * SCORE_WEIGHTS.authored +
    metrics.reviews * SCORE_WEIGHTS.reviews +
    metrics.events * SCORE_WEIGHTS.events +
    metrics.circulars * SCORE_WEIGHTS.circulars
  );
}

export function getLevel(score: number): { level: string; levelHi: string } {
  if (score >= 70)
    return { level: "Pravah Ratna", levelHi: "प्रवाह रत्न" };
  if (score >= 30)
    return { level: "Vichaarak", levelHi: "विचारक" };
  if (score >= 10)
    return { level: "Sakriya", levelHi: "सक्रिय" };
  return { level: "Naya Yogi", levelHi: "नया योगी" };
}
