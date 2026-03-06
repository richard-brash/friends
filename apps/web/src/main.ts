import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { loadCurrentUser } from "./stores/user";
import "./style.css";

async function bootstrap(): Promise<void> {
	try {
		await loadCurrentUser();
	} catch (error) {
		console.error("Failed to load current user", error);
	}

	createApp(App).use(router).mount("#app");
}

void bootstrap();
