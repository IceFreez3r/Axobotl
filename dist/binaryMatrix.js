"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryMatrix = void 0;
class BinaryMatrix {
    width;
    height;
    matrix = 0n;
    constructor(width, height) {
        this.width = width;
        this.height = height;
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
    display() {
        let display = "";
        let m = this.matrix;
        let col = 0;
        for (let i = 0n; m; i++, m >>= 1n, col = (col + 1) % this.width) {
            if (m & 1n)
                display += "#";
            else
                display += " ";
            if (col === this.width - 1)
                display += "\n";
        }
        return display;
    }
}
exports.BinaryMatrix = BinaryMatrix;
