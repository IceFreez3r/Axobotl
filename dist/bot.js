#!/usr/bin/env node
"use strict";
const readline = require("readline");
const fs = require("fs");
const debugLog = fs.createWriteStream("debug.log", { flags: "w", flush: true });
function debug(msg) {
    debugLog.write(msg + "\n");
}
function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
const rng = mulberry32(1);
Math.random = rng; // Because I will forget otherwise
const moves = ["E", "W", "S", "N"];
let firstTick = true;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
// #region Config
const brain = {
    walls: new Set(),
    width: 0,
    height: 0,
};
// #endregion
// #region Functions
function initializeBrain(data) {
    const { config: { width, height }, } = data;
    brain.width = width;
    brain.height = height;
}
function updateBrain(data) {
    const { wall } = data;
    wall.forEach(([x, y]) => brain.walls.add(x.toString() + "," + y.toString()));
}
function dijkstra(data) {
    const { bot } = data;
    const [botX, botY] = bot;
    const distance = [];
    distance[botX] = [];
    distance[botX][botY] = 0;
    const queue = [bot];
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        debug(JSON.stringify({ x, y, queue: queue.length }));
        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ];
        neighbors.forEach(([nx, ny]) => {
            var _a, _b;
            if (((_a = distance[nx]) === null || _a === void 0 ? void 0 : _a[ny]) !== undefined)
                return; // already visited
            if (brain.walls.has(nx.toString() + "," + ny.toString()))
                return; // wall
            if (nx >= brain.width || ny >= brain.height || nx < 0 || ny < 0)
                return; // out of bounds
            (_b = distance[nx]) !== null && _b !== void 0 ? _b : (distance[nx] = []);
            distance[nx][ny] = distance[x][y] + 1;
            queue.push([nx, ny]);
        });
    }
    debug("End Dijkstra: " + JSON.stringify(distance));
    return distance;
}
function backtracking(distance, position) {
    let [x, y] = position;
    while (true) {
        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ];
        const neighborDistances = neighbors.map(([tx, ty]) => { var _a, _b; return (_b = (_a = distance[tx]) === null || _a === void 0 ? void 0 : _a[ty]) !== null && _b !== void 0 ? _b : Infinity; });
        const minDistance = Math.min(...neighborDistances);
        const minNeighborIndex = neighborDistances.indexOf(minDistance);
        if (distance[x][y] === 1) {
            return moves[minNeighborIndex];
        }
        [x, y] = neighbors[minNeighborIndex];
    }
}
function getNextGem(data, distance) {
    const { visible_gems } = data;
    const gemDistances = visible_gems.map((gem) => {
        var _a;
        const dist = ((_a = distance[gem.position[0]]) === null || _a === void 0 ? void 0 : _a[gem.position[1]]) || Infinity;
        // Ignore gems that are too far away to reach in time
        return dist <= gem.ttl ? dist : Infinity;
    });
    const minDistance = Math.min(...gemDistances);
    const targetGemIndex = gemDistances.indexOf(minDistance);
    return visible_gems[targetGemIndex];
}
// #endregion
// #region Main loop
let start;
let end = Date.now();
rl.on("line", (line) => {
    start = Date.now();
    console.error("Time since last tick: " + (start - end) + "ms");
    const data = JSON.parse(line);
    updateBrain(data);
    if (firstTick) {
        initializeBrain(data);
    }
    const distance = dijkstra(data);
    const nextGem = getNextGem(data, distance);
    let move;
    if (!nextGem) {
        move = moves[Math.floor(Math.random() * moves.length)];
    }
    else {
        move = backtracking(distance, nextGem.position);
    }
    console.log(move);
    firstTick = false;
    end = Date.now();
    console.error("Tick time: " + (end - start) + "ms");
});
// #endregion
