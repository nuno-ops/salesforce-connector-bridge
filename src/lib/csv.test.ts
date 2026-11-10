import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "x\ny", 3, null]])).toBe('"a,b","say ""hi""","x\ny",3,\r\n');
  });

  it("neutralises formula injection", () => {
    expect(toCsv([["=HYPERLINK(1)", "+1", "-2", "@x"]])).toBe("'=HYPERLINK(1),'+1,'-2,'@x\r\n");
  });
});
