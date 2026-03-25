<script setup lang="ts">
import { useDark, useToggle } from "@vueuse/core";

const isDark = useDark();
const toggleDark = useToggle(isDark);
</script>

<template>
  <button
    @click="toggleDark()"
    class="theme-toggle-btn h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm transition-all hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:bg-gray-950/50 dark:hover:bg-gray-900 group relative overflow-hidden"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
  >
    <!-- 
      HOVER WRAPPER 
      Handles micro-interactions (hover scale/rotate). 
      Decoupled from the swap transition.
    -->
    <div
      class="relative w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
    >
      <div
        class="w-full h-full transition-transform duration-300"
        :class="isDark ? 'group-hover:-rotate-12' : 'group-hover:rotate-12'"
      >
        <transition name="theme-swap" mode="out-in">
          <!-- Sun Icon -->
          <svg
            v-if="!isDark"
            key="sun"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-gray-700 w-full h-full"
          >
            <circle cx="12" cy="12" r="4.5" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            />
          </svg>

          <!-- Moon Icon -->
          <svg
            v-else
            key="moon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-amber-500 w-full h-full"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </transition>
      </div>
    </div>
  </button>
</template>

<style scoped>
.theme-toggle-btn:active {
  transform: scale(0.9);
}

.theme-toggle-btn:hover {
  border-color: rgba(59, 130, 246, 0.4);
}

/* 
  Theme Swap Animation 
  Uses scale and rotation to create a snappy 'Pop' transition
*/
.theme-swap-enter-active,
.theme-swap-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-swap-enter-from {
  opacity: 0;
  transform: scale(0.2) rotate(-120deg);
}

.theme-swap-leave-to {
  opacity: 0;
  transform: scale(0.2) rotate(120deg);
}

/* Ensure no default styles mess with centering */
svg {
  display: block;
}
</style>
