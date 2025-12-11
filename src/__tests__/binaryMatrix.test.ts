import { BinaryMatrix } from "../binaryMatrix";
import { describe, expect, it } from "vitest";

describe("BinaryMatrix", () => {
    it("creates an matrix with all zeros", () => {
        const matrix = new BinaryMatrix(5, 5);
        expect(matrix.matrix).toEqual(0n);
    });
    it("can be set to 1 at a specific position", () => {
        const matrix = new BinaryMatrix(5, 5);
        matrix.set(2, 4);
        expect(matrix.get(2, 4)).toEqual(1n);
    });
    it("stays at 1 after multiple sets", () => {
        const matrix = new BinaryMatrix(5, 5);
        matrix.set(2, 4);
        matrix.set(2, 4);
        matrix.set(2, 4);
        expect(matrix.get(2, 4)).toEqual(1n);
    });
});
