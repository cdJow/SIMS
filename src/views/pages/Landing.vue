<script setup lang="ts">
import FeaturesWidget from '@/components/landing/FeaturesWidget.vue';
import FooterWidget from '@/components/landing/FooterWidget.vue';
import HeroWidget from '@/components/landing/HeroWidget.vue';
import HighlightsWidget from '@/components/landing/HighlightsWidget.vue';
import PricingWidget from '@/components/landing/PricingWidget.vue';
import TopbarWidget from '@/components/landing/TopbarWidget.vue';
</script>

<template>
  <div class="bg-surface-0 dark:bg-surface-900">
    <div id="home" class="landing-wrapper overflow-visible"> <!-- Ensure no conflicting overflow -->
      <!-- Sticky TopbarWidget Wrapper -->
      <div class="sticky top-0 z-10 py-6 px-6 mx-0 flex items-center justify-between relative bg-white dark:bg-gray-900 w-full">
        <TopbarWidget />
      </div>
      <HeroWidget />
      <FeaturesWidget />
      <HighlightsWidget />
      <PricingWidget />
      <FooterWidget />
    </div>
  </div>
</template>

<style scoped>
/* Sticky Styles */
.sticky {
  position: sticky;
  top: 0;
  z-index: 10; /* Keeps it above other elements */
  background-color: #ffffff; /* Solid background for visibility */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Optional: shadow for better visibility */
  width: 100%; /* Ensure it stretches across the full width */
}

/* Ensure Wrapper does not have conflicting overflow */
.landing-wrapper {
  overflow: visible; /* Allow sticky behavior */
}
</style>

