import { reactive, computed } from "vue";

const state = reactive({
  user: null,
});

export function useCurrentUser() {
  const setUser = (user) => {
    state.user = user ? { ...user } : null;
  };
  const updatePartial = (patch) => {
    state.user = { ...(state.user || {}), ...(patch || {}) };
  };

  return {
    user: computed(() => state.user || { name: "", email: "", role: "", image_url: "" }),
    setUser,
    updatePartial,
  };
}

