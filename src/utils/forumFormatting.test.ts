import { describe, expect, it } from "vitest";

import { plainTextMarkdown, previewMarkdown, unescapeMarkdown } from "./forumFormatting";

describe("unescapeMarkdown", () => {
  it("removes serializer backslash escapes from punctuation", () => {
    expect(unescapeMarkdown("2 \\* 3 and snake\\_case")).toBe("2 * 3 and snake_case");
    expect(unescapeMarkdown("\\[not a link\\] \\#tag \\> quote")).toBe(
      "[not a link] #tag > quote",
    );
  });

  it("unescapes literal backslashes", () => {
    expect(unescapeMarkdown("a \\\\ b")).toBe("a \\ b");
  });

  it("leaves normal text and non-escape backslashes alone", () => {
    expect(unescapeMarkdown("plain text")).toBe("plain text");
    expect(unescapeMarkdown("C:\\folder\\name")).toBe("C:\\folder\\name");
  });
});

describe("plainTextMarkdown with escapes", () => {
  it("does not leak backslashes into previews", () => {
    expect(plainTextMarkdown("Rated it 4\\.5 \\- solid")).toBe("Rated it 4.5 - solid");
  });

  it("still strips links and images", () => {
    expect(previewMarkdown("![img](https://x/y.png) [Solo](series:1)")).toBe("Solo");
  });

  it("collapses spoilers without leaking hidden content", () => {
    expect(
      plainTextMarkdown(
        "Before <details><summary>Spoiler</summary>\n\nthe hero dies\n\n</details> after",
      ),
    ).toBe("Before Spoiler after");
  });

  it("strips other html tags but keeps their text", () => {
    expect(plainTextMarkdown("x<sup>2</sup> is <strong>fine</strong>")).toBe(
      "x 2 is fine",
    );
  });
});
