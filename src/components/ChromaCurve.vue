<script setup lang="ts">
import { ref } from "vue";
import { useColorStore } from "../store/colorStore";
import type { ComputedSwatch } from "../store/colorStore";

const store = useColorStore();
const isResetting = ref(false);
let resetTimer: any = null;

/**
 * Handle chroma reset with feedback
 */
function handleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  store.resetStep3Overrides();
  isResetting.value = true;
  resetTimer = setTimeout(() => {
    isResetting.value = false;
    resetTimer = null;
  }, 2500);
}

/**
 * Prompt for manual C override
 */
function promptOverride(idx: number, swatch: ComputedSwatch) {
  const res = window.prompt(
    `Manual C for ${swatch.label}\nRange: 0.0 - 0.4\nCurrent: ${swatch.c.toFixed(3)}`,
    swatch.c.toFixed(3),
  );
  if (res && !isNaN(parseFloat(res))) {
    // Deep clone is handled by re-assigning the whole array (standard ref pattern)
    const newSteps = [...store.config.steps];
    newSteps[idx] = { ...newSteps[idx], cOverride: parseFloat(res) };
    store.config.steps = newSteps;
  }
}

/**
 * Chart height calculation utility
 */
const getBarHeight = (c: number) => `${(c / 0.3) * 100}%`;
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Curve Control Sliders -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 outline-none">
      <div class="flex flex-col gap-3">
        <label
          class="flex justify-between items-center text-[0.6875rem] sm:text-sm font-black uppercase tracking-wider text-gray-500"
        >
          <span title="Peak saturation at main color">Peak Chroma</span>
          <span
            class="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-[0.625rem] sm:text-xs select-none"
          >
            {{ store.config.cPeak.toFixed(3) }}
          </span>
        </label>
        <input
          type="range"
          min="0.05"
          max="0.30"
          step="0.001"
          v-model.number="store.config.cPeak"
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer hue-slider transition-opacity hover:opacity-100 opacity-90 touch-pan-x"
        />
      </div>

      <div class="flex flex-col gap-3">
        <label
          class="flex justify-between items-center text-[0.6875rem] sm:text-sm font-black uppercase tracking-wider text-gray-500"
        >
          <span title="Reduction rate towards light/dark ends">Chroma Taper</span>
          <span
            class="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-[0.625rem] sm:text-xs select-none"
          >
            {{ store.config.cTaper.toFixed(3) }}
          </span>
        </label>
        <input
          type="range"
          min="0.10"
          max="0.80"
          step="0.001"
          v-model.number="store.config.cTaper"
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer hue-slider transition-opacity hover:opacity-100 opacity-90 touch-pan-x"
        />
      </div>
    </div>

    <!-- Visualization & Manual Control -->
    <div class="flex flex-col gap-4">
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="flex items-center gap-2">
          <h3
            class="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500"
          >
            Chroma Distribution
          </h3>
          <span
            class="text-[0.625rem] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono"
            >Max 0.3</span
          >
        </div>

        <button
          @click="handleReset"
          class="relative group h-9 px-4 w-full sm:w-56 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 active:scale-95 shadow-sm"
          :class="
            isResetting
              ? 'bg-green-600 border-green-500 text-white shadow-green-500/20 animate-pulse-success'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500'
          "
        >
          <div class="relative z-10 w-full h-full flex items-center justify-center gap-2">
            <transition name="pop-content" mode="out-in">
              <div
                v-if="isResetting"
                key="cleared"
                class="flex items-center gap-2 font-black text-[0.625rem] uppercase tracking-wider"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Reset Success</span>
              </div>
              <div
                v-else
                key="clear"
                class="flex items-center gap-2 font-bold text-[0.625rem] uppercase tracking-wider"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="opacity-70"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Clear Step 3 Overrides</span>
              </div>
            </transition>
          </div>
          <div
            v-if="isResetting"
            class="absolute bottom-0 left-0 h-1 bg-white/30 z-20 countdown-bar"
          ></div>
        </button>
      </header>

      <!-- Bar Chart Rendering (Scrollable on mobile) -->
      <div class="w-full overflow-x-auto pb-4 -mb-4 custom-scrollbar">
        <div
          class="h-44 min-w-[31.25rem] sm:min-w-0 flex items-end gap-1.5 p-4 bg-gray-50/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100 dark:border-gray-800 relative ring-1 ring-inset ring-black/5 dark:ring-white/5"
        >
          <div
            v-for="(swatch, idx) in store.computedSwatches"
            :key="idx"
            class="flex-1 min-w-[1.5rem] flex flex-col justify-end items-center group relative h-full"
          >
            <!-- Manual Badge -->
            <transition name="pop-content">
              <div
                v-if="store.config.steps[idx].cOverride !== undefined"
                class="absolute -top-7 text-[0.5625rem] text-orange-600 dark:text-orange-400 font-extrabold bg-orange-50 dark:bg-orange-900/40 px-1.5 py-0.5 rounded-md border border-orange-200/50 dark:border-orange-800/50 shadow-sm z-10"
              >
                FIXED
              </div>
            </transition>

            <!-- The Bar -->
            <div
              class="w-full rounded-t-lg transition-all duration-500 relative cursor-pointer hover:brightness-110 active:scale-95 group/bar overflow-hidden shadow-sm"
              :style="{
                height: getBarHeight(swatch.c),
                backgroundColor: swatch.oklch,
              }"
              @click="promptOverride(idx, swatch)"
              :title="`Click to override C value\nCurrent: ${swatch.c.toFixed(3)}`"
            >
              <!-- Height Tooltip -->
              <div
                class="opacity-0 group-hover/bar:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-950 text-[0.625rem] font-bold py-1.5 px-2 rounded-lg whitespace-nowrap z-20 transition-all shadow-xl border border-white/10 dark:border-black/10 pointer-events-none"
              >
                C: {{ swatch.c.toFixed(3) }}
              </div>

              <!-- Hover Shine -->
              <span
                class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity"
              ></span>
            </div>

            <!-- Label -->
            <span
              class="text-[0.75rem] font-bold tracking-tighter text-gray-400 dark:text-gray-600 mt-2 font-mono uppercase"
              >{{ swatch.label }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

:global(.dark) .hue-slider::-webkit-slider-thumb {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.hue-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
</style>
