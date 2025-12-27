#!/usr/bin/env node

import { BinaryMatrix } from "./binaryMatrix";
import readline from "readline";
import { IBrain, IData, TCoordinate, TCoordinateString, TDistanceArray } from "./types";
import { Atan2, visibleFloors } from "./visibility";
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

const moves = ["E", "W", "S", "N"];
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
    gems: {},
    atan2: {} as any,
};
// #endregion

// #region Functions
function initializeBrain(data: IData) {
    brain.config = data.config;
    brain.walls = new BinaryMatrix(brain.config.width, brain.config.height);
    brain.floors = new BinaryMatrix(brain.config.width, brain.config.height);
    brain.atan2 = new Atan2(brain.config.width, brain.config.height);
}

function updateBrain(data: IData) {
    const { wall, floor, visible_gems, tick } = data;

    brain.tick = tick;
    wall.forEach(([x, y]) => brain.walls.set(x, y));
    const visibleFloors = new BinaryMatrix(brain.config.width, brain.config.height);
    floor.forEach(([x, y]) => {
        visibleFloors.set(x, y);
        brain.floors.set(x, y);
    });

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

function dijkstra(data: IData) {
    const { bot } = data;
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

function backtracking(distance: TDistanceArray, position: TCoordinate) {
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
    console.error(["Target gem at", targetX, targetY, "distance", minDistance]);
    return [targetX, targetY];
}

function getValidMoves(data: IData, distance: TDistanceArray): string[] {
    return moves.filter((dir) => {
        let [x, y] = data.bot;
        if (dir === "E") x += 1;
        if (dir === "W") x -= 1;
        if (dir === "S") y += 1;
        if (dir === "N") y -= 1;
        const dist = distance[x]?.[y];
        return dist === 1;
    });
}
// #endregion

// #region Main loop
let start;
let end = 0n;
rl.on("line", (line: string) => {
    start = process.hrtime.bigint();
    console.error("Time since last tick: " + (start - end).toLocaleString() + "ns");
    const data = JSON.parse(line) as IData;

    if (firstTick) {
        initializeBrain(data);
    }
    updateBrain(data);

    const distance = dijkstra(data);
    const nextGem = getNextGem(distance);
    let move;
    if (!nextGem) {
        const validMoves = getValidMoves(data, distance);
        move = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        move = backtracking(distance, nextGem);
    }

    // Predict visibility after move
    const visPos: [number, number] = [...data.bot];
    if (move === "E") visPos[0] += 1;
    if (move === "W") visPos[0] -= 1;
    if (move === "S") visPos[1] += 1;
    if (move === "N") visPos[1] -= 1;
    const vis = visibleFloors(brain.atan2, ...visPos, brain.config, brain.walls, brain.floors);
    const highlight = [[...visPos, "#0000ff80"]];
    for (let [x, y] of vis.iterate()) {
        if (x === visPos[0] && y === visPos[1]) continue;
        highlight.push([x, y, "#00ff0030"]);
    }

    console.log(move + " " + JSON.stringify({ highlight }));

    firstTick = false;
    end = process.hrtime.bigint();
    console.error("Tick time: " + (end - start).toLocaleString() + "ns");
});
// #endregion
