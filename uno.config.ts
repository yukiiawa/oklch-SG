import {
  defineConfig,
  presetIcons,
  presetTypography,
  transformerDirectives,
  presetWind3,
} from "unocss";

export default defineConfig({
  presets: [presetWind3({ dark: "class" }), presetIcons(), presetTypography()],
  transformers: [transformerDirectives()],
  theme: {
    fontFamily: {
      sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },
});
