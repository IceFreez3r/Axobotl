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
}
