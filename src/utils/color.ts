import { inGamut, parse, oklch, oklab, formatHex, toGamut } from "culori";
// @ts-ignore
import { calcContrast } from "apcach";
import type { Config, ComputedSwatch } from "../store/colorStore";

export const C_FLOOR = 0.02;
export const L_MIN = 0.16;
export const L_MAX = 0.97;

export function computeC(l: number, cfg: Config): number {
  const lMain = cfg.steps[cfg.mainIdx]?.l ?? 0.5;
  const raw = cfg.cPeak - Math.abs(l - lMain) * cfg.cTaper;
  return Math.max(C_FLOOR, raw);
}

export function computeAPCA(fgOklch: string, bgOklch: string = "#ffffff"): number {
  try {
    // calcContrast returns a signed APCA Lc value; take absolute value for display
    const cr = calcContrast(fgOklch, bgOklch);
    return Math.round(Math.abs(cr));
  } catch {
    return 0;
  }
}

export function checkGamut(l: number, c: number, h: number) {
  const color = { mode: "oklch" as const, l, c, h };
  return {
    inSRGB: inGamut("rgb")(color),
    inP3: inGamut("p3")(color),
    inRec2020: inGamut("rec2020")(color),
  };
}

/**
 * Clamp a color to a specific gamut using the CSS Color 4 algorithm (perceptual chroma reduction)
 */
export function clampToGamut(
  l: number,
  c: number,
  h: number,
  gamut: "srgb" | "p3" | "rec2020",
): { l: number; c: number; h: number } {
  const color = { mode: "oklch" as const, l, c, h };
  const targetMode = gamut === "srgb" ? "rgb" : gamut;
  const clamped = toGamut(targetMode, "oklch")(color);
  const result = oklch(clamped);
  return {
    l: result.l ?? l,
    c: result.c ?? 0,
    h: result.h ?? h,
  };
}

export function autoDistributeL(n: number, presetValues?: number[]): number[] {
  if (presetValues && presetValues.length > 0) {
    // Interpolate from preset curve
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      const exactIdx = t * (presetValues.length - 1);
      const low = Math.floor(exactIdx);
      const high = Math.ceil(exactIdx);
      if (low === high) return +presetValues[low].toFixed(3);

      const weight = exactIdx - low;
      const val = presetValues[low] * (1 - weight) + presetValues[high] * weight;
      return +val.toFixed(3);
    });
  }

  // Default Gamma dist (Perceptual-like)
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const tCurved = Math.pow(t, 0.8);
    return +(L_MAX - tCurved * (L_MAX - L_MIN)).toFixed(3);
  });
}

export function hexToH(hex: string): number | null {
  let normalized = hex.trim();
  if (normalized && !normalized.startsWith("#") && /^[0-9a-fA-F]{3,6}$/.test(normalized)) {
    normalized = "#" + normalized;
  }
  const parsed = parse(normalized);
  if (!parsed) return null;
  const color = oklch(parsed);
  return color?.h != null ? Math.round(color.h) : null;
}

export function hToHex(h: number, l: number = 0.6, c: number = 0.2): string {
  return formatHex({ mode: "oklch", l, c, h });
}

export function detectHueShift(
  swatches: ComputedSwatch[],
): { label: string; perceivedH: number; deltaH: number }[] {
  return swatches.map((s) => {
    const color = { mode: "oklch" as const, l: s.l, c: s.c, h: s.h };
    const lab = oklab(color);
    const perceivedH = ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
    const deltaH = perceivedH - s.h;
    const normalizedDelta = ((deltaH + 180) % 360) - 180;
    return {
      label: s.label,
      perceivedH: Math.round(perceivedH),
      deltaH: Math.round(normalizedDelta),
    };
  });
}
