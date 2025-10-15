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

const openGoogleReviews = () => {
    // Opens the actual Woodland Suites Google Maps reviews page
    window.open('https://www.google.com/maps/place/Woodland+Suites/@8.2304465,124.2380444,17z/data=!4m8!3m7!1s0x3255758d3ab4ab77:0xf498dd27637f6b05!8m2!3d8.2304465!4d124.2406193!9m1!1b1!16s%2Fg%2F11h4kh6qdb?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D', '_blank');
};
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
        <!-- Floating Review Button -->
        <div class="fixed bottom-6 right-6 z-50">
            <Button 
                icon="pi pi-star"
                class="p-button-rounded p-button-lg bg-red-500 hover:bg-red-600 border-0 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 animate-float animate-pulse-glow"
                @click="openGoogleReviews"
                v-tooltip.left="'Write a Google Review'"
            />
        </div>
    </div>
</template>
<style>

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 20px #EA4B1F;
    }
    50% {
        box-shadow: 0 0 30px #F76E18;
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
}
</style>
