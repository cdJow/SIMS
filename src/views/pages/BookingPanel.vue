<script setup lang="ts">
import BookingKiosk from '@/components/landing/BookingKiosk.vue';

import TopbarBooking from '@/components/landing/TopbarBooking.vue';


</script>
<template>
    <div class="bg-surface-0 dark:bg-surface-900">
      <div id="home" class="landing-wrapper overflow-visible"> <!-- Ensure no conflicting overflow -->
        <!-- Sticky TopbarBooking Wrapper -->
        <div class="sticky top-0 z-10 py-6 px-6 mx-0 flex items-center justify-between relative bg-white dark:bg-gray-900 w-full">
          <TopbarBooking />
        </div>
        <BookingKiosk />
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
   
  }
  
  /* Ensure Wrapper does not have conflicting overflow */
  .landing-wrapper {
    overflow: visible; /* Allow sticky behavior */
  }
  </style>
  