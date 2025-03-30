import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// PrimeVue & Theme
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import Tooltip from "primevue/tooltip";

// Global Styles
import "@/assets/styles.scss";
import "@/assets/tailwind.css";

const app = createApp(App);

// PrimeVue Config
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: ".app-dark",
        },
    },
});

// Plugins & Directives
app.use(router);
app.use(ToastService);
app.use(ConfirmationService);
app.directive("tooltip", Tooltip);

app.mount("#app");
