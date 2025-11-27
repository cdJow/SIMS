<script setup>
import WebsiteFooter from "@/components/website/WebsiteFooter.vue";
import WebsiteSidebar from "@/components/website/WebsiteSidebar.vue";
import WebsiteTopbar from "@/components/website/WebsiteTopbar.vue";
import { useLayout } from "@/layout/composables/layout";
import { computed, ref, watch, onMounted, onUnmounted } from "vue";

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref(null);

// Google Review Reminder State
const showReviewReminder = ref(false);
let reminderInterval = null;
let autoCloseTimeout = null;

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

// Show review reminder
const showReminderPopup = () => {
    showReviewReminder.value = true;
    
    // Auto-close after 10 seconds (10000ms)
    autoCloseTimeout = setTimeout(() => {
        closeReviewReminder();
    }, 10000);
};

// Close review reminder
const closeReviewReminder = () => {
    showReviewReminder.value = false;
    if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
        autoCloseTimeout = null;
    }
};

// Handle review button click
const handleWriteReview = () => {
    closeReviewReminder();
    openGoogleReviews();
};

// Setup reminder on mount
onMounted(() => {
    // Show reminder every 5 minutes (300000ms)
    reminderInterval = setInterval(() => {
        showReminderPopup();
    }, 10000);
    
    // Show first reminder after 30 seconds
    setTimeout(() => {
        showReminderPopup();
    }, 20000);
});

// Cleanup on component unmount
onUnmounted(() => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    if (autoCloseTimeout) {
        clearTimeout(autoCloseTimeout);
    }
});
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

        <!-- Floating Google Review Reminder - Thinking Cloud -->
        <Transition name="slide-up">
            <div
                v-if="showReviewReminder"
                class="fixed bottom-20 right-6 z-50 animate-float-smooth"
            >
                <!-- Thinking Cloud Bubble -->
                <div class="relative max-w-xs bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-5 cardbubble">
                    <!-- Close Button -->
                    <button
                        @click="closeReviewReminder"
                        class="absolute top-2 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                    >
                        <i class="pi pi-times text-sm"></i>
                    </button>

                    <!-- Content -->
                    <div class="pr-4">
                        <!-- Title with Icon -->
                        <div class="flex items-center gap-2 mb-2">
                            <i class="pi pi-star-fill text-red-500 text-lg"></i>
                            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                                Rate Your Experience
                            </h3>
                        </div>

                        <!-- Message -->
                        <p class="text-gray-600 dark:text-gray-300 text-xs mb-3">
                            Share your feedback on Google!
                        </p>

                        <!-- Action Button -->
                       
                    </div>

                    <!-- Cloud Tail (Small circles) -->
                    <div class="absolute -bottom-3 right-8 w-4 h-4 bg-white dark:bg-gray-800 rounded-full shadow-lg"></div>
                    <div class="absolute -bottom-6 right-6 w-2.5 h-2.5 bg-white dark:bg-gray-800 rounded-full shadow-lg"></div>
                    <div class="absolute -bottom-8 right-5 w-1.5 h-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md"></div>
                </div>
            </div>
        </Transition>
    </div>
    
    <!-- Centralized Toast for Website Layout -->
    <Toast position="bottom-center" />
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

/* Slide up transition for review reminder */
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.slide-up-enter-from {
    opacity: 0;
    transform: translateY(100px) scale(0.8);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translateY(100px) scale(0.8);
}

/* Smooth floating animation for thought bubble */
@keyframes float-smooth {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-12px);
    }
}

.animate-float-smooth {
    animation: float-smooth 3s ease-in-out infinite;
}

/* Thinking cloud bubble styling */
.cardbubble {
    position: relative;
    border: 2px solid rgba(239, 68, 68, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.dark .cardbubble {
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border-color: rgba(239, 68, 68, 0.4);
}

.cardbubble::before {
    content: '';
    position: absolute;
    bottom: -2px;
    right: 7rem;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: none;
}
</style>
