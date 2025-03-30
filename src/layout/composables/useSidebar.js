// useSidebar.js (optional - only if still needed for UI state)
import { reactive, toRefs } from "vue";

export const useSidebar = () => {
    const sidebarState = reactive({
        isOpen: true,
    });

    const toggleSidebar = () => {
        sidebarState.isOpen = !sidebarState.isOpen;
    };

    return { ...toRefs(sidebarState), toggleSidebar };
};
