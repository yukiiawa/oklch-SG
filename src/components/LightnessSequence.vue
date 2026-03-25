<script setup lang="ts">
import { ref, computed } from "vue";
import { useColorStore } from "../store/colorStore";

const store = useColorStore();
const selectedPreset = ref("perceptual");

const PRESET_OPTIONS = [
  { id: "perceptual", label: "Perceptual", desc: "Default" },
  { id: "highContrast", label: "High Contrast", desc: "Punchy" },
  { id: "soft", label: "Soft", desc: "Subtle" },
] as const;

/**
 * Apply a lightness preset and track selection
 */
function applyPreset(id: (typeof PRESET_OPTIONS)[number]["id"]) {
  selectedPreset.value = id;
  store.applyLightnessPreset(id);
}

/**
 * Calculate validation class for a single step
 */
function getValidationClass(index: number) {
  const current = store.config.steps[index].l;
  const prev = index > 0 ? store.config.steps[index - 1].l : 1.0;
  const next = index < store.config.steps.length - 1 ? store.config.steps[index + 1].l : 0.0;

  if (prev - current < 0.04 || current - next < 0.04) {
    return "text-red-600 dark:text-red-400 font-bold";
  }
  return "text-gray-700 dark:text-gray-300";
}

/**
 * Label validation: unique and URL-safe
 */
function isLabelInvalid(idx: number, label: string) {
  if (!/^[a-zA-Z0-0\-_]+$/.test(label)) return true; // URL unsafe
  const duplicate = store.config.steps.some((s, i) => i !== idx && s.label === label);
  return duplicate;
}

/**
 * Global sequence error state
 */
const isSequenceBroken = computed(() => {
  return store.config.steps.some((_, idx) => getValidationClass(idx).includes("red"));
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Premium Segmented Control for Presets -->
    <div
      class="p-1 bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex gap-1 w-full overflow-x-auto custom-scrollbar"
    >
      <button
        v-for="preset in PRESET_OPTIONS"
        :key="preset.id"
        @click="applyPreset(preset.id)"
        class="flex-1 min-w-max relative py-2.5 px-3 rounded-lg text-[0.5625rem] sm:text-[0.6875rem] font-black transition-all duration-300 flex flex-col justify-center items-center group uppercase tracking-widest"
        :class="
          selectedPreset === preset.id
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
        "
      >
        <span class="whitespace-nowrap pb-1">{{ preset.label }}</span>
        <!-- Active Indicator Dot -->
        <div
          v-if="selectedPreset === preset.id"
          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"
        ></div>
      </button>
    </div>

    <div
      v-if="isSequenceBroken"
      class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm flex gap-2 items-center border border-red-100 dark:border-red-900/30"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="shrink-0"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      Warning: Lightness difference between adjacent steps is < 0.04, visually difficult to
      distinguish.
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="(step, idx) in store.config.steps"
        :key="idx"
        class="flex gap-3 sm:gap-4 items-center group/row"
      >
        <div class="w-12 sm:w-16 flex justify-between items-center shrink-0">
          <input
            type="text"
            :value="step.label"
            @input="(e) => store.updateStepLabel(idx, (e.target as HTMLInputElement).value)"
            class="w-8 sm:w-12 text-xs sm:text-sm font-black text-right bg-transparent border-b border-dashed focus:outline-none focus:border-blue-500 transition-colors uppercase tracking-tighter"
            :class="
              isLabelInvalid(idx, step.label)
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
            "
            :title="isLabelInvalid(idx, step.label) ? 'Label must be unique and URL-safe' : ''"
          />
          <div
            v-if="idx === store.config.mainIdx"
            class="text-blue-500 dark:text-blue-400 text-[0.5625rem] sm:text-[0.625rem] ml-1"
            title="Main Color (C Peak Anchor)"
          >
            ◆
          </div>
        </div>

        <input
          type="range"
          min="0.05"
          max="0.98"
          step="0.001"
          v-model.number="step.l"
          class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer custom-slider"
        />

        <div
          class="w-10 sm:w-12 text-right text-xs sm:text-sm font-mono"
          :class="getValidationClass(idx)"
        >
          {{ step.l.toFixed(3) }}
        </div>

        <!-- Animated Trash Action -->
        <button
          @click="store.removeStep(idx)"
          v-if="store.config.steps.length > 2"
          class="group/trash p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all outline-none"
          title="Remove this step"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            class="overflow-visible transition-transform duration-300 sm:w-5 sm:h-5"
          >
            <g
              class="transition-transform duration-300 origin-[7px_6px] group-hover/trash:-translate-y-1.5 group-hover/trash:-rotate-12"
            >
              <path
                d="M16.5 6V4.5C16.5 3.67157 15.8284 3 15 3H9C8.17157 3 7.5 3.67157 7.5 4.5V6"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <path d="M3 6H21" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </g>
            <path
              d="M19 6L18.1585 18.6225C18.0673 19.9912 16.9288 21 15.5559 21H8.44414C7.07122 21 5.93272 19.9912 5.84154 18.6225L5 6"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- Add Step Button -->
      <button
        @click="store.addStep()"
        class="mt-4 py-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-[0.625rem] sm:text-xs font-black uppercase tracking-widest text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 group mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-transform group-hover:rotate-90"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add New Scale Step
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
:global(.dark) .custom-slider::-webkit-slider-thumb {
  border-color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
</style>
