<script setup>
import BestSellingWidget from "@/components/dashboard/BestSellingWidget.vue";
import Chart1Widgets from "@/components/dashboard/Chart1Widgets.vue";
import RevenueStreamWidget from "@/components/dashboard/RevenueStreamWidget.vue";
import StatsWidget from "@/components/dashboard/StatsWidget.vue";
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Stats Widget -->
        <div class="col-span-12">
            <StatsWidget />
        </div>

        <!-- Left Section -->
        <div class="col-span-12 xl:col-span-6 space-y-6">
            <Chart1Widgets />
        </div>

        <!-- Right Section -->
        <div class="col-span-12 xl:col-span-6 space-y-6">
            <RevenueStreamWidget />
        </div>

        <!-- Best Selling Widget -->
        <div class="col-span-12">
            <BestSellingWidget />
        </div>
    </div>
</template>

<style scoped>
/* Ensure consistent spacing and responsiveness */
.grid {
    margin-top: 1rem;
}

.space-y-6 > *:not(:last-child) {
    margin-bottom: 1.5rem; /* Ensure proper spacing between stacked components */
}
</style>
