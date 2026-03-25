<script setup lang="ts">
import { ref, watch } from "vue";
import { useColorStore } from "../store/colorStore";
import { hexToH, hToHex } from "../utils/color";

const store = useColorStore();
const hexBuffer = ref("");

const HUE_PRESETS = [
  { label: "Red-Orange", h: 15, color: "oklch(0.6 0.2 15)" },
  { label: "Amber", h: 55, color: "oklch(0.6 0.2 55)" },
  { label: "Green", h: 145, color: "oklch(0.6 0.2 145)" },
  { label: "Cyan", h: 210, color: "oklch(0.6 0.2 210)" },
  { label: "Blue-Purple", h: 260, color: "oklch(0.6 0.2 260)" },
  { label: "Purple", h: 300, color: "oklch(0.6 0.2 300)" },
] as const;

/**
 * Handle manual HEX input
 */
function syncHex() {
  let val = hexBuffer.value.trim();
  if (val && !val.startsWith("#") && /^[0-9a-fA-F]{3,6}$/.test(val)) {
    val = "#" + val;
    hexBuffer.value = val; // Auto-fix in UI
  }

  const h = hexToH(val);
  if (h !== null) {
    store.config.h = h;
    store.config.originalColor = val;
  }
}

function selectPreset(p: { h: number; color: string }) {
  store.config.h = p.h;
  store.config.originalColor = p.color;
}

/**
 * Reset hex input if the global hue changes from other sources (slider, preset)
 */
watch(
  () => store.config.h,
  (newH) => {
    const currentHex = hToHex(newH);
    if (hexToH(hexBuffer.value) !== newH) {
      hexBuffer.value = currentHex.toUpperCase();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-4 sm:gap-6">
      <!-- Premium Hue Preview -->
      <div
        class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105 duration-300 relative overflow-hidden group shrink-0"
        :style="{ backgroundColor: `oklch(0.6 0.2 ${store.config.h})` }"
      >
        <div
          class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        ></div>
      </div>

      <div class="flex-1 flex flex-col gap-2">
        <div
          class="flex justify-between items-center text-[0.6875rem] sm:text-sm font-black uppercase tracking-wider text-gray-500"
        >
          <span>Hue Angle</span>
          <span
            class="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-[0.625rem] sm:text-xs"
          >
            {{ store.config.h.toFixed(1) }}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          v-model.number="store.config.h"
          @input="store.config.originalColor = undefined"
          class="w-full h-2 rounded-lg cursor-pointer custom-range transition-all active:scale-[0.99] touch-pan-x"
          style="
            background: linear-gradient(
              to right,
              #ff0000 0%,
              #ffff00 17%,
              #00ff00 33%,
              #00ffff 50%,
              #0000ff 67%,
              #ff00ff 83%,
              #ff0000 100%
            );
            appearance: none;
            outline: none;
            border-radius: 99px;
          "
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:gap-4">
      <div class="flex flex-col gap-1.5">
        <label
          for="hex-input"
          class="text-[0.625rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
          >HEX Input</label
        >
        <input
          id="hex-input"
          type="text"
          v-model="hexBuffer"
          @input="syncHex"
          placeholder="#3B82F6"
          class="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[0.6875rem] sm:text-sm font-mono transition-all outline-none"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          for="num-input"
          class="text-[0.625rem] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
          >Angle</label
        >
        <input
          id="num-input"
          type="number"
          min="0"
          max="360"
          v-model.number="store.config.h"
          @input="store.config.originalColor = undefined"
          class="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-[0.6875rem] sm:text-sm font-mono transition-all outline-none"
        />
      </div>
    </div>

    <div>
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >Hue Presets</span
        >
        <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="p in HUE_PRESETS"
          :key="p.h"
          @click="selectPreset(p)"
          class="w-10 h-10 rounded-xl border-2 border-white dark:border-gray-900 shadow-lg hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 relative group"
          :style="{ backgroundColor: p.color }"
          :title="`${p.label} (${p.h}°)`"
        >
          <div
            class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 ring-2 ring-blue-500 transition-opacity"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}
:global(.dark) .custom-range::-webkit-slider-thumb {
  background: #1f2937;
  border-color: #374151;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
