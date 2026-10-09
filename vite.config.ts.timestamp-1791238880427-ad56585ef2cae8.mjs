// vite.config.ts
import { defineConfig } from "file:///C:/Users/Admin/System%20Apps/CITEzen2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Admin/System%20Apps/CITEzen2/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    // Bind on all interfaces so LAN access works; pairs well with ngrok forwarding to localhost.
    host: true,
    port: 5173,
    // Vite blocks unknown Host headers; ngrok uses *.ngrok-free.dev / *.ngrok-free.app / *.ngrok.app
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.app"],
    // One ngrok URL: browser calls same-origin /api/*; Vite forwards to the API (avoids ERR_NGROK_334
    // from a second tunnel on the same free-tier dev hostname).
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pblxcXFxTeXN0ZW0gQXBwc1xcXFxDSVRFemVuMlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWRtaW5cXFxcU3lzdGVtIEFwcHNcXFxcQ0lURXplbjJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FkbWluL1N5c3RlbSUyMEFwcHMvQ0lURXplbjIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIC8vIEJpbmQgb24gYWxsIGludGVyZmFjZXMgc28gTEFOIGFjY2VzcyB3b3JrczsgcGFpcnMgd2VsbCB3aXRoIG5ncm9rIGZvcndhcmRpbmcgdG8gbG9jYWxob3N0LlxyXG4gICAgaG9zdDogdHJ1ZSxcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICAvLyBWaXRlIGJsb2NrcyB1bmtub3duIEhvc3QgaGVhZGVyczsgbmdyb2sgdXNlcyAqLm5ncm9rLWZyZWUuZGV2IC8gKi5uZ3Jvay1mcmVlLmFwcCAvICoubmdyb2suYXBwXHJcbiAgICBhbGxvd2VkSG9zdHM6IFsnLm5ncm9rLWZyZWUuZGV2JywgJy5uZ3Jvay1mcmVlLmFwcCcsICcubmdyb2suYXBwJ10sXHJcbiAgICAvLyBPbmUgbmdyb2sgVVJMOiBicm93c2VyIGNhbGxzIHNhbWUtb3JpZ2luIC9hcGkvKjsgVml0ZSBmb3J3YXJkcyB0byB0aGUgQVBJIChhdm9pZHMgRVJSX05HUk9LXzMzNFxyXG4gICAgLy8gZnJvbSBhIHNlY29uZCB0dW5uZWwgb24gdGhlIHNhbWUgZnJlZS10aWVyIGRldiBob3N0bmFtZSkuXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBwcmV2aWV3OiB7XHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLFNBQVMsb0JBQW9CO0FBQ3BVLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBO0FBQUEsSUFFTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUVOLGNBQWMsQ0FBQyxtQkFBbUIsbUJBQW1CLFlBQVk7QUFBQTtBQUFBO0FBQUEsSUFHakUsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
