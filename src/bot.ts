#!/usr/bin/env node

import { BinaryMatrix } from "./binaryMatrix";
import readline from "readline";
import { IBrain, IData, TCoordinate, TCoordinateString, TDistanceArray, TMove } from "./types";
import { Atan2, Visibility } from "./visibility";
import { ignoreFloorsBySignal } from "./signal";
// import fs from "fs";

// const debugLog = fs.createWriteStream("debug.log", { flags: "w", flush: true });
// function debug(msg: string) {
//     debugLog.write(msg + "\n");
// }

function mulberry32(seed: number) {
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

const moves: TMove[] = ["E", "W", "S", "N"];
let firstTick = true;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

// #region Config
const brain: IBrain = {
    config: {} as any,
    tick: 0,
    walls: new BinaryMatrix(0, 0),
    floors: new BinaryMatrix(0, 0),
    lastChecked: [],
    gems: {},
    atan2: {} as any,
    visibility: {} as any,
    highlight: [],
};
// #endregion

// #region Functions
function initializeBrain(data: IData) {
    brain.config = data.config;
    brain.walls = new BinaryMatrix(brain.config.width, brain.config.height);
    // Initialize outer walls
    for (let x = 0; x < brain.config.width; x++) {
        brain.walls.set(x, 0);
        brain.walls.set(x, brain.config.height - 1);
    }
    for (let y = 0; y < brain.config.height; y++) {
        brain.walls.set(0, y);
        brain.walls.set(brain.config.width - 1, y);
    }
    brain.floors = new BinaryMatrix(brain.config.width, brain.config.height);
    brain.lastChecked = new Array(brain.config.width * brain.config.height);
    brain.atan2 = new Atan2(brain.config.width, brain.config.height);
    brain.visibility = new Visibility(brain.atan2, brain.config);
}

function updateBrain(data: IData) {
    const { wall, floor, visible_gems, tick } = data;

    // Reset highlight every tick
    brain.highlight = [];

    brain.tick = tick;
    wall.forEach(([x, y]) => brain.walls.set(x, y));
    const visibleFloors = new BinaryMatrix(brain.config.width, brain.config.height);
    floor.forEach(([x, y]) => {
        visibleFloors.set(x, y);
        brain.floors.set(x, y);
        // Store last seen tick
        brain.lastChecked[y * brain.config.width + x] = tick;
    });

    ignoreFloorsBySignal(brain, data);

    const visibleGems = new BinaryMatrix(brain.config.width, brain.config.height);
    visible_gems.forEach((gem) => {
        const [x, y] = gem.position;
        const pos: TCoordinateString = `${x},${y}`;
        const deathTick = gem.ttl + tick;
        brain.gems[pos] = deathTick;
        visibleGems.set(x, y);
    });
    // Remove expired gems
    (Object.entries(brain.gems) as [TCoordinateString, number][]).forEach(([pos, deathTick]) => {
        if (deathTick < tick) {
            delete brain.gems[pos];
        }
        const [x, y] = pos.split(",").map(Number);
        // Remove memorized gems on visible floors without a visible gem -> someone picked it up
        if (!visibleGems.get(x, y) && visibleFloors.get(x, y)) {
            delete brain.gems[pos];
        }
    });
}

function dijkstra(bot: TCoordinate) {
    const [botX, botY] = bot;

    const distance: TDistanceArray = [];
    distance[botX] = [];
    distance[botX][botY] = 0;

    const queue = [bot];

    while (queue.length > 0) {
        const [x, y] = queue.shift() as TCoordinate;
        const neighbors = [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
        ];
        neighbors.forEach(([nx, ny]) => {
            if (distance[nx]?.[ny] !== undefined) return; // already visited
            if (brain.walls.get(nx, ny)) return; // wall
            if (nx >= brain.config.width || ny >= brain.config.height || nx < 0 || ny < 0) return; // out of bounds
            distance[nx] ??= [];
            distance[nx][ny] = distance[x][y] + 1;
            queue.push([nx, ny]);
        });
    }
    return distance;
}

function backtracking(distance: TDistanceArray, position: TCoordinate): TMove {
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

function getNextGem(distance: TDistanceArray): TCoordinate | null {
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
    return [targetX, targetY];
}

function getValidMoves(bot: TCoordinate, distance: TDistanceArray): TMove[] {
    return moves.filter((dir) => {
        let [x, y] = bot;
        if (dir === "E") x += 1;
        if (dir === "W") x -= 1;
        if (dir === "S") y += 1;
        if (dir === "N") y -= 1;
        const dist = distance[x]?.[y];
        return dist === 1;
    });
}

function lastSeenScore(x: number, y: number): number {
    if (brain.walls.get(x, y)) return 0;
    const lastSeen = brain.lastChecked[y * brain.config.width + x];
    if (lastSeen === undefined) return brain.config.max_ticks; // never seen -> max score
    return brain.tick - lastSeen;
}

function distanceScore(x: number, y: number, distance: TDistanceArray, maxDistance: number): number {
    const dist = distance[x][y];
    if (dist === undefined || !isFinite(dist)) return 0;
    return 1 - dist / maxDistance;
}

function totalScore(x: number, y: number, distance: TDistanceArray, maxDistance: number): number {
    const dist = distance[x][y];
    if (dist === undefined) return 0;
    const lsScore = lastSeenScore(x, y);
    const dScore = distanceScore(x, y, distance, maxDistance);
    const total = lsScore * dScore;
    brain.highlight.push([x, y, `#ffff00${percentToHex(lsScore / brain.config.max_ticks, 0.5)}`]);
    // brain.highlight.push([x, y, `#00ff00${percentToHex(total / brain.config.max_ticks)}`]);
    return total;
}

function getNextMove(bot: TCoordinate): TMove {
    const distance = dijkstra(bot);
    const nextGem = getNextGem(distance);
    let target: TCoordinate | null = null;
    if (nextGem) {
        target = nextGem;
    } else {
        // No gem available, explore
        // Calculate the score for each reachable position
        let bestScore = -1;
        let bestPos: TCoordinate | null = null;
        const maxDistance = distance.reduce((max, col) => {
            const colMax = Math.max(...col.filter((d) => d !== undefined && isFinite(d)));
            return Math.max(max, colMax);
        }, 0);
        for (let x = 0; x < brain.config.width; x++) {
            for (let y = 0; y < brain.config.height; y++) {
                if (brain.walls.get(x, y)) continue;
                const dist = distance[x]?.[y];
                if (dist === undefined) continue; // not reachable
                const score = totalScore(x, y, distance, maxDistance);
                if (score > bestScore) {
                    bestScore = score;
                    bestPos = [x, y];
                }
            }
        }
        if (bestPos) {
            target = bestPos;
        } else {
            console.error("🚨🚨 No reachable position found, staying put 🚨🚨");
            target = bot;
        }
    }
    brain.highlight.push([...target, "#ff000080"]);
    const move = backtracking(distance, target);
    return move;
}

function percentToHex(percent: number, max = 1): string {
    const clamped = Math.max(0, Math.min(1, percent));
    const intVal = Math.floor(clamped * 255 * max);
    const hex = intVal.toString(16).padStart(2, "0");
    return hex;
}
// #endregion

// #region Main loop
let start;
let end = 0n;
rl.on("line", (line: string) => {
    // start = process.hrtime.bigint();
    // console.error("Time since last tick: " + (start - end).toLocaleString() + "ns");
    const data = JSON.parse(line) as IData;

    if (firstTick) {
        initializeBrain(data);
        firstTick = false;
    }
    updateBrain(data);
    const move = getNextMove(data.bot);

    // Predict visibility after move
    const visPos: [number, number] = [...data.bot];
    if (move === "E") visPos[0] += 1;
    if (move === "W") visPos[0] -= 1;
    if (move === "S") visPos[1] += 1;
    if (move === "N") visPos[1] -= 1;
    // brain.highlight.push([...visPos, "#0000ff50"]);

    const vis = brain.visibility.visibleFloors(...visPos, brain.walls, brain.floors);
    for (let [x, y] of vis.iterate()) {
        if (x === visPos[0] && y === visPos[1]) continue;
        brain.highlight.push([x, y, "#ff000030"]);
    }

    console.log(move + " " + JSON.stringify({ highlight: brain.highlight }));

    // end = process.hrtime.bigint();
    // console.error("Tick time: " + (end - start).toLocaleString() + "ns");
});
// #endregion
