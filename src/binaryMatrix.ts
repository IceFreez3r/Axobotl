export class BinaryMatrix {
    matrix: bigint;
    width: number;

    constructor(width: number, height: number) {
        this.matrix = 0n;
        this.width = width;
        // Height is actually ignored, hihi
    }

    set(x: number, y: number): void {
        const shift = y * this.width + x;
        const mask = 1n << BigInt(shift);
        this.matrix = this.matrix | mask;
    }

    get(x: number, y: number): bigint {
        const shift = y * this.width + x;
        return (this.matrix >> BigInt(shift)) & 1n;
    }

    // https://graphics.stanford.edu/%7Eseander/bithacks.html#CountBitsSetKernighan
    count(): number {
        let count;
        let m = this.matrix;
        for (count = 0; m; count++) {
            m &= m - 1n;
        }
        return count;
    }

    *iterate(): Generator<[number, number]> {
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
