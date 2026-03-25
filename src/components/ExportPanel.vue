<script setup lang="ts">
import { ref, computed } from "vue";
import { useColorStore } from "../store/colorStore";
import { useClipboard, useLocalStorage } from "@vueuse/core";
import hljs from "highlight.js/lib/core";
import cssLang from "highlight.js/lib/languages/css";
import jsonLang from "highlight.js/lib/languages/json";

// Register only needed languages to keep it lightweight
hljs.registerLanguage("css", cssLang);
hljs.registerLanguage("json", jsonLang);

const store = useColorStore();
const { copy } = useClipboard();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const currentTab = useLocalStorage<"css" | "json">("oklch-sg-export-tab", "css");
const isCodeCopied = ref(false);
const isLinkCopied = ref(false);
let codeTimer: any = null;
let linkTimer: any = null;

/**
 * CSS Variables Generation
 */
const cssOutput = computed(() => {
  const pfx = store.config.varPrefix || "color";
  let lines = [":root {"];
  if (store.config.useDynamicHue) {
    lines.push(`  --hue: ${store.config.h};`);
  }
  store.computedSwatches.forEach((s) => {
    let val = s.oklch;
    if (store.config.useDynamicHue) {
      val = `oklch(${s.l.toFixed(3)} ${s.c.toFixed(3)} var(--hue))`;
    }
    lines.push(`  --${pfx}-${s.label}: ${val};`);
  });
  lines.push("}");
  return lines.join("\n");
});

/**
 * JSON (DTCG) Generation
 */
const jsonOutput = computed(() => {
  const pfx = store.config.varPrefix || "color";
  const obj: any = { color: { [pfx]: {} } };
  store.computedSwatches.forEach((s) => {
    obj.color[pfx][s.label] = { $type: "color", $value: s.oklch };
  });
  return JSON.stringify(obj, null, 2);
});

const rawOutput = computed(() => (currentTab.value === "css" ? cssOutput.value : jsonOutput.value));

/**
 * Syntax Highlighting
 */
const formattedCode = computed(() => {
  return hljs.highlight(rawOutput.value, {
    language: currentTab.value === "css" ? "css" : "json",
  }).value;
});

/**
 * Copy functions with feedback
 */
async function copyCode() {
  if (codeTimer) clearTimeout(codeTimer);
  await copy(rawOutput.value);
  isCodeCopied.value = true;
  codeTimer = setTimeout(() => {
    isCodeCopied.value = false;
    codeTimer = null;
  }, 2500);
}

async function copyShareLink() {
  if (linkTimer) clearTimeout(linkTimer);
  // Ensure we stringify the underlying value
  const json = JSON.stringify(store.config);
  const b64 = btoa(encodeURIComponent(json));
  const url = new URL(window.location.href);
  url.searchParams.set("q", b64);
  await copy(url.toString());
  isLinkCopied.value = true;
  linkTimer = setTimeout(() => {
    isLinkCopied.value = false;
    linkTimer = null;
  }, 2500);
}
</script>

<template>
  <div
    class="flex flex-col h-full sm:h-[80vh] sm:max-h-[850px] sm:min-h-[550px] bg-white dark:bg-[#0f1117] border-gray-200 dark:border-gray-800/60 sm:rounded-3xl overflow-hidden shadow-2xl relative w-full pointer-events-auto ring-1 ring-black/5 dark:ring-white/10"
  >
    <!-- Header -->
    <header
      class="h-14 sm:h-16 px-4 sm:px-8 border-b border-gray-100 dark:border-gray-800/50 flex justify-between items-center bg-white/80 dark:bg-[#161923]/80 backdrop-blur-xl z-20 shrink-0"
    >
      <div class="flex items-center gap-2 sm:gap-3">
        <h2
          class="text-[0.75rem] sm:text-base font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest"
        >
          Export Palette
        </h2>
      </div>
      <button
        @click="emit('close')"
        class="group/close w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="opacity-80 group-hover/close:rotate-90 group-hover/close:opacity-100 transition-all duration-300 ease-out sm:w-5 sm:h-5"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>

    <!-- Toolbar Area -->
    <div
      class="px-6 py-4 sm:px-8 sm:py-6 bg-white dark:bg-[#161923]/50 border-b border-gray-100 dark:border-gray-800/50 shrink-0 z-10 w-full overflow-hidden"
    >
      <div class="flex flex-col gap-6">
        <!-- Top: Format Switcher & Actions -->
        <!-- Top: Format Switcher & Actions -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-6"
        >
          <!-- Format Switcher -->
          <div
            class="flex items-center justify-between sm:justify-start w-full sm:w-auto shrink-0 py-1 min-h-[40px]"
          >
            <div
              class="p-1 bg-gray-100/80 dark:bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex gap-1 w-full sm:w-fit shadow-inner h-9 sm:h-auto"
            >
              <button
                @click="currentTab = 'css'"
                class="flex-1 sm:px-8 py-1.5 rounded-md sm:rounded-lg text-[0.6875rem] font-black transition-all duration-300 uppercase tracking-widest"
                :class="
                  currentTab === 'css'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                "
              >
                CSS
              </button>
              <button
                @click="currentTab = 'json'"
                class="flex-1 sm:px-8 py-1.5 rounded-md sm:rounded-lg text-[0.6875rem] font-black transition-all duration-300 uppercase tracking-widest"
                :class="
                  currentTab === 'json'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                "
              >
                JSON
              </button>
            </div>
          </div>

          <!-- Quick Actions -->
          <div
            class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto h-10 shrink-0"
          >
            <button
              @click="copyShareLink"
              class="relative group h-full px-4 min-w-[120px] sm:min-w-[130px] overflow-hidden rounded-xl border transition-all duration-300 active:scale-95 shadow-sm"
              :class="
                isLinkCopied
                  ? 'bg-green-600 border-green-500 text-white animate-pulse-success'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500'
              "
            >
              <div class="relative w-full h-full flex items-center justify-center gap-2">
                <transition name="pop-content" mode="out-in">
                  <div
                    v-if="isLinkCopied"
                    key="copied"
                    class="flex items-center gap-1.5 font-bold text-[0.625rem] uppercase tracking-wider"
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
                    <span>Saved</span>
                  </div>
                  <div
                    v-else
                    key="copy"
                    class="flex items-center gap-1.5 font-bold text-[0.625rem] uppercase tracking-wider"
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
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>Share</span>
                  </div>
                </transition>
              </div>
            </button>

            <button
              @click="copyCode"
              class="relative group h-full px-4 min-w-[140px] sm:min-w-[150px] overflow-hidden rounded-xl border transition-all duration-300 active:scale-95 shadow-lg"
              :class="
                isCodeCopied
                  ? 'bg-green-600 border-green-500 text-white animate-pulse-success'
                  : 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
              "
            >
              <div
                class="relative w-full h-full flex items-center justify-center gap-2 font-bold text-[0.625rem] uppercase tracking-wider"
              >
                <transition name="pop-content" mode="out-in">
                  <div v-if="isCodeCopied" key="copied" class="flex items-center gap-1.5">
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
                    <span>Copied</span>
                  </div>
                  <div v-else key="copy" class="flex items-center gap-1.5">
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Code</span>
                  </div>
                </transition>
              </div>
            </button>
          </div>
        </div>

        <!-- Bottom: Settings Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start p-6 bg-gray-50/50 dark:bg-[#1f2330]/30 rounded-2xl border border-gray-100 dark:border-gray-800/40"
        >
          <!-- Prefix Input -->
          <div class="flex flex-col gap-3">
            <label
              class="block text-[0.625rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] h-4"
              >Variable Prefix</label
            >
            <div class="relative group mt-1">
              <span
                class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs select-none"
                >--</span
              >
              <input
                type="text"
                v-model="store.config.varPrefix"
                class="w-full bg-white dark:bg-[#161923] text-gray-950 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-8 pr-4 text-xs font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                placeholder="color"
              />
            </div>
          </div>

          <!-- Dynamic Hue Toggle (Only for CSS) -->
          <div v-if="currentTab === 'css'" class="flex flex-col gap-3">
            <label
              class="block text-[0.625rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] h-4"
              >Dynamic Hue</label
            >
            <div class="mt-1 flex items-center h-[42px]">
              <label class="flex items-center gap-4 cursor-pointer group select-none">
                <div class="relative flex items-center">
                  <input type="checkbox" v-model="store.config.useDynamicHue" class="sr-only" />
                  <div
                    class="w-11 h-6.5 rounded-full transition-all duration-300 shadow-inner"
                    :class="
                      store.config.useDynamicHue
                        ? 'bg-blue-600 dark:bg-blue-500 shadow-blue-900/10'
                        : 'bg-gray-200 dark:bg-gray-800 shadow-black/5'
                    "
                  ></div>
                  <div
                    class="absolute left-1 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-all duration-300"
                    :class="{ 'translate-x-4.5': store.config.useDynamicHue }"
                  ></div>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span
                    class="text-[0.625rem] font-black uppercase tracking-wider transition-colors duration-300"
                    :class="
                      store.config.useDynamicHue
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100'
                    "
                    >Enable var(--hue)</span
                  >
                  <span
                    class="text-[0.5625rem] text-gray-400 dark:text-gray-600 font-bold whitespace-nowrap"
                    >Injects runtime variable</span
                  >
                </div>
              </label>
            </div>
          </div>

          <!-- JSON Format Hint (Only for JSON) -->
          <div v-if="currentTab === 'json'" class="flex flex-col gap-3">
            <label
              class="block text-[0.625rem] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] h-4"
              >Token Format</label
            >
            <div class="mt-1 flex items-center h-[42px] gap-3">
              <div
                class="bg-blue-600/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 text-[0.625rem] font-black px-2 py-1 rounded-md border border-blue-600/20 dark:border-blue-400/20 uppercase tracking-tighter shadow-sm"
              >
                DTCG JSON
              </div>
              <span
                class="text-[0.5625rem] text-gray-400 dark:text-gray-600 font-bold whitespace-nowrap"
                >Design Tokens Community Group Standard</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Display -->
    <div
      class="flex-1 overflow-auto p-4 sm:p-8 bg-gray-50 dark:bg-[#0f1117] relative custom-scrollbar"
    >
      <div class="relative h-full">
        <pre
          class="m-0 absolute inset-0"
        ><code class="hljs-custom block w-full h-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800/60 rounded-xl sm:rounded-2xl p-4 sm:p-8 font-mono text-[0.6875rem] sm:text-sm leading-6 sm:leading-8 text-gray-800 dark:text-gray-100 shadow-xl overflow-auto whitespace-pre text-left" v-html="formattedCode"></code></pre>
      </div>
    </div>
  </div>
</template>

<style>
/* 
  Absolute guarantee for syntax colors
*/
.hljs-custom {
  --hc-keyword: #22863a;
  --hc-attr: #005cc5;
  --hc-string: #6f42c1;
  --hc-number: #e36209;
}

html.dark .hljs-custom {
  --hc-keyword: #85e89d;
  --hc-attr: #79b8ff;
  --hc-string: #b392f0;
  --hc-number: #ffab70;
}

.hljs-custom .hljs-selector-pseudo,
.hljs-custom .hljs-selector-tag {
  color: var(--hc-keyword) !important;
}

.hljs-custom .hljs-attribute,
.hljs-custom .hljs-attr {
  color: var(--hc-attr) !important;
}

.hljs-custom .hljs-string,
.hljs-custom .hljs-built_in {
  color: var(--hc-string) !important;
}

.hljs-custom .hljs-number {
  color: var(--hc-number) !important;
}
</style>
