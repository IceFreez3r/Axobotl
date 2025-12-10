#!/usr/bin/env node

const readline = require("readline");
const fs = require("fs");

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

type TCoordinate = [number, number];
type TCoordinateString = `${number},${number}`;
interface IBrain {
    width: number;
    height: number;
    tick: number;
    walls: Set<TCoordinateString>;
    floors: Set<TCoordinateString>;
    /** key = coordinates, value = death tick */
    gems: Record<TCoordinateString, number>;
}
interface IData {
    config: {
        width: number;
        height: number;
    };
    wall: TCoordinate[];
    floor: TCoordinate[];
    bot: TCoordinate;
    visible_gems: { position: TCoordinate; ttl: number }[];
    initiative: boolean;
    tick: number;
}
type TDistanceArray = number[][];

// #region Config
const brain: IBrain = {
    width: 0,
    height: 0,
    tick: 0,
    walls: new Set(),
    floors: new Set(),
    gems: {},
};
// #endregion

// #region Functions
function initializeBrain(data: IData) {
    const {
        config: { width, height },
    } = data;

    brain.width = width;
    brain.height = height;
}

function updateBrain(data: IData) {
    const { wall, floor, visible_gems, tick } = data;

    brain.tick = tick;
    wall.forEach(([x, y]) => brain.walls.add(`${x},${y}`));
    const visibleFloors = new Set<TCoordinateString>();
    floor.forEach(([x, y]) => {
        const pos: TCoordinateString = `${x},${y}`;
        visibleFloors.add(pos);
        brain.floors.add(pos);
    });

    const visibleGems: Set<TCoordinateString> = new Set();
    visible_gems.forEach((gem) => {
        const pos: TCoordinateString = `${gem.position[0]},${gem.position[1]}`;
        const deathTick = gem.ttl + tick;
        brain.gems[pos] = deathTick;
        visibleGems.add(pos);
    });
    // Remove expired gems
    (Object.entries(brain.gems) as [TCoordinateString, number][]).forEach(([pos, deathTick]) => {
        if (deathTick < tick) {
            delete brain.gems[pos];
        }
        // Remove memorized gems on visible floors without a visible gem -> someone picked it up
        if (!visibleGems.has(pos) && visibleFloors.has(pos)) {
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
            if (brain.walls.has(`${nx},${ny}`)) return; // wall
            if (nx >= brain.width || ny >= brain.height || nx < 0 || ny < 0) return; // out of bounds
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
    const data = JSON.parse(line);
    updateBrain(data);

    if (firstTick) {
        initializeBrain(data);
    }

    const distance = dijkstra(data);
    const nextGem = getNextGem(distance);
    let move;
    if (!nextGem) {
        const validMoves = getValidMoves(data, distance);
        move = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        move = backtracking(distance, nextGem);
    }
    console.log(move);

    firstTick = false;
    end = process.hrtime.bigint();
    console.error("Tick time: " + (end - start).toLocaleString() + "ns");
});
// #endregion
