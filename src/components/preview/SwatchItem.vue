<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  swatch: {
    label: string;
    l: number;
    c: number;
    h: number;
    oklch: string;
    hex: string;
    inSRGB: boolean;
    inP3: boolean;
    inRec2020: boolean;
  };
  isCopied: boolean;
  hasHueShift: boolean;
  hueShiftDelta?: number;
  contrastLc?: number;
}>();

const emit = defineEmits<{
  (e: "copy", text: string): void;
}>();

const gamutInfo = computed(() => {
  if (!props.swatch.inRec2020)
    return { text: "OUT", class: "bg-red-600 text-white shadow-lg" };
  if (!props.swatch.inP3)
    return { text: "2020", class: "bg-emerald-600 text-white shadow-md" };
  if (!props.swatch.inSRGB)
    return { text: "P3", class: "bg-indigo-600 text-white shadow-sm" };
  return null;
});

const gamutTooltip = computed(() => {
  if (!props.swatch.inRec2020) return "Outside Rec.2020 (Extreme gamut)";
  if (!props.swatch.inP3) return "Rec.2020 range (Pro HDR displays)";
  if (!props.swatch.inSRGB) return "Display P3 range (Wide gamut screens)";
  return "sRGB Safe (Standard)";
});

const textColorClass = computed(() => {
  return props.swatch.l > 0.55
    ? "text-gray-950"
    : "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]";
});

/** Lc badge color: green ≥60, yellow ≥40, red <40 */
const lcBadgeClass = computed(() => {
  const lc = props.contrastLc ?? 0;
  if (lc >= 60) return "bg-emerald-500/90 text-white backdrop-blur-md";
  if (lc >= 40) return "bg-amber-400/90 text-amber-950 backdrop-blur-md";
  return "bg-rose-500/90 text-white backdrop-blur-md";
});
</script>

<template>
  <div
    class="flex-1 min-w-[4.5rem] sm:min-w-0 flex flex-col justify-end items-center relative transition-all p-3 group/swatch border-x border-black/5 dark:border-white/5 first:border-l-0 last:border-r-0 overflow-hidden"
    :style="{ backgroundColor: swatch.oklch }"
  >
    <!-- Drawer Overlay (Slides up on hover) -->
    <div
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm translate-y-full group-hover/swatch:translate-y-0 transition-transform duration-300 pointer-events-none group-hover/swatch:pointer-events-auto"
      :class="{ '!translate-y-full !pointer-events-none': isCopied }"
    >
      <button
        @click.stop="emit('copy', swatch.hex)"
        class="w-16 py-1.5 bg-white/90 hover:bg-white text-black text-[0.625rem] font-bold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        HEX
      </button>
      <button
        @click.stop="emit('copy', swatch.oklch)"
        class="w-16 py-1.5 bg-white/90 hover:bg-white text-black text-[0.625rem] font-bold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        OKLCH
      </button>
    </div>

    <!-- APCA Lc Badge (top-left) -->
    <div
      v-if="contrastLc !== undefined"
      class="absolute top-2 left-2 h-5 min-w-[1.4rem] px-1.5 flex items-center justify-center rounded-md shadow-sm border border-white/20 z-10 text-[0.5rem] font-black tracking-tighter leading-none transition-all"
      :class="lcBadgeClass"
      :title="`APCA Lc: ${contrastLc}`"
    >
      {{ contrastLc }}
    </div>

    <!-- Gamut Status Badge (top-right) -->
    <div
      v-if="gamutInfo"
      class="absolute top-2 right-2 h-5 min-w-[1.4rem] px-1.5 flex items-center justify-center rounded-md cursor-help shadow-sm border border-white/20 z-10 text-[0.5rem] font-black tracking-tighter leading-none transition-all"
      :class="gamutInfo.class"
      :title="gamutTooltip"
    >
      {{ gamutInfo.text }}
    </div>

    <!-- Hue Shift Warning -->
    <div
      v-if="hasHueShift"
      class="absolute top-2 left-2 text-[0.625rem] bg-white/90 dark:bg-black/80 border border-orange-500 text-orange-600 px-1 py-0.5 rounded-md cursor-help z-10 font-bold shadow-sm"
      :title="`Perceived Hue Shift: ${hueShiftDelta}°. Correction recommended.`"
    >
      ⚠️
    </div>

    <!-- Swatch Label -->
    <div
      class="text-[0.6875rem] font-black transition-colors select-none text-center tracking-tight uppercase"
      :class="textColorClass"
    >
      {{ isCopied ? "✓ Copied" : swatch.label }}
    </div>

    <!-- Hover overlay -->
    <div
      class="absolute inset-0 bg-white/5 opacity-0 group-hover/swatch:opacity-100 pointer-events-none transition-opacity"
    ></div>
  </div>
</template>
