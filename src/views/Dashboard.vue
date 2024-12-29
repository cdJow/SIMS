<script setup>
import BestSellingWidget from "@/components/dashboard/BestSellingWidget.vue";
import CanceledBooking from "@/components/dashboard/CanceledBooking.vue";
import Chart1Widgets from "@/components/dashboard/Chart1Widgets.vue";
import NotificationsWidget from "@/components/dashboard/NotificationsWidget.vue";
import RevenueStreamWidget from "@/components/dashboard/RevenueStreamWidget.vue";
import StatsWidget from "@/components/dashboard/StatsWidget.vue";
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <div class="col-span-12 xl:col-span-6">
            <Chart1Widgets class="mb-7" />
            <CanceledBooking />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div>

        <div class="col-span-12 xl:col-span-6"></div>
        <div class="col-span-12 xl:col-span-6">
            <BestSellingWidget />
        </div>
    </div>
</template>
