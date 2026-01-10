#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const binaryMatrix_1 = require("./binaryMatrix");
const readline_1 = __importDefault(require("readline"));
const visibility_1 = require("./visibility");
// import fs from "fs";
// const debugLog = fs.createWriteStream("debug.log", { flags: "w", flush: true });
// function debug(msg: string) {
//     debugLog.write(msg + "\n");
// }
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
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
// #region Config
const brain = {
    config: {},
    tick: 0,
    walls: new binaryMatrix_1.BinaryMatrix(0, 0),
    floors: [],
    gems: {},
    atan2: {},
    highlight: [],
};
// #endregion
// #region Functions
function initializeBrain(data) {
    brain.config = data.config;
    brain.walls = new binaryMatrix_1.BinaryMatrix(brain.config.width, brain.config.height);
    brain.floors = new Array(brain.config.width * brain.config.height);
    brain.atan2 = new visibility_1.Atan2(brain.config.width, brain.config.height);
}
function updateBrain(data) {
    const { wall, floor, visible_gems, tick } = data;
    brain.tick = tick;
    wall.forEach(([x, y]) => brain.walls.set(x, y));
    const visibleFloors = new binaryMatrix_1.BinaryMatrix(brain.config.width, brain.config.height);
    floor.forEach(([x, y]) => {
        visibleFloors.set(x, y);
        // Store last seen tick
        brain.floors[y * brain.config.width + x] = tick;
    });
    const visibleGems = new binaryMatrix_1.BinaryMatrix(brain.config.width, brain.config.height);
    visible_gems.forEach((gem) => {
        const [x, y] = gem.position;
        const pos = `${x},${y}`;
        const deathTick = gem.ttl + tick;
        brain.gems[pos] = deathTick;
        visibleGems.set(x, y);
    });
    // Remove expired gems
    Object.entries(brain.gems).forEach(([pos, deathTick]) => {
        if (deathTick < tick) {
            delete brain.gems[pos];
        }
        const [x, y] = pos.split(",").map(Number);
        // Remove memorized gems on visible floors without a visible gem -> someone picked it up
        if (!visibleGems.get(x, y) && visibleFloors.get(x, y)) {
            delete brain.gems[pos];
        }
    });
    // Reset highlight every tick
    brain.highlight = [];
}
function dijkstra(bot) {
    const [botX, botY] = bot;
    const distance = [];
    distance[botX] = [];
    distance[botX][botY] = 0;
    const queue = [bot];
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ];
        neighbors.forEach(([nx, ny]) => {
            if (distance[nx]?.[ny] !== undefined)
                return; // already visited
            if (brain.walls.get(nx, ny))
                return; // wall
            if (nx >= brain.config.width || ny >= brain.config.height || nx < 0 || ny < 0)
                return; // out of bounds
            distance[nx] ??= [];
            distance[nx][ny] = distance[x][y] + 1;
            queue.push([nx, ny]);
        });
    }
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
        const neighborDistances = neighbors.map(([tx, ty]) => distance[tx]?.[ty] ?? Infinity);
        const minDistance = Math.min(...neighborDistances);
        const minNeighborIndex = neighborDistances.indexOf(minDistance);
        if (distance[x][y] === 1) {
            return moves[minNeighborIndex];
        }
        [x, y] = neighbors[minNeighborIndex];
    }
}
function getNextGem(distance) {
    const { gems } = brain;
    const gemDistances = Object.entries(gems).map(([pos, deathTick]) => {
        const [gemX, gemY] = pos.split(",").map(Number);
        const dist = distance[gemX]?.[gemY] || Infinity;
        // Ignore gems that are too far away to reach in time
        return dist <= deathTick - brain.tick ? dist : Infinity;
    });
    const minDistance = Math.min(...gemDistances);
    if (minDistance === Infinity) {
        return null;
    }
    const targetGemIndex = gemDistances.indexOf(minDistance);
    const targetGemPos = Object.keys(gems)[targetGemIndex];
    const [targetX, targetY] = targetGemPos.split(",").map(Number);
    brain.highlight.push([targetX, targetY, "#ff000080"]);
    return [targetX, targetY];
}
function getValidMoves(bot, distance) {
    return moves.filter((dir) => {
        let [x, y] = bot;
        if (dir === "E")
            x += 1;
        if (dir === "W")
            x -= 1;
        if (dir === "S")
            y += 1;
        if (dir === "N")
            y -= 1;
        const dist = distance[x]?.[y];
        return dist === 1;
    });
}
function lastSeenScore(x, y) {
    const lastSeen = brain.floors[y * brain.config.width + x];
    if (lastSeen === undefined)
        return 200; // never seen -> max score
    return brain.tick - lastSeen;
}
function distanceScore(x, y, distance, maxDistance) {
    const dist = distance[x][y];
    if (dist === undefined || !isFinite(dist))
        return 0;
    return 1 - dist / maxDistance;
}
function totalScore(x, y, distance, maxDistance) {
    const dist = distance[x][y];
    if (dist === undefined)
        return 0;
    const lsScore = lastSeenScore(x, y);
    const dScore = distanceScore(x, y, distance, maxDistance);
    const total = lsScore * dScore;
    // brain.highlight.push([x, y, `#ffff00${percentToHex(lsScore / brain.config.max_ticks)}`]);
    brain.highlight.push([x, y, `#00ff00${percentToHex(total / brain.config.max_ticks)}`]);
    return total;
}
function getNextMove(bot) {
    const distance = dijkstra(bot);
    const nextGem = getNextGem(distance);
    let target = null;
    if (nextGem) {
        target = nextGem;
    }
    else {
        // No gem available, explore
        // Calculate the score for each reachable position
        let bestScore = -1;
        let bestPos = null;
        const maxDistance = distance.reduce((max, col) => {
            const colMax = Math.max(...col.filter((d) => d !== undefined && isFinite(d)));
            return Math.max(max, colMax);
        }, 0);
        for (let x = 0; x < brain.config.width; x++) {
            for (let y = 0; y < brain.config.height; y++) {
                if (brain.walls.get(x, y))
                    continue;
                const dist = distance[x]?.[y];
                if (dist === undefined)
                    continue; // not reachable
                const score = totalScore(x, y, distance, maxDistance);
                if (score > bestScore) {
                    bestScore = score;
                    bestPos = [x, y];
                }
            }
        }
        if (bestPos) {
            target = bestPos;
            brain.highlight.push([...bestPos, "#ff000080"]);
        }
        else {
            console.error("🚨🚨 No reachable position found, staying put 🚨🚨");
            target = bot;
        }
    }
    const move = backtracking(distance, target);
    return move;
}
function percentToHex(percent) {
    const clamped = Math.max(0, Math.min(1, percent));
    const intVal = Math.floor(clamped * 255);
    const hex = intVal.toString(16).padStart(2, "0");
    return hex;
}
// #endregion
// #region Main loop
let start;
let end = 0n;
rl.on("line", (line) => {
    start = process.hrtime.bigint();
    console.error("Time since last tick: " + (start - end).toLocaleString() + "ns");
    const data = JSON.parse(line);
    if (firstTick) {
        initializeBrain(data);
    }
    updateBrain(data);
    const move = getNextMove(data.bot);
    // Predict visibility after move
    const visPos = [...data.bot];
    if (move === "E")
        visPos[0] += 1;
    if (move === "W")
        visPos[0] -= 1;
    if (move === "S")
        visPos[1] += 1;
    if (move === "N")
        visPos[1] -= 1;
    // brain.highlight.push([...visPos, "#0000ff50"]);
    // const vis = visibleFloors(brain.atan2, ...visPos, brain.config, brain.walls, brain.floors);
    // for (let [x, y] of vis.iterate()) {
    //     if (x === visPos[0] && y === visPos[1]) continue;
    //     highlight.push([x, y, "#00ff0030"]);
    // }
    console.log(move + " " + JSON.stringify({ highlight: brain.highlight }));
    firstTick = false;
    end = process.hrtime.bigint();
    console.error("Tick time: " + (end - start).toLocaleString() + "ns");
});
// #endregion
