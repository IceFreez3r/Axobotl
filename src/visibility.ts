export class Atan2 {
    cache: number[];
    width: number;
    effectiveWidth: number;
    height: number;
    effectiveHeight: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.effectiveWidth = 2 * width;
        this.effectiveHeight = 2 * height;
        this.cache = new Array(this.effectiveWidth * this.effectiveHeight);

        // Precompute all possible corners
        let index = 0;
        for (let cy = -height + 0.5; cy <= height - 0.5; cy++) {
            for (let cx = -width + 0.5; cx <= width - 0.5; cx++, index++) {
                this.cache[index] = Math.atan2(cy, cx);
            }
        }
    }

    getYX(dy: number, dx: number): [number, number, number, number] {
        const topLeftIndex = (dy + this.height - 1) * this.effectiveWidth + (dx + this.width - 1);
        const topRightIndex = topLeftIndex + 1;
        const bottomLeftIndex = topLeftIndex + this.effectiveWidth;
        const bottomRightIndex = bottomLeftIndex + 1;
        if (this.cache[topLeftIndex] === undefined) {
            this.cache[topLeftIndex] = Math.atan2(dy - 0.5, dx - 0.5);
        }
        if (this.cache[topRightIndex] === undefined) {
            this.cache[topRightIndex] = Math.atan2(dy - 0.5, dx + 0.5);
        }
        if (this.cache[bottomLeftIndex] === undefined) {
            this.cache[bottomLeftIndex] = Math.atan2(dy + 0.5, dx - 0.5);
        }
        if (this.cache[bottomRightIndex] === undefined) {
            this.cache[bottomRightIndex] = Math.atan2(dy + 0.5, dx + 0.5);
        }
        return [
            this.cache[topLeftIndex],
            this.cache[topRightIndex],
            this.cache[bottomRightIndex],
            this.cache[bottomLeftIndex],
        ];
    }

    getXY(dx: number, dy: number): [number, number, number, number] {
        return this.getYX(dy, dx);
    }

    /**
     * @returns the angle intervals of the pair of corners that block the most vision
     */
    getInterval(dx: number, dy: number): [number, number] {
        const angles = this.getYX(dy, dx);
        angles.sort((a, b) => a - b); // Sort ascending

        const wrapAround = angles[3] - angles[0] > Math.PI;
        return wrapAround ? [angles[2], angles[1]] : [angles[0], angles[3]];
    }
}
