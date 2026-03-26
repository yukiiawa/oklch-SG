<script setup lang="ts">
import PreviewArea from "./components/PreviewArea.vue";
import HueInput from "./components/HueInput.vue";
import LightnessSequence from "./components/LightnessSequence.vue";
import ChromaCurve from "./components/ChromaCurve.vue";
import ExportPanel from "./components/ExportPanel.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import GamutOptimization from "./components/GamutOptimization.vue";
import { ref } from "vue";

const supportsOklch = ref(typeof CSS !== "undefined" && CSS.supports("color", "oklch(0 0 0)"));
const isExportModalOpen = ref(false);

/**
 * Modern Vue 3 Component Pattern:
 * Local sub-component for repeated section wrappers to keep App.vue clean.
 */
import { defineComponent, h } from "vue";
const SectionWrapper = defineComponent({
  props: ["title"],
  setup(props, { slots }) {
    return () =>
      h(
        "section",
        {
          class:
            "bg-white dark:bg-[#161923] p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800/60 transition-colors",
        },
        [
          h(
            "h2",
            {
              class:
                "text-base sm:text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 uppercase tracking-wider",
            },
            props.title,
          ),
          slots.default?.(),
        ],
      );
  },
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900"
  >
    <!-- Browser Compatibility Warning -->
    <div
      v-if="!supportsOklch"
      role="alert"
      class="bg-red-500 text-white text-center text-sm py-2 font-medium leading-relaxed"
    >
      <svg
        class="mr-1 inline-block -mt-0.5"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      Browser lacks native OKLCH support. Previews may be inaccurate. Use Chrome 111+, Safari 16.4+,
      or Firefox 113+.
    </div>

    <!-- Sticky Application Header -->
    <header
      class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md"
    >
      <nav class="max-w-[90rem] mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <h1
          class="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2"
        >
          <svg
            class="text-blue-600 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path
              d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
            />
          </svg>
          <span class="hidden sm:inline">OKLCH Scale Generator</span>
          <span class="sm:hidden font-mono tracking-tighter">OKLCH.SG</span>
        </h1>

        <div class="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <button
            @click="isExportModalOpen = true"
            class="h-10 flex items-center px-3 sm:px-5 bg-gray-950 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl shadow-lg border border-transparent dark:border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-[0.625rem] sm:text-sm uppercase tracking-widest"
          >
            Export
            <span class="hidden sm:inline">Palette</span>
          </button>
        </div>
      </nav>

      <!-- Visual Feedback Bar (Nested in Header) -->
      <PreviewArea />
    </header>

    <!-- Main Configuration Steps -->
    <main
      class="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-10"
    >
      <SectionWrapper title="Step 1: Set Hue (H)">
        <HueInput />
      </SectionWrapper>

      <SectionWrapper title="Step 2: Set L Sequence">
        <LightnessSequence />
      </SectionWrapper>

      <SectionWrapper title="Step 3: Setup C Curve">
        <ChromaCurve />
      </SectionWrapper>

      <SectionWrapper title="Step 4: Gamut Optimization">
        <GamutOptimization />
      </SectionWrapper>
    </main>

    <!-- Modal Overlay -->
    <div
      v-if="isExportModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center sm:p-6 bg-black/60 backdrop-blur-md"
      @click.self="isExportModalOpen = false"
    >
      <div
        class="w-full max-w-3xl h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up sm:rounded-3xl shadow-2xl bg-white dark:bg-gray-950"
      >
        <ExportPanel @close="isExportModalOpen = false" />
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
}

/* 
  Global Premium Animations 
  Centralized here to avoid duplication in components
*/

/* 1. Pop In/Out Transition (for button content swaps) */
.pop-content-enter-active {
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-content-leave-active {
  animation: pop-out 0.2s ease-in forwards;
}

@keyframes pop-in {
  from {
    transform: translateY(10px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
@keyframes pop-out {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(-10px) scale(0.9);
    opacity: 0;
  }
}

.pop-content-enter-active {
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-content-leave-active {
  animation: pop-out 0.2s ease-in;
}

/* 2. Feedback Countdown Bar (for copy/reset confirmation) */
.countdown-bar {
  width: 100%;
  animation: countdown 2.5s linear forwards;
}

@keyframes countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 3. Hover Shimmer Effect */
@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
.animate-shimmer {
  animation: shimmer 1s infinite;
}

/* 4. Success State Pulse */
@keyframes pulse-success {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}
.animate-pulse-success {
  animation: pulse-success 2s infinite ease-in-out;
}

/* 5. Fade In Up (Generic Layout) */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.25s ease-out forwards;
}

/* Custom Selection for Gradient Text (Clipped text) */
h1 span::selection {
  background-color: #3b82f6;
  color: white;
  -webkit-text-fill-color: white;
}

/* Custom Premium Scrollbar - Global Application */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  border: 1px solid transparent;
  background-clip: content-box;
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
  background-clip: content-box;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
  background-clip: content-box;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

.dark .custom-scrollbar {
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

/* Scrollbar Hide Utility */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
