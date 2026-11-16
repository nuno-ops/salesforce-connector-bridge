import { describe, expect, it } from "vitest";
import { INDEXNOW_KEY, indexNowBody } from "./indexnow";

describe("indexNowBody", () => {
  it("points the key location at the submitted host", () => {
    const body = indexNowBody(["https://salesforcesaver.com/", "https://salesforcesaver.com/guides"]);
    expect(body.host).toBe("salesforcesaver.com");
    expect(body.keyLocation).toBe(`https://salesforcesaver.com/${INDEXNOW_KEY}.txt`);
    expect(body.urlList).toHaveLength(2);
  });
});
