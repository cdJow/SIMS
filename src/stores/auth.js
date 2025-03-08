import { computed, reactive } from "vue";

const state = reactive({
    user: null,
    isAuthenticated: false,
});

export function useAuthStore() {
    const login = async (credentials) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (
                    credentials.email === "guest@hotel.com" &&
                    credentials.password === "password123"
                ) {
                    state.user = { email: credentials.email };
                    state.isAuthenticated = true;
                    resolve();
                } else {
                    reject(new Error("Invalid credentials"));
                }
            }, 1000);
        });
    };

    const logout = () => {
        state.user = null;
        state.isAuthenticated = false;
    };

    return {
        user: computed(() => state.user),
        isAuthenticated: computed(() => state.isAuthenticated),
        login,
        logout,
    };
}
