"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distanceFromSignalStrength = distanceFromSignalStrength;
exports.ignoreFloorsBySignal = ignoreFloorsBySignal;
/**
 * Calculates the minimum distance to the closest gem.
 * Will underestimate the distance to the closest gem, when there is more than one.
 */
function distanceFromSignalStrength(signalRadius, signalStrength) {
    if (signalStrength <= 0 || signalStrength >= 1)
        return 0;
    return signalRadius * Math.sqrt((1 - signalStrength) / signalStrength);
}
/**
 * Marks all floors within the distance indicated by the signal strength as seen this tick.
 */
function ignoreFloorsBySignal(brain, data) {
    const distance = distanceFromSignalStrength(brain.config.signal_radius, data.signal_level);
    if (distance === 0)
        return;
    // Remove small delta to make sure that the gem position itself isn't included
    const distanceSq = distance * distance - 0.1;
    const distanceCeil = Math.ceil(distance);
    const minDX = Math.max(-distanceCeil, -data.bot[0]);
    const maxDX = Math.min(brain.config.width - 1 - data.bot[0], distanceCeil);
    const minDY = Math.max(-distanceCeil, -data.bot[1]);
    const maxDY = Math.min(brain.config.height - 1 - data.bot[1], distanceCeil);
    for (let dy = minDY; dy <= maxDY; dy++) {
        for (let dx = minDX; dx <= maxDX; dx++) {
            const dist2 = dx * dx + dy * dy;
            if (dist2 >= distanceSq)
                continue;
            const rx = data.bot[0] + dx;
            const ry = data.bot[1] + dy;
            brain.lastChecked[ry * brain.config.width + rx] = data.tick;
            brain.highlight.push([rx, ry, "#00c8ffa2"]);
        }
    }
}
