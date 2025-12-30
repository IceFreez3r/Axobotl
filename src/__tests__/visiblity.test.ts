import { describe, expect, it, vi } from "vitest";
import { Atan2, visibleFloors } from "../visibility";
import { BinaryMatrix } from "../binaryMatrix";

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

    [2, 3, 4].forEach((size) =>
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

describe("visibleFloors", () => {
    const atan2 = new Atan2(5, 5);
    const config = {
        vis_radius: 3,
        width: 5,
        height: 5,
    } as any;

    [
        /**
         * #####
         * #...#
         * #.x.#
         * #...#
         * #####
         */
        {
            name: "empty box, bot in center",
            walls: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [4, 1],
                [4, 2],
                [4, 3],
                [4, 4],
                [1, 4],
                [2, 4],
                [3, 4],
            ],
            bot: [2, 2],
            visible: [
                [1, 1],
                [2, 1],
                [3, 1],
                [1, 2],
                [2, 2],
                [3, 2],
                [1, 3],
                [2, 3],
                [3, 3],
            ],
        },
        /**
         * #####
         * #x..#
         * #.#.#
         * #...#
         * #####
         */
        {
            name: "box with center wall, bot in corner",
            walls: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [4, 1],
                [4, 2],
                [4, 3],
                [4, 4],
                [1, 4],
                [2, 4],
                [3, 4],
                [2, 2],
            ],
            bot: [1, 1],
            visible: [
                [1, 1],
                [2, 1],
                [3, 1],
                [1, 2],
                [3, 2],
                [1, 3],
                [2, 3],
            ],
        },
        /**
         * #####
         * #...#
         * #x#.#
         * #...#
         * #####
         */
        {
            name: "box with center wall, bot next to wall",
            walls: [
                [0, 0],
                [1, 0],
                [2, 0],
                [3, 0],
                [4, 0],
                [0, 1],
                [0, 2],
                [0, 3],
                [0, 4],
                [4, 1],
                [4, 2],
                [4, 3],
                [4, 4],
                [1, 4],
                [2, 4],
                [3, 4],
                [2, 2],
            ],
            bot: [1, 2],
            visible: [
                [1, 1],
                [2, 1],
                [1, 2],
                [1, 3],
                [2, 3],
            ],
        },
    ].forEach(({ name, walls, bot, visible }) => {
        it(`should mark correct floors for ${name}`, () => {
            const wallMatrix = new BinaryMatrix(5, 5);
            walls.forEach(([x, y]) => wallMatrix.set(x, y));
            const floorMatrix: number[] = new Array(5 * 5);
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    if (wallMatrix.get(x, y) === 0n) {
                        floorMatrix[y * 5 + x] = 1;
                    }
                }
            }

            const vis = visibleFloors(atan2, bot[0], bot[1], config, wallMatrix, floorMatrix);

            expect(Array.from(vis.iterate())).toHaveLength(visible.length);
            expect(Array.from(vis.iterate())).toEqual(visible);
        });
    });
});
