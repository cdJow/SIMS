<script setup>
import WebsiteFooter from "@/components/website/WebsiteFooter.vue";
import WebsiteSidebar from "@/components/website/WebsiteSidebar.vue";
import WebsiteTopbar from "@/components/website/WebsiteTopbar.vue";
import { useLayout } from "@/layout/composables/layout";
import { computed, ref, watch } from "vue";

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref(null);

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        "layout-overlay": layoutConfig.menuMode === "overlay",
        "layout-static": layoutConfig.menuMode === "static",
        "layout-static-inactive":
            layoutState.staticMenuDesktopInactive &&
            layoutConfig.menuMode === "static",
        "layout-overlay-active": layoutState.overlayMenuActive,
        "layout-mobile-active": layoutState.staticMenuMobileActive,
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
            }
        };
        document.addEventListener("click", outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener("click", outsideClickListener);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector(".layout-sidebar");
    const topbarEl = document.querySelector(".layout-menu-button");

    return !(
        sidebarEl.isSameNode(event.target) ||
        sidebarEl.contains(event.target) ||
        topbarEl.isSameNode(event.target) ||
        topbarEl.contains(event.target)
    );
}
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <WebsiteTopbar />
        <WebsiteSidebar />
        <div>
            <div class="layout-main-container">
                <div>
                    <router-view></router-view>
                </div>
                <div>
                    <WebsiteFooter />
                </div>
            </div>
        </div>
    </div>
</template>
