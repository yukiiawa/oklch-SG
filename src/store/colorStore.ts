import { defineStore } from "pinia";
import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { computeC, checkGamut, autoDistributeL, hToHex, computeAPCA, clampToGamut } from "../utils/color";

export interface Step {
  label: string;
  l: number;
  cOverride?: number;
  hOverride?: number;
}

export interface Config {
  h: number;
  steps: Step[];
  cPeak: number;
  cTaper: number;
  mainIdx: number;
  varPrefix: string;
  useDynamicHue: boolean;
  gamut: "none" | "srgb" | "p3" | "rec2020";
  originalColor?: string; // Raw hex or oklch input for reference
}

export interface ComputedSwatch {
  label: string;
  l: number;
  c: number;
  h: number;
  oklch: string;
  hex: string;
  inSRGB: boolean;
  inP3: boolean;
  inRec2020: boolean;
  apcaOnWhite: number; // swatch as fg text on white bg
  apcaOnBlack: number; // swatch as fg text on black bg
  apcaWhiteOnThis: number; // white text on swatch as bg
  apcaBlackOnThis: number; // black text on swatch as bg
}

const DEFAULT_STEPS: Step[] = [
  { label: "50", l: 0.96 },
  { label: "100", l: 0.84 },
  { label: "200", l: 0.75 },
  { label: "300", l: 0.66 },
  { label: "400", l: 0.58 },
  { label: "500", l: 0.5 },
  { label: "600", l: 0.43 },
  { label: "700", l: 0.36 },
  { label: "800", l: 0.29 },
  { label: "900", l: 0.22 },
  { label: "950", l: 0.14 },
];

export const LIGHTNESS_PRESETS = {
  perceptual: [0.96, 0.842, 0.746, 0.661, 0.581, 0.505, 0.432, 0.361, 0.292, 0.225, 0.14],
  highContrast: [0.96, 0.88, 0.78, 0.68, 0.58, 0.48, 0.38, 0.28, 0.18, 0.12, 0.08],
  soft: [0.96, 0.86, 0.78, 0.7, 0.62, 0.54, 0.46, 0.38, 0.3, 0.24, 0.2],
};

export const DEFAULT_CONFIG: Config = {
  h: 260,
  steps: JSON.parse(JSON.stringify(DEFAULT_STEPS)),
  cPeak: 0.2,
  cTaper: 0.45,
  mainIdx: 5, // index of '500'
  varPrefix: "color",
  useDynamicHue: false,
  gamut: "none",
};

export const useColorStore = defineStore("color", () => {
  const config = useLocalStorage<Config>(
    "oklch-sg-config",
    JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    { mergeDefaults: true },
  );

  // Hydrate from URL if present
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(q)));
        // Basic validation
        if (decoded && decoded.steps && typeof decoded.h === "number") {
          config.value = decoded;
        }
      } catch {
        console.warn("Failed to parse shared config from URL");
      }
    }
  }

  const computedSwatches = computed<ComputedSwatch[]>(() => {
    return config.value.steps.map((step) => {
      let cComp = computeC(step.l, config.value);
      let c = step.cOverride ?? cComp;
      let h = step.hOverride ?? config.value.h;
      let l = step.l;

      // Apply Gamut Mapping if enabled
      if (config.value.gamut !== "none") {
        const clamped = clampToGamut(l, c, h, config.value.gamut);
        l = clamped.l;
        c = clamped.c;
        h = clamped.h;
      }

      const { inSRGB, inP3, inRec2020 } = checkGamut(l, c, h);
      const oklchStr = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${Math.round(h)})`;

      return {
        label: String(step.label),
        l,
        c,
        h,
        oklch: oklchStr,
        hex: hToHex(h, l, c).toUpperCase(),
        inSRGB,
        inP3,
        inRec2020,
        apcaOnWhite: computeAPCA(oklchStr, "#ffffff"),
        apcaOnBlack: computeAPCA(oklchStr, "#000000"),
        apcaWhiteOnThis: computeAPCA("#ffffff", oklchStr),
        apcaBlackOnThis: computeAPCA("#000000", oklchStr),
      };
    });
  });

  /**
   * Reset all manual overrides and chroma profile to defaults
   */
  function resetStep3Overrides() {
    // Perform a full object replacement to ensure deep reactivity and storage sync
    config.value = {
      ...config.value,
      cPeak: DEFAULT_CONFIG.cPeak,
      cTaper: DEFAULT_CONFIG.cTaper,
      steps: config.value.steps.map((step) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cOverride, hOverride, ...cleanStep } = step;
        return cleanStep;
      }),
    };
  }

  /**
   * Apply hue shift corrections
   */
  function applyHueShiftFix(fixes: { label: string; perceivedH: number; deltaH: number }[]) {
    const newSteps = config.value.steps.map((step) => {
      const fix = fixes.find((f) => f.label === step.label);
      if (fix && Math.abs(fix.deltaH) > 3) {
        return {
          ...step,
          hOverride: (config.value.h - fix.deltaH + 360) % 360,
        };
      }
      return step;
    });

    config.value = { ...config.value, steps: newSteps };
  }

  /**
   * Apply a lightness preset by key
   */
  function applyLightnessPreset(presetKey: keyof typeof LIGHTNESS_PRESETS) {
    const vals = LIGHTNESS_PRESETS[presetKey];
    let newSteps: Step[] = [];

    if (vals.length === config.value.steps.length) {
      newSteps = config.value.steps.map((s, i) => ({ ...s, l: vals[i] }));
    } else {
      // Adapt via interpolation to support arbitrary step counts
      const newL = autoDistributeL(config.value.steps.length, vals);
      newSteps = config.value.steps.map((s, i) => ({ ...s, l: newL[i] }));
    }

    config.value = { ...config.value, steps: newSteps };
  }

  /**
   * Add a new step at the specified index or at the end
   */
  function addStep(index?: number) {
    const steps = [...config.value.steps];
    const insertIdx = index !== undefined ? index : steps.length;

    // Calculate initial L value via interpolation
    let newL = 0.5;
    if (steps.length > 0) {
      if (insertIdx === 0) {
        newL = Math.min(0.98, steps[0].l + 0.05);
      } else if (insertIdx >= steps.length) {
        newL = Math.max(0.05, steps[steps.length - 1].l - 0.05);
      } else {
        newL = (steps[insertIdx - 1].l + steps[insertIdx].l) / 2;
      }
    }

    const newStep: Step = {
      label: `new-${steps.length}`,
      l: parseFloat(newL.toFixed(3)),
    };

    steps.splice(insertIdx, 0, newStep);
    config.value.steps = steps;

    // Update mainIdx if it moved
    if (insertIdx <= config.value.mainIdx) {
      config.value.mainIdx++;
    }
  }

  /**
   * Remove a step at index
   */
  function removeStep(index: number) {
    if (config.value.steps.length <= 2) return; // Keep at least 2 steps

    const steps = [...config.value.steps];
    steps.splice(index, 1);
    config.value.steps = steps;

    // Update mainIdx
    if (index === config.value.mainIdx) {
      // If removed main color, find replacement or reset to middle
      const newMainIdx = config.value.steps.findIndex((s) => s.label === "500");
      config.value.mainIdx = newMainIdx !== -1 ? newMainIdx : Math.floor(steps.length / 2);
    } else if (index < config.value.mainIdx) {
      config.value.mainIdx--;
    }
  }

  /**
   * Update step label and handle logical side effects
   */
  function updateStepLabel(index: number, newLabel: string) {
    const steps = [...config.value.steps];
    steps[index].label = newLabel;
    config.value.steps = steps;

    // If label becomes '500', consider it the new main color
    if (newLabel === "500") {
      config.value.mainIdx = index;
    }
  }

  return {
    config,
    computedSwatches,
    resetStep3Overrides,
    applyHueShiftFix,
    applyLightnessPreset,
    addStep,
    removeStep,
    updateStepLabel,
  };
});
