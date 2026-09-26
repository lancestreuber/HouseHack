import { describe, expect, test } from "bun:test";

import { clampRect } from "./floating";
import { chunkForSpeech } from "./speech";

describe("clampRect", () => {
  test("keeps a window dragged off-screen fully visible", () => {
    expect(clampRect({ x: 1500, y: -50, w: 400, h: 500 }, 1280, 800)).toEqual({ x: 872, y: 8, w: 400, h: 500 });
  });

  test("never shrinks below the minimum size or grows past the viewport", () => {
    expect(clampRect({ x: 0, y: 0, w: 100, h: 100 }, 1280, 800)).toMatchObject({ w: 340, h: 380 });
    expect(clampRect({ x: 0, y: 0, w: 5000, h: 5000 }, 1280, 800)).toMatchObject({ w: 1264, h: 784 });
  });

  test("fits small phone screens", () => {
    expect(clampRect({ x: 0, y: 0, w: 460, h: 640 }, 360, 600)).toEqual({ x: 8, y: 8, w: 344, h: 584 });
  });
});

describe("chunkForSpeech", () => {
  test("speaks the first sentence on its own so audio starts quickly", () => {
    const chunks = chunkForSpeech("A duplex fits. The bus is 180 m away. Parks are close. Schools too.");
    expect(chunks[0]).toBe("A duplex fits.");
    expect(chunks.slice(1).join(" ")).toBe("The bus is 180 m away. Parks are close. Schools too.");
  });

  test("keeps decimals intact", () => {
    expect(chunkForSpeech("Emissions are 14.2 tons a year.")).toEqual(["Emissions are 14.2 tons a year."]);
  });
});
