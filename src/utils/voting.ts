import type { SeriesDetailData } from "../types/series";

export type VoteCategory =
  | "Story"
  | "Characters"
  | "World Building"
  | "Art"
  | "Drama / Fighting";

export const voteCategories: VoteCategory[] = [
  "Story",
  "Characters",
  "World Building",
  "Art",
  "Drama / Fighting",
];

export const voteCategoryDescriptions: Record<VoteCategory, string> = {
  Story: "Evaluate how engaging and well-paced the plot is.",
  Characters: "Rate the uniqueness, depth, and development of the characters.",
  "World Building": "Is the universe immersive, consistent, and imaginative?",
  Art: "Judge the quality of the artwork, paneling, and style.",
  "Drama / Fighting":
    "For drama: emotional depth. For action: excitement and choreography.",
};

const categoryKeyMap: Record<VoteCategory, string> = {
  Story: "story",
  Characters: "characters",
  "World Building": "worldbuilding",
  Art: "art",
  "Drama / Fighting": "drama_or_fight",
};

export function getUserVoteForCategory(
  detail: SeriesDetailData | undefined,
  category: VoteCategory,
) {
  const normalizedKey = categoryKeyMap[category];
  return detail?.vote_scores?.[category] ?? detail?.vote_scores?.[normalizedKey] ?? null;
}
