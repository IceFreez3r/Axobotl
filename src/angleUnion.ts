export class AngleUnion {
    private intervals: [number, number][];
    private eps: number;

    constructor(eps: number) {
        this.intervals = [];
        this.eps = eps;
    }

    addInterval(a: number, b: number): void {
        this._validateAngle(a);
        this._validateAngle(b);
        if (b < a) {
            this.addInterval(a, Math.PI);
            this.addInterval(-Math.PI, b);
            return;
        }

        a -= this.eps;
        b += this.eps;
        // left = index of the first interval that ends after 'a'
        // right = index of the last interval that starts before 'b'
        const left = this._findLeft(a);
        const right = this._findRight(b);

        const newStart = Math.min(a, this.intervals[left]?.[0] ?? a);
        const newEnd = Math.max(b, this.intervals[right]?.[1] ?? b);

        this.intervals.splice(left, right - left + 1, [newStart, newEnd]);
    }

    /** Find the leftmost interval that ends after 'a', or intervals.length if none
     * See https://en.wikipedia.org/wiki/Binary_search#Procedure_for_finding_the_leftmost_element
     */
    _findLeft(a: number): number {
        let left = 0;
        let right = this.intervals.length;
        while (left < right) {
            const mid = left + Math.floor((right - left) / 2);
            if (this.intervals[mid][1] < a) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        return left;
    }

    /** Find the rightmost interval that starts before 'b', or -1 if none
     * https://en.wikipedia.org/wiki/Binary_search#Procedure_for_finding_the_rightmost_element
     */
    _findRight(b: number): number {
        let left = 0;
        let right = this.intervals.length;
        while (left < right) {
            const mid = left + Math.floor((right - left) / 2);
            if (this.intervals[mid][0] > b) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return right - 1;
    }

    _validateAngle(angle: number): void {
        if (angle < -Math.PI || angle > Math.PI) throw new Error("Angle out of range");
    }

    /**
     * Check if the union fully contains the interval [a, b]
     */
    contains(a: number, b: number): boolean {
        this._validateAngle(a);
        this._validateAngle(b);
        if (b < a) {
            return this.contains(a, Math.PI) && this.contains(-Math.PI, b);
        }

        const left = this._findLeft(a);
        if (left >= this.intervals.length) return false;
        const interval = this.intervals[left];
        return interval[0] < a && interval[1] > b;
    }

    getIntervals(): [number, number][] {
        return this.intervals;
    }
}
