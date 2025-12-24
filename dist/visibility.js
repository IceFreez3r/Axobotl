"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterval = getInterval;
/**
 * @returns the angle intervals of the pair of corners that block the most vision
 */
function getInterval(dx, dy) {
    const corners = [
        [dx - 0.5, dy - 0.5], // top-left
        [dx + 0.5, dy - 0.5], // top-right
        [dx + 0.5, dy + 0.5], // bottom-right
        [dx - 0.5, dy + 0.5], // bottom-left
    ];
    const angles = corners.map(([cx, cy]) => Math.atan2(cy, cx)); // TODO: Cache atan2
    angles.sort((a, b) => a - b); // Sort ascending
    const wrapAround = angles[3] - angles[0] > Math.PI;
    return wrapAround ? [angles[2], angles[1]] : [angles[0], angles[3]];
}
