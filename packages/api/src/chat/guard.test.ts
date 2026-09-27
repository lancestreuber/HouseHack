import { describe, expect, test } from "bun:test";

import { keepVerified, numbersIn, parseReply, spelledNumbers, unverifiedNumbers } from "./guard";

describe("parseReply", () => {
  test("strips markdown emphasis, headings and code so no symbols reach the UI", () => {
    const blocks = parseReply("## Summary\n**Duplex** fits well here and *transit* is close. `note` [air]", ["air"]);
    expect(blocks).toEqual([
      { type: "paragraph", text: "Summary", fact_ids: [] },
      { type: "paragraph", text: "Duplex fits well here and transit is close. note", fact_ids: ["air"] },
    ]);
  });

  test("turns list lines into bullets and keeps their citations", () => {
    const blocks = parseReply("Two things stand out:\n- Bus stop is 180 m away [transit]\n* Lot is flat [slope, lot]\n1. Park nearby [parks]", [
      "transit",
      "slope",
      "lot",
      "parks",
    ]);
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "bullet", "bullet", "bullet"]);
    expect(blocks[1]).toEqual({ type: "bullet", text: "Bus stop is 180 m away", fact_ids: ["transit"] });
    expect(blocks[2]?.fact_ids).toEqual(["slope", "lot"]);
    expect(blocks[3]?.text).toBe("Park nearby");
  });

  test("drops citations to facts that do not exist", () => {
    const blocks = parseReply("Schools are close [schools, crime]", ["schools"]);
    expect(blocks[0]?.fact_ids).toEqual(["schools"]);
    expect(blocks[0]?.text).toBe("Schools are close");
  });

  test("removes a comma stranded before the full stop by a citation", () => {
    const blocks = parseReply("Not permitted in this district, [alert.duplex].", ["alert.duplex"]);
    expect(blocks[0]?.text).toBe("Not permitted in this district.");
  });

  test("treats each line as its own paragraph", () => {
    const blocks = parseReply("First thought.\nSecond thought.\n\nThird.", []);
    expect(blocks.map((b) => b.text)).toEqual(["First thought.", "Second thought.", "Third."]);
  });

  test("does not treat a negative number or a hyphenated word as a bullet", () => {
    const blocks = parseReply("-5 is not a bullet\nwell-known fact", []);
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "paragraph"]);
  });
});

describe("numbersIn", () => {
  test("normalizes commas, currency and percents", () => {
    expect(numbersIn("Rent is $1,299 and 40% of lots; 412 m; 0.5 mi")).toEqual(["1299", "40", "412", "0.5"]);
  });
});

describe("spelledNumbers", () => {
  test("finds quantities written in words, which can't be checked", () => {
    for (const text of ["Zero percent of the lot is in a floodplain.", "Thirty-six percent of the lot is steep.", "One hundred percent of the lot is over mines.", "Eighty-three point seven percent of renters are burdened.", "It is twenty feet wide."]) {
      expect(spelledNumbers(text)).toHaveLength(1);
    }
  });

  test("leaves ordinary words alone", () => {
    for (const text of ["A two-unit building fits.", "One house is allowed.", "It is one of the five pillars.", "Zero hazards are mapped here."]) {
      expect(spelledNumbers(text)).toEqual([]);
    }
  });

  test("counts them as unverified, even when the value is right", () => {
    expect(unverifiedNumbers("Thirty-six percent of the lot is steep.", ["36"])).toEqual(["Thirty-six percent"]);
  });
});

describe("unverifiedNumbers", () => {
  const allowed = ["412", "72", "2025", "1545", "0.81"];

  test("passes numbers that appear in the facts", () => {
    expect(unverifiedNumbers("The stop is 412 m away and fit is 72.", allowed)).toEqual([]);
  });

  test("flags a number the facts never state", () => {
    expect(unverifiedNumbers("Fit is 85 out of 100.", allowed)).toEqual(["85", "100"]);
  });

  test("allows small counting numbers", () => {
    expect(unverifiedNumbers("There are 3 reasons and 2 options.", allowed)).toEqual([]);
  });

  test("treats 0.81 and 81% as the same confidence", () => {
    expect(unverifiedNumbers("Jev is 81% confident.", allowed)).toEqual([]);
  });
});

describe("keepVerified", () => {
  test("drops only the sentence with an unverified number", () => {
    const block = { type: "paragraph" as const, text: "Transit is 180 m away. Rent would be $1,450. Parks are close.", fact_ids: [] };
    expect(keepVerified(block, ["180"])?.text).toBe("Transit is 180 m away. Parks are close.");
  });

  test("returns null when no sentence survives", () => {
    expect(keepVerified({ type: "bullet", text: "Costs $900,000.", fact_ids: [] }, [])).toBeNull();
  });
});
