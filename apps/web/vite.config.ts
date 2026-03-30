import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "child_process";
import pkg from "./package.json";

function resolveCommitSha(): string {
  const fromEnv =
    process.env.RAILWAY_GIT_COMMIT_SHA
    || process.env.SOURCE_COMMIT
    || process.env.GITHUB_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA;

  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    // git metadata might not be available in remote build environments
    return "";
  }
}

const gitCommit = resolveCommitSha();

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(pkg.version),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(gitCommit),
  },
});
