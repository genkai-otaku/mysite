import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    watch: {
      ignored: ["**/.direnv/**", "**/.git/**"],
    },
  },
  plugins: [
    {
      name: "preload-engine",
      transformIndexHtml(html, ctx) {
        if (!ctx.bundle) return html;
        const engine = Object.keys(ctx.bundle).find(
          (k) => k.includes("engine") && k.endsWith(".js"),
        );
        if (!engine) return html;
        const href = engine.startsWith("/") ? engine : `/${engine}`;
        return html.replace(
          '<link rel="icon"',
          `<link rel="modulepreload" href="${href}" />\n    <link rel="icon"`,
        );
      },
    },
  ],
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
  },
});
