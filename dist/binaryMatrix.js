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
    // https://graphics.stanford.edu/%7Eseander/bithacks.html#CountBitsSetKernighan
    count() {
        let count;
        let m = this.matrix;
        for (count = 0; m; count++) {
            m &= m - 1n;
        }
        return count;
    }
    *iterate() {
        let m = this.matrix;
        for (let i = 0n; m; i++, m >>= 1n) {
            if (m & 1n) {
                const x = Number(i % BigInt(this.width));
                const y = Number(i / BigInt(this.width));
                yield [x, y];
            }
        }
    }
}
exports.BinaryMatrix = BinaryMatrix;
