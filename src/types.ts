import { BinaryMatrix } from "./binaryMatrix";
import { Atan2, Visibility } from "./visibility";

export type TMove = "E" | "W" | "S" | "N";
export type TCoordinate = [number, number];
export type TCoordinateString = `${number},${number}`;
export interface IConfig {
    stage_key: string;
    width: number;
    height: number;
    generator: "arena" | "cellular";
    max_ticks: number;
    emit_signals: boolean;
    vis_radius: number;
    max_gems: number;
    gem_spawn_rate: number;
    gem_ttl: number;
    signal_radius: number;
    signal_cutoff: number;
    signal_noise: number;
    signal_quantization: number;
    signal_fade: number;
    enable_debug: boolean;
    timeout_scale: number;
    bot_seed: number;
}
export interface IBrain {
    config: IConfig;
    tick: number;
    walls: BinaryMatrix;
    /** Sparse array with last seen tick of each floor */
    floors: (number | undefined)[];
    /** key = coordinates, value = death tick */
    gems: Record<TCoordinateString, number>;
    atan2: Atan2;
    visibility: Visibility;
    highlight: [number, number, string][];
}
export interface IData {
    config: IConfig;
    wall: TCoordinate[];
    floor: TCoordinate[];
    bot: TCoordinate;
    signal_level: number;
    visible_gems: { position: TCoordinate; ttl: number }[];
    initiative: boolean;
    tick: number;
}
export type TDistanceArray = number[][];
