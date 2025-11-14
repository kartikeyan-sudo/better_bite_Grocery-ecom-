// Fallback CommonJS Vite config without React Fast Refresh plugin
// React JSX will still be transformed by esbuild.
module.exports = {
  server: {
    port: 5174,
    strictPort: true
  }
}
