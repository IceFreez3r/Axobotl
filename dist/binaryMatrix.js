"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryMatrix = void 0;
class BinaryMatrix {
    matrix;
    width;
    constructor(width, height) {
        this.matrix = 0n;
        this.width = width;
        // Height is actually ignored, hihi
    }
    set(x, y) {
        const shift = y * this.width + x;
        const mask = 1n << BigInt(shift);
        this.matrix = this.matrix | mask;
    }
    get(x, y) {
        const shift = y * this.width + x;
        return (this.matrix >> BigInt(shift)) & 1n;
    }
}
exports.BinaryMatrix = BinaryMatrix;
