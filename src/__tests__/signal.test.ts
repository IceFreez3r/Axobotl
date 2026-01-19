import { describe, expect, it } from "vitest";
import { distanceFromSignalStrength } from "../signal";

describe("signal", () => {
    [0, 5, 10, 1.2345].map((distance) => {
        it(`gives the correct distance ${distance} from signal strength `, () => {
            const signalRadius = 10;
            let signalStrength = 1 / (1 + (distance * distance) / (signalRadius * signalRadius));
            expect(distanceFromSignalStrength(signalRadius, signalStrength)).toBeCloseTo(distance);
        });
    });
});
