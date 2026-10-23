/**
 * @fileoverview Ambient type definitions for Culori 4.0.2 color library.
 *
 * @module src/types/culori
 */

declare module 'culori' {
    export interface Oklch {
        mode: 'oklch';
        l: number;
        c: number;
        h?: number;
        alpha?: number;
    }

    export function oklch(color: string | unknown): Oklch | undefined;
    export function interpolate(
        colors: readonly (string | Oklch)[],
        mode?: string
    ): (t: number) => Oklch;
    export function formatHex(color: Oklch | unknown): string | undefined;
}
