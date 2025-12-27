import { describe, expect, it, vi } from "vitest";
import { Atan2 } from "../visibility";

describe("Atan2 cache", () => {
    describe("getInterval", () => {
        const atan2 = new Atan2(2, 2);

        // ! REMINDER: Argument order of Math.atan2(y, x)
        it("should return the correct angle interval for [1, 0]", () => {
            const interval = atan2.getInterval(1, 0);
            expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, 0.5)); // bottom-left
            expect(interval[1]).toBeCloseTo(Math.atan2(0.5, 0.5)); // top-left
        });

        it("should return the correct angle interval for [0, 1]", () => {
            const interval = atan2.getInterval(0, 1);
            expect(interval[0]).toBeCloseTo(Math.atan2(0.5, 0.5)); // bottom-right
            expect(interval[1]).toBeCloseTo(Math.atan2(0.5, -0.5)); // bottom-left
        });

        it("should return the correct angle interval for [-1, 0] (wrap-around)", () => {
            const interval = atan2.getInterval(-1, 0);
            expect(interval[0]).toBeCloseTo(Math.atan2(0.5, -0.5)); // top-right
            expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, -0.5)); // bottom-right
        });

        it("should return the correct angle interval for [0, -1]", () => {
            const interval = atan2.getInterval(0, -1);
            expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, -0.5)); // top-left
            expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, 0.5)); // top-right
        });

        it("should return the correct angle interval for [1, 1]", () => {
            const interval = atan2.getInterval(1, 1);
            expect(interval[0]).toBeCloseTo(Math.atan2(0.5, 1.5)); // bottom-right
            expect(interval[1]).toBeCloseTo(Math.atan2(1.5, 0.5)); // top-left
        });

        it("should return the correct angle interval for [-1, 1]", () => {
            const interval = atan2.getInterval(-1, 1);
            expect(interval[0]).toBeCloseTo(Math.atan2(1.5, -0.5)); // top-right
            expect(interval[1]).toBeCloseTo(Math.atan2(0.5, -1.5)); // bottom-left
        });

        it("should return the correct angle interval for [-1, -1]", () => {
            const interval = atan2.getInterval(-1, -1);
            expect(interval[0]).toBeCloseTo(Math.atan2(-0.5, -1.5)); // top-left
            expect(interval[1]).toBeCloseTo(Math.atan2(-1.5, -0.5)); // bottom-right
        });

        it("should return the correct angle interval for [1, -1]", () => {
            const interval = atan2.getInterval(1, -1);
            expect(interval[0]).toBeCloseTo(Math.atan2(-1.5, 0.5)); // bottom-left
            expect(interval[1]).toBeCloseTo(Math.atan2(-0.5, 1.5)); // top-right
        });
    });

    [2, 3, 4].map((size) =>
        it(`should return consistent results for a ${size}x${size} grid`, () => {
            const atan2Spy = vi.spyOn(Math, "atan2");
            const atan2 = new Atan2(size, size);
            expect(atan2Spy).toHaveBeenCalledTimes(2 * size * (2 * size));
            atan2Spy.mockClear();
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const corners = [
                        [dx - 0.5, dy - 0.5], // top-left
                        [dx + 0.5, dy - 0.5], // top-right
                        [dx + 0.5, dy + 0.5], // bottom-right
                        [dx - 0.5, dy + 0.5], // bottom-left
                    ];
                    const cached = atan2.getXY(dx, dy);
                    corners.forEach(([x, y], index) => {
                        const expected = Math.atan2(y, x);
                        const actual = cached[index];
                        expect(actual).toBeCloseTo(expected);
                    });
                }
            }
            // only the test calls, others should be cached
            expect(atan2Spy).toHaveBeenCalledTimes(4 * 3 * 3);
            atan2Spy.mockReset();
        })
    );
});
