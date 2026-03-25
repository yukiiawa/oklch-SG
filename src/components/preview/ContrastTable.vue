<script setup lang="ts">
import { computed } from "vue";
import type { ComputedSwatch } from "../../store/colorStore";

const props = defineProps<{
  swatches: ComputedSwatch[];
  /** 'white' | 'black' | 'custom' — matches the mode in PreviewArea */
  mode: "white" | "black" | "custom";
  /** Custom foreground color hex (used when mode === 'custom') */
  customFg?: string;
}>();

/** Lc value: selected text color ON each swatch as background */
function getLc(swatch: ComputedSwatch): number {
  if (props.mode === "white") return swatch.apcaWhiteOnThis;
  if (props.mode === "black") return swatch.apcaBlackOnThis;
  // custom: computeAPCA is called upstream and passed via the swatches
  // We piggyback on the customLc prop if available, otherwise fall back
  return (swatch as any).customLcOnThis ?? 0;
}

function badge(lc: number) {
  if (lc >= 60)
    return {
      label: "Good",
      cls: "text-green-700 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    };
  if (lc >= 40)
    return {
      label: "Large",
      cls: "text-amber-700 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    };
  return {
    label: "Fail",
    cls: "text-red-700 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };
}

const modeLabel = computed(() => {
  if (props.mode === "white") return "White";
  if (props.mode === "black") return "Black";
  return "Custom";
});
</script>

<template>
  <div
    class="mt-2 sm:mt-4 bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
  >
    <!-- Header -->
    <div class="px-4 pt-3 pb-1 flex items-center gap-2">
      <span
        class="text-[0.5625rem] sm:text-[0.625rem] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500"
      >
        {{ modeLabel }} text on each swatch bg (APCA Standard)
      </span>
    </div>

    <!-- Swatch contrast grid container with horizontal scroll for mobile -->
    <div class="overflow-x-auto custom-scrollbar">
      <div
        class="px-3 py-3 grid gap-2 min-w-[600px] sm:min-w-0"
        :style="`grid-template-columns: repeat(${swatches.length}, minmax(0, 1fr))`"
      >
        <div
          v-for="s in swatches"
          :key="s.label"
          class="flex flex-col items-center gap-1 rounded-lg overflow-hidden"
        >
          <!-- Color preview block -->
          <div
            class="w-full h-12 sm:h-14 rounded-xl flex items-center justify-center text-[0.875rem] sm:text-base font-black shadow-sm mb-1.5"
            :style="{
              backgroundColor: s.oklch,
              color:
                mode === 'white'
                  ? '#ffffff'
                  : mode === 'black'
                    ? '#000000'
                    : (customFg ?? '#000000'),
            }"
          >
            Aa
          </div>
          <!-- Label -->
          <div
            class="text-[0.6875rem] sm:text-sm font-bold text-gray-400 dark:text-gray-500 mb-1 tracking-tight"
          >
            {{ s.label }}
          </div>
          <!-- Lc value -->
          <div
            class="text-sm sm:text-lg font-black text-gray-800 dark:text-gray-200 leading-none mb-2"
          >
            {{ getLc(s)
            }}<span class="text-[0.625rem] sm:text-xs opacity-40 ml-1 font-mono align-baseline"
              >Lc</span
            >
          </div>
          <!-- Pass/Fail badge -->
          <div
            class="text-[0.625rem] sm:text-[0.6875rem] font-black uppercase tracking-wider px-2 py-1 rounded-lg border whitespace-nowrap"
            :class="badge(getLc(s)).cls"
          >
            {{ badge(getLc(s)).label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
