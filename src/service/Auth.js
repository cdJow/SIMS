import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null,
        isAuthenticated: false,
    }),
    actions: {
        async login(credentials) {
            // Mock API call
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (
                        credentials.email === "guest@hotel.com" &&
                        credentials.password === "password123"
                    ) {
                        this.user = { email: credentials.email };
                        this.isAuthenticated = true;
                        resolve();
                    } else {
                        reject(new Error("Invalid credentials"));
                    }
                }, 1000);
            });
        },
        logout() {
            this.user = null;
            this.isAuthenticated = false;
        },
    },
});
