import { describe, expect, it } from "vitest";
import { getInterval } from "../visibility";

describe("getInterval", () => {
    // ! REMINDER: Argument order of Math.atan2(y, x)
    it("should return the correct angle interval for [1, 0]", () => {
        const interval = getInterval(1, 0);
        expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, 0.5)); // bottom-left
        expect(interval[1]).toBeCloseTo(Math.atan2(0.5, 0.5)); // top-left
    });

    it("should return the correct angle interval for [0, 1]", () => {
        const interval = getInterval(0, 1);
        expect(interval[0]).toBeCloseTo(Math.atan2(0.5, 0.5)); // bottom-right
        expect(interval[1]).toBeCloseTo(Math.atan2(0.5, -0.5)); // bottom-left
    });

    it("should return the correct angle interval for [-1, 0] (wrap-around)", () => {
        const interval = getInterval(-1, 0);
        expect(interval[0]).toBeCloseTo(Math.atan2(0.5, -0.5)); // top-right
        expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, -0.5)); // bottom-right
    });

    it("should return the correct angle interval for [0, -1]", () => {
        const interval = getInterval(0, -1);
        expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, -0.5)); // top-left
        expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, 0.5)); // top-right
    });

    it("should return the correct angle interval for [1, 1]", () => {
        const interval = getInterval(1, 1);
        expect(interval[0]).toBeCloseTo(Math.atan2(0.5, 1.5)); // bottom-right
        expect(interval[1]).toBeCloseTo(Math.atan2(1.5, 0.5)); // top-left
    });

    it("should return the correct angle interval for [-1, 1]", () => {
        const interval = getInterval(-1, 1);
        expect(interval[0]).toBeCloseTo(Math.atan2(1.5, -0.5)); // top-right
        expect(interval[1]).toBeCloseTo(Math.atan2(0.5, -1.5)); // bottom-left
    });

    it("should return the correct angle interval for [-1, -1]", () => {
        const interval = getInterval(-1, -1);
        expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, -1.5)); // top-left
        expect(interval[1]).toBeCloseTo(Math.atan2(-1.5, -0.5)); // bottom-right
    });

    it("should return the correct angle interval for [1, -1]", () => {
        const interval = getInterval(1, -1);
        expect(interval[0]).toBeCloseTo(Math.atan2(-1.5, 0.5)); // bottom-left
        expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, 1.5)); // top-right
    });
});
