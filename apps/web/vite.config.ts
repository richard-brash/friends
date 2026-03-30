import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import pkg from "./package.json";

let gitCommit = "unknown";
try {
  gitCommit = execSync("git rev-parse HEAD").toString().trim();
} catch {
  // git not available or not a git repo
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(gitCommit),
  },
});
