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

// PrimeVue Config with custom lighter charcoal theme
app.use(PrimeVue, {
    theme: {
        preset: {
            ...Aura,
            semantic: {
                ...Aura.semantic,
                primary: {
                    50: "#fafafa",   // Very light gray
                    100: "#f5f5f5",  // Light gray
                    200: "#eeeeee",  // Medium light gray
                    300: "#e0e0e0",  // Medium gray
                    400: "#bdbdbd",  // Medium dark gray
                    500: "#4a4c4e",  // Lighter charcoal (main color)
                    600: "#3f4142",  // Slightly darker
                    700: "#353637",  // Darker
                    800: "#2b2c2d",  // Very dark
                    900: "#1C1C1D",  // Your requested color
                    950: "#1a1b1c",  // Pure dark
                }
            }
        },
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
