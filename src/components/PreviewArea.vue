<script setup lang="ts">
import { ref, computed } from "vue";
import { useColorStore } from "../store/colorStore";
import { computeAPCA, detectHueShift, hToHex } from "../utils/color";
import { useClipboard, useLocalStorage } from "@vueuse/core";

import SwatchItem from "./preview/SwatchItem.vue";
import ContrastTable from "./preview/ContrastTable.vue";
import HueShiftPanel from "./preview/HueShiftPanel.vue";

const store = useColorStore();
const { copy } = useClipboard();

const lastCopiedIdx = ref<number | null>(null);
const isSvgCopied = ref(false);
const includeBaseInSvg = useLocalStorage("oklch-sg-include-base", false);
let copyTimer: any = null;

// ── Contrast mode ──────────────────────────────────────
type ContrastMode = "white" | "black" | "custom";
const contrastMode = useLocalStorage<ContrastMode>("oklch-sg-contrast-mode", "white");
const customBg = useLocalStorage("oklch-sg-custom-bg", "#ffffff"); // badge mode: swatch as text on this bg
const customFg = useLocalStorage("oklch-sg-custom-fg", "#000000"); // table mode: this color as text on swatch bg
const isResetting = ref(false);

function resetCustomColors() {
  if (isResetting.value) return;
  isResetting.value = true;
  customBg.value = "#ffffff";
  customFg.value = "#000000";
  setTimeout(() => {
    isResetting.value = false;
  }, 500);
}

/** Lc for each swatch based on current contrast mode */
const swatchContrastLc = computed(() => {
  return store.computedSwatches.map((s) => {
    if (contrastMode.value === "white") return s.apcaOnWhite;
    if (contrastMode.value === "black") return s.apcaOnBlack;
    // custom: swatch = foreground text color on customBg
    return computeAPCA(s.oklch, customBg.value);
  });
});

// ── Copy helpers ────────────────────────────────────────
async function copyColor(text: string, idx: number) {
  await copy(text);
  lastCopiedIdx.value = idx;
  setTimeout(() => {
    lastCopiedIdx.value = null;
  }, 1500);
}

async function copySVG() {
  if (copyTimer) clearTimeout(copyTimer);
  const S_WIDTH = 100,
    S_HEIGHT = 100;
  const swatches = [...store.computedSwatches];
  if (includeBaseInSvg.value) {
    const baseColor = store.config.originalColor || `oklch(0.6 0.2 ${store.config.h})`;
    swatches.unshift({ label: "Base", l: 0.6, c: 0.2, h: store.config.h, oklch: baseColor } as any);
  }
  const totalWidth = swatches.length * S_WIDTH;
  const svgContent = swatches
    .map((s, i) => {
      const textColor = s.l > 0.6 ? "#000000" : "#ffffff";
      return `<g transform="translate(${i * S_WIDTH}, 0)">
      <rect width="${S_WIDTH}" height="${S_HEIGHT}" fill="${s.oklch}" />
      <text x="10" y="24" fill="${textColor}" font-family="sans-serif" font-size="14" font-weight="bold">${s.label}</text>
      <text x="10" y="75" fill="${textColor}" fill-opacity="0.6" font-family="monospace" font-size="10">L: ${s.l.toFixed(3)}</text>
      <text x="10" y="88" fill="${textColor}" fill-opacity="0.6" font-family="monospace" font-size="10">C: ${s.c.toFixed(3)}</text>
    </g>`;
    })
    .join("");
  await copy(
    `<svg width="${totalWidth}" height="${S_HEIGHT}" viewBox="0 0 ${totalWidth} ${S_HEIGHT}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">${svgContent}</svg>`,
  );
  isSvgCopied.value = true;
  copyTimer = setTimeout(() => {
    isSvgCopied.value = false;
    copyTimer = null;
  }, 2500);
}

// ── Table swatches (text-on-swatch perspective) ────────
/** Swatches enriched with customLcOnThis for the new ContrastTable */
const tableSwatches = computed(() => {
  if (contrastMode.value !== "custom") return store.computedSwatches;
  return store.computedSwatches.map((s) => ({
    ...s,
    customLcOnThis: computeAPCA(customFg.value, s.oklch),
  }));
});

// ── Hue shift ───────────────────────────────────────────
const shiftFixes = computed(() => {
  if (store.config.cPeak < 0.12) return [];
  const { h } = store.config;
  if (h >= 240 && h <= 340) {
    return detectHueShift(store.computedSwatches).filter((f) => Math.abs(f.deltaH) > 3);
  }
  return [];
});
const showFixPanel = ref(true);
</script>

<template>
  <div
    class="border-b border-gray-100 dark:border-gray-900 bg-white/50 dark:bg-gray-950/50 backdrop-blur pb-4 pt-3 sm:pb-8 sm:pt-4"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:gap-4">
      <!-- Preview Header & Tool Actions -->
      <div class="flex flex-row flex-wrap justify-between items-center gap-2 mb-1 sm:mb-2">
        <h2
          class="text-[0.625rem] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500"
        >
          Live Preview
        </h2>

        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6"
        >
          <!-- Group 1: Contrast Controls -->
          <div
            class="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 sm:gap-4 shrink-0 overflow-x-auto py-1 custom-scrollbar min-h-[40px]"
          >
            <!-- Segmented control -->
            <div
              class="flex shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-[0.5625rem] sm:text-[0.625rem] font-black uppercase tracking-wider shadow-sm bg-white dark:bg-gray-900 h-9"
            >
              <button
                v-for="mode in ['white', 'black', 'custom'] as const"
                :key="mode"
                @click="contrastMode = mode"
                class="px-3 sm:px-4 py-1.5 transition-colors duration-150"
                :class="
                  contrastMode === mode
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                "
              >
                {{ mode === "white" ? "W" : mode === "black" ? "B" : "Custom" }}
              </button>
            </div>

            <!-- Custom color pickers (shown only in custom mode) -->
            <div
              v-if="contrastMode === 'custom'"
              class="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300 shrink-0"
            >
              <!-- BG picker -->
              <label
                class="flex items-center gap-1.5 cursor-pointer"
                title="Badge: swatch text on this background"
              >
                <span
                  class="text-[0.5rem] sm:text-[0.5625rem] font-black tracking-tight text-gray-400 uppercase"
                  >BG</span
                >
                <div
                  class="relative w-7 h-7 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all"
                >
                  <input
                    type="color"
                    v-model="customBg"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div class="w-full h-full" :style="{ backgroundColor: customBg }"></div>
                </div>
              </label>
              <!-- FG picker -->
              <label
                class="flex items-center gap-1.5 cursor-pointer"
                title="Table: this text color on swatch background"
              >
                <span
                  class="text-[0.5rem] sm:text-[0.5625rem] font-black tracking-tight text-gray-400 uppercase"
                  >FG</span
                >
                <div
                  class="relative w-7 h-7 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-blue-500/20 transition-all"
                >
                  <input
                    type="color"
                    v-model="customFg"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div class="w-full h-full" :style="{ backgroundColor: customFg }"></div>
                </div>
              </label>

              <!-- Reset Button Group -->
              <div class="flex items-center gap-1.5" title="Reset custom colors to default">
                <span
                  class="text-[0.5rem] sm:text-[0.5625rem] font-black tracking-tight text-gray-400 uppercase"
                  >RS</span
                >
                <button
                  @click="resetCustomColors"
                  class="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 shadow-sm active:scale-90"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="transition-transform duration-500"
                    :class="{ 'rotate-[360deg]': isResetting }"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Group 2: Export Controls -->
          <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto h-10">
            <!-- Include Base Toggle -->
            <label
              class="flex items-center gap-2 cursor-pointer group py-1 select-none"
              title="Include base color swatch in SVG export"
            >
              <div class="relative flex items-center">
                <input type="checkbox" v-model="includeBaseInSvg" class="sr-only" />
                <div
                  class="w-9 h-5 sm:w-10 sm:h-6 rounded-full transition-all duration-300 shadow-inner"
                  :class="
                    includeBaseInSvg
                      ? 'bg-blue-600 dark:bg-blue-500 shadow-blue-900/20'
                      : 'bg-gray-200 dark:bg-gray-800 shadow-black/5'
                  "
                ></div>
                <div
                  class="absolute left-0.5 sm:left-1 w-4 h-4 sm:w-4 sm:h-4 bg-white rounded-full shadow-md transition-all duration-300"
                  :class="{ 'translate-x-4': includeBaseInSvg }"
                ></div>
              </div>
              <span
                class="text-[0.5625rem] sm:text-[0.625rem] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap"
                :class="
                  includeBaseInSvg
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                "
              >
                +Base to SVG
              </span>
            </label>

            <!-- SVG Copy Button -->
            <button
              @click="copySVG"
              class="relative group h-full px-4 min-w-[100px] sm:min-w-[130px] overflow-hidden rounded-xl border transition-all duration-300 active:scale-95 shadow-sm"
              :class="
                isSvgCopied
                  ? 'bg-green-600 border-green-500 text-white animate-pulse-success'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500'
              "
            >
              <div class="relative z-10 w-full h-full flex items-center justify-center gap-2">
                <transition name="pop-content" mode="out-in">
                  <div
                    v-if="isSvgCopied"
                    key="copied"
                    class="flex items-center gap-1.5 font-black text-[0.625rem] sm:text-[0.6875rem] uppercase tracking-wider"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="sm:w-3.5 sm:h-3.5"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Copied</span>
                  </div>
                  <div
                    v-else
                    key="copy"
                    class="flex items-center gap-1.5 font-black text-[0.625rem] sm:text-[0.6875rem] uppercase tracking-wider"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="opacity-70 sm:w-3.5 sm:h-3.5"
                    >
                      <path d="M12 2v8" />
                      <path d="m16 6-4 4-4-4" />
                      <rect width="20" height="8" x="2" y="14" rx="2" />
                    </svg>
                    <span>SVG</span>
                    <span class="hidden sm:inline">Scale</span>
                  </div>
                </transition>
              </div>
              <div
                v-if="isSvgCopied"
                class="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-white/30 z-20 countdown-bar"
              ></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Section 1: Swatches as Text (LC Badges) -->
      <div class="flex items-center gap-2 mb-1">
        <span
          class="text-[0.5625rem] sm:text-[0.625rem] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500"
        >
          Each swatch on
          {{ contrastMode === "white" ? "white" : contrastMode === "black" ? "black" : "custom" }}
          bg (APCA Standard)
        </span>
      </div>

      <!-- Main Scale Preview (Horizontal scroll on small screens) -->
      <div class="w-full overflow-x-auto pb-2 sm:pb-4 -mb-2 sm:-mb-4 custom-scrollbar">
        <div
          class="flex h-24 sm:h-32 min-w-max sm:min-w-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-black/5 dark:border-white/10 mx-auto w-full group/palette bg-white dark:bg-gray-950 relative ring-1 ring-black/5 dark:ring-white/5"
        >
          <!-- Base Reference Color -->
          <div
            class="flex flex-col justify-end w-24 shrink-0 transition-opacity p-3 border-r-2 border-dashed border-gray-200 dark:border-gray-800 relative group/input cursor-default overflow-hidden"
            :style="{
              backgroundColor: store.config.originalColor || `oklch(0.6 0.2 ${store.config.h})`,
            }"
          >
            <!-- Base Drawer Overlay -->
            <div
              class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm translate-y-full group-hover/input:translate-y-0 transition-transform duration-300 pointer-events-none group-hover/input:pointer-events-auto"
              :class="{ '!translate-y-full !pointer-events-none': lastCopiedIdx === -1 }"
            >
              <button
                @click.stop="
                  copyColor(
                    (store.config.originalColor?.startsWith('#')
                      ? store.config.originalColor
                      : hToHex(store.config.h, 0.6, 0.2)
                    ).toUpperCase(),
                    -1,
                  )
                "
                class="w-16 py-1.5 bg-white/90 hover:bg-white text-black text-[0.625rem] font-bold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                HEX
              </button>
              <button
                @click.stop="
                  copyColor(
                    store.config.originalColor?.startsWith('oklch')
                      ? store.config.originalColor
                      : `oklch(0.600 0.200 ${Math.round(store.config.h)})`,
                    -1,
                  )
                "
                class="w-16 py-1.5 bg-white/90 hover:bg-white text-black text-[0.625rem] font-bold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                OKLCH
              </button>
            </div>

            <div
              class="text-[0.625rem] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] uppercase mt-auto text-center translate-y-[-0.125rem] tracking-tight pointer-events-none"
            >
              {{ lastCopiedIdx === -1 ? "✓ Copied" : "Base" }}
            </div>
            <div
              class="absolute inset-0 bg-black/10 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none"
            ></div>
          </div>

          <!-- Rendered Swatches -->
          <SwatchItem
            v-for="(swatch, idx) in store.computedSwatches"
            :key="idx"
            :swatch="swatch"
            :is-copied="lastCopiedIdx === idx"
            :has-hue-shift="!!shiftFixes.find((f) => f.label === swatch.label)"
            :hue-shift-delta="shiftFixes.find((f) => f.label === swatch.label)?.deltaH"
            :contrast-lc="swatchContrastLc[idx]"
            @copy="copyColor($event, idx)"
          />
        </div>
      </div>

      <!-- Hue Shift Feedback Panel -->
      <HueShiftPanel
        v-if="showFixPanel"
        :fixes="shiftFixes"
        @apply="
          store.applyHueShiftFix(shiftFixes);
          showFixPanel = false;
        "
        @dismiss="showFixPanel = false"
      />

      <!-- APCA Contrast Table (text-on-swatch view) -->
      <ContrastTable :swatches="tableSwatches" :mode="contrastMode" :custom-fg="customFg" />
    </div>
  </div>
</template>
