<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  fixes: { label: string; perceivedH: number; deltaH: number }[];
}>();

const emit = defineEmits<{
  (e: "apply"): void;
  (e: "dismiss"): void;
}>();

const isVisible = ref(true);

function handleApply() {
  emit("apply");
}

function handleDismiss() {
  isVisible.value = false;
  emit("dismiss");
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="isVisible && fixes.length > 0"
      class="mt-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm rounded-2xl p-4 text-sm text-orange-900 dark:text-orange-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-start gap-3">
        <span class="text-xl shrink-0 mt-0.5">⚠️</span>
        <div class="flex flex-col gap-1">
          <p class="font-bold leading-tight">Hue Shift Detected (Abney Effect)</p>
          <p class="opacity-80 text-xs">
            High chroma ranges (H=240-340) often appear shifted in hue. Impacted steps:
            <span
              class="font-mono bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded text-[0.625rem]"
              >{{ fixes.map((f) => f.label).join(", ") }}</span
            >
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <button
          @click="handleDismiss"
          class="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline underline-offset-4 transition-colors"
        >
          Dismiss
        </button>
        <button
          @click="handleApply"
          class="px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          Apply Correction
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
