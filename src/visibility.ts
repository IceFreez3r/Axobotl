import { AngleUnion } from "./angleUnion";
import { BinaryMatrix } from "./binaryMatrix";
import { IConfig } from "./types";

export function visibleFloors(
    atan2: Atan2,
    x: number,
    y: number,
    config: IConfig,
    walls: BinaryMatrix,
    floors: (number | undefined)[]
): BinaryMatrix {
    const r2 = config.vis_radius * config.vis_radius;

    const minDX = Math.max(-x, -config.vis_radius);
    const maxDX = Math.min(config.width - 1 - x, config.vis_radius);
    const minDY = Math.max(-y, -config.vis_radius);
    const maxDY = Math.min(config.height - 1 - y, config.vis_radius);

    const cells = [];
    for (let dy = minDY; dy <= maxDY; dy++) {
        for (let dx = minDX; dx <= maxDX; dx++) {
            if (dx === 0 && dy === 0) continue;
            const dist2 = dx * dx + dy * dy;
            if (dist2 > r2) continue;
            cells.push([dx, dy, dist2]);
        }
    }
    cells.sort((a, b) => a[2] - b[2]); // sort by distance squared

    const vis = new BinaryMatrix(config.width, config.height);
    vis.set(x, y);

    const blocked = new AngleUnion(1e-12);
    let pending: [number, number][] = [];

    let dist = -1;
    for (const [dx, dy, dist2] of cells) {
        // When starting with a new distance ring, add all pending blocked intervals
        if (dist2 > dist) {
            pending.forEach(([pa, pb]) => blocked.addInterval(pa, pb));
            pending = [];
            dist = dist2;
        }

        const rx = x + dx;
        const ry = y + dy;

        const [a, b] = atan2.getInterval(dx, dy);
        if (blocked.contains(a, b)) continue; // Cell is fully blocked
        // Non-walls (including undiscovered floors) are visible
        if (!walls.get(rx, ry)) vis.set(rx, ry);

        // Treat walls and undiscovered floors as blocking
        if (!floors[ry * config.width + rx] !== undefined) pending.push([a, b]);
    }

    return vis;
}

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
