import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { initializeAuth } from "./stores/auth";
import "./style.css";

async function bootstrap(): Promise<void> {
	try {
		await initializeAuth();
	} catch (error) {
		console.error("Failed to initialize auth", error);
	}

	createApp(App).use(router).mount("#app");
}

void bootstrap();
