import { describe, expect, it } from "vitest";
import { AngleUnion } from "../angleUnion";

describe("AngleUnion", () => {
    it("_findLeft finds the first interval that ends after a given angle", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion["intervals"] = [
            [-2, -1],
            [0, 1],
            [2, 3],
        ];
        expect(angleUnion._findLeft(-Math.PI)).toBe(0);
        expect(angleUnion._findLeft(-Math.PI / 2)).toBe(0);
        expect(angleUnion._findLeft(0)).toBe(1);
        expect(angleUnion._findLeft(Math.PI / 2)).toBe(2);
        expect(angleUnion._findLeft(Math.PI)).toBe(3);
    });

    it("_findRight finds the last interval that starts before a given angle", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion["intervals"] = [
            [-2, -1],
            [0, 1],
            [2, 3],
        ];
        expect(angleUnion._findRight(-Math.PI)).toBe(-1);
        expect(angleUnion._findRight(-Math.PI / 2)).toBe(0);
        expect(angleUnion._findRight(0)).toBe(1);
        expect(angleUnion._findRight(Math.PI / 2)).toBe(1);
        expect(angleUnion._findRight(Math.PI)).toBe(2);
    });

    it("_validateAngle throws for out-of-bounds angles", () => {
        const angleUnion = new AngleUnion(0.01);
        expect(() => angleUnion["_validateAngle"](Math.PI + 0.1)).toThrow();
        expect(() => angleUnion["_validateAngle"](-Math.PI - 0.1)).toThrow();
        expect(() => angleUnion["_validateAngle"](0)).not.toThrow();
        expect(() => angleUnion["_validateAngle"](Math.PI)).not.toThrow();
        expect(() => angleUnion["_validateAngle"](-Math.PI)).not.toThrow();
    });

    it("stores non-overlapping intervals", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(-1, 1);
        angleUnion.addInterval(2, 3);
        angleUnion.addInterval(-3, -2);
        expect(angleUnion.getIntervals()).toEqual([
            [-3.01, -1.99],
            [-1.01, 1.01],
            [1.99, 3.01],
        ]);
    });

    it("merges overlapping intervals", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(-1, 1);
        angleUnion.addInterval(0.5, 2);
        angleUnion.addInterval(-2, -0.5);
        expect(angleUnion.getIntervals()).toEqual([[-2.01, 2.01]]);
    });

    it("handles intervals that wrap around -π and π", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(Math.PI - 0.5, -Math.PI + 0.5);
        expect(angleUnion.getIntervals()).toEqual([
            [-Math.PI - 0.01, -Math.PI + 0.51],
            [Math.PI - 0.51, Math.PI + 0.01],
        ]);
    });

    it("does nothing when adding an interval that is fully covered", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(-1, 1);
        expect(angleUnion.getIntervals()).toEqual([[-1.01, 1.01]]);
        angleUnion.addInterval(-0.5, 0.5);
        expect(angleUnion.getIntervals()).toEqual([[-1.01, 1.01]]);
    });

    it("can merge multiple overlapping intervals at once", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(0, 0.1);
        angleUnion.addInterval(0.2, 0.3);
        angleUnion.addInterval(0.4, 0.5);
        expect(angleUnion.getIntervals()).toEqual([
            [-0.01, 0.11],
            [0.19, 0.31],
            [0.39, 0.51],
        ]);
        angleUnion.addInterval(0.05, 0.45);
        expect(angleUnion.getIntervals()).toEqual([[-0.01, 0.51]]);
    });

    it("finds contained intervals correctly", () => {
        const angleUnion = new AngleUnion(0.01);
        angleUnion.addInterval(-2, -1);
        angleUnion.addInterval(1, 2);
        expect(angleUnion.contains(-2, -1)).toBe(true);
        expect(angleUnion.contains(-2, -1.5)).toBe(true);
        expect(angleUnion.contains(-1, -0.5)).toBe(false);
        expect(angleUnion.contains(0.5, 1.5)).toBe(false);
        expect(angleUnion.contains(0.6, 1.4)).toBe(false);
        expect(angleUnion.contains(1.2, 1.7)).toBe(true);
        expect(angleUnion.contains(0.9, 2.1)).toBe(false);
    });
});
