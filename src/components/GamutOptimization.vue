<script setup lang="ts">
import { useColorStore } from "../store/colorStore";

const store = useColorStore();

const options = [
  { 
    value: "none", 
    label: "None", 
    desc: "Full OKLCH Gamut", 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>` 
  },
  { 
    value: "srgb", 
    label: "sRGB", 
    desc: "Standard Web Gamut", 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>` 
  },
  { 
    value: "p3", 
    label: "Display P3", 
    desc: "Wide Gamut (DCI-P3)", 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>` 
  },
  { 
    value: "rec2020", 
    label: "Rec.2020", 
    desc: "Ultra-HD Wide Gamut", 
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-2 2-1.5-1.5"></path><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"></path><path d="M12 8a4 4 0 1 1-4 4"></path><path d="M12 12c-1 0-4-.5-4-4"></path></svg>` 
  },
] as const;
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m16 10-4 4-4-4"></path>
        </svg>
      </div>
      <div>
        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100">Gamut Constraint</h3>
        <p class="text-[0.6875rem] text-gray-500 dark:text-gray-400">
          Clamps colors to stay within the selected color space.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <button
        v-for="opt in options"
        :key="opt.value"
        @click="store.config.gamut = opt.value"
        class="flex flex-col items-start p-3 sm:p-4 rounded-2xl border transition-all duration-300 relative group text-left"
        :class="[
          store.config.gamut === opt.value
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-4 ring-blue-500/10 shadow-sm shadow-blue-500/10'
            : 'bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md'
        ]"
      >
        <div class="flex items-center justify-between w-full mb-3">
          <div 
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm"
            :class="[
               store.config.gamut === opt.value 
                ? 'bg-blue-600 text-white rotate-3 scale-110' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:scale-105 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-blue-500'
            ]"
            v-html="opt.icon"
          ></div>
          <transition name="pop-in">
            <div v-if="store.config.gamut === opt.value" class="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </transition>
        </div>
        
        <div class="font-black text-xs sm:text-sm uppercase tracking-wider transition-colors"
             :class="store.config.gamut === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'">
          {{ opt.label }}
        </div>
        <div class="text-[0.625rem] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
          {{ opt.desc }}
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pop-in-enter-active {
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
