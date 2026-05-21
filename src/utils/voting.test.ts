import { describe, expect, it } from "vitest";

import { getUserVoteForCategory } from "./voting";

describe("voting helpers", () => {
  it("reads user votes by display category", () => {
    expect(
      getUserVoteForCategory(
        {
          id: 1,
          title: "Berserk",
          genre: "Dark Fantasy",
          type: "MANGA",
          vote_scores: { Story: 10 },
        },
        "Story",
      ),
    ).toBe(10);
  });

  it("reads user votes by backend normalized category key", () => {
    expect(
      getUserVoteForCategory(
        {
          id: 1,
          title: "Berserk",
          genre: "Dark Fantasy",
          type: "MANGA",
          vote_scores: { drama_or_fight: 9 },
        },
        "Drama / Fighting",
      ),
    ).toBe(9);
  });

  it("returns null for an unvoted category", () => {
    expect(
      getUserVoteForCategory(
        {
          id: 1,
          title: "Berserk",
          genre: "Dark Fantasy",
          type: "MANGA",
          vote_scores: { Art: 8 },
        },
        "Characters",
      ),
    ).toBeNull();
  });
});
