import { describe, expect, it } from "vitest";
import { nudgeDue, renewalStage, rescanDue } from "./reminders";

const now = new Date("2026-10-19T08:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("nudgeDue", () => {
  it("only nudges sign-ups from 2 to 7 days ago", () => {
    expect(nudgeDue(daysAgo(1), now)).toBe(false);
    expect(nudgeDue(daysAgo(2), now)).toBe(true);
    expect(nudgeDue(daysAgo(6.9), now)).toBe(true);
    expect(nudgeDue(daysAgo(7), now)).toBe(false);
  });
});

describe("renewalStage", () => {
  it("sends one reminder about 90 days out and one 45 days out", () => {
    expect(renewalStage(120)).toBeNull();
    expect(renewalStage(90)).toBe(90);
    expect(renewalStage(46)).toBe(90);
    expect(renewalStage(45)).toBe(45);
    expect(renewalStage(1)).toBe(45);
    expect(renewalStage(0)).toBeNull();
  });
});

describe("rescanDue", () => {
  it("rescans a month after the last scan while the unlock lasts", () => {
    expect(rescanDue(daysAgo(31), daysAgo(-10), now)).toBe(true);
    expect(rescanDue(daysAgo(10), daysAgo(-10), now)).toBe(false);
    expect(rescanDue(null, daysAgo(-10), now)).toBe(true);
  });
  it("stops when the unlock has ended", () => {
    expect(rescanDue(daysAgo(40), daysAgo(1), now)).toBe(false);
    expect(rescanDue(daysAgo(40), null, now)).toBe(false);
  });
});
