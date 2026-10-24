import { timingSafeEqual } from "node:crypto";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const developmentAdminAuth = (mode: string): Plugin => ({
  name: "development-admin-auth",
  configureServer(server) {
    if (mode !== "development") return;
    const password = loadEnv(mode, process.cwd(), "").ADMIN_PASSWORD;
    server.middlewares.use("/__admin/auth", (request, response) => {
      response.setHeader("Cache-Control", "no-store");
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.setHeader("Allow", "POST");
        response.end();
        return;
      }
      if (!password) {
        response.statusCode = 503;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            error: "Налаштуйте ADMIN_PASSWORD у .env.development.local.",
          }),
        );
        return;
      }
      let body = "";
      let bodySize = 0;
      let tooLarge = false;
      request.on("data", (chunk: Buffer | string) => {
        if (tooLarge) return;
        const text = chunk.toString();
        bodySize += Buffer.byteLength(text);
        if (bodySize > 4096) {
          tooLarge = true;
          return;
        }
        body += text;
      });
      request.on("end", () => {
        if (tooLarge) {
          response.statusCode = 413;
          response.end();
          return;
        }
        let submittedPassword = "";
        try {
          const payload: unknown = JSON.parse(body);
          if (
            payload &&
            typeof payload === "object" &&
            "password" in payload &&
            typeof payload.password === "string"
          ) {
            submittedPassword = payload.password;
          }
        } catch {
          response.statusCode = 400;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: "Некоректний запит." }));
          return;
        }
        const expected = Buffer.from(password);
        const actual = Buffer.from(submittedPassword);
        const matches =
          expected.length === actual.length &&
          timingSafeEqual(expected, actual);
        response.statusCode = matches ? 200 : 401;
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify(
            matches
              ? { authenticated: true }
              : { error: "Неправильний пароль." },
          ),
        );
      });
      request.on("error", (error) => {
        console.error("Could not read the development admin login request.", error);
        if (!response.headersSent) {
          response.statusCode = 400;
          response.end();
        }
      });
    });
  },
});

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  optimizeDeps: { exclude: ["maplibre-gl"] },
  plugins: [react(), tailwindcss(), developmentAdminAuth(mode)],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/maplibre-gl/")) return "maplibre";
          if (id.includes("/node_modules/three/")) return "three";
          if (id.includes("/node_modules/@radix-ui/")) return "ui-vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
}));
