<script setup>
import { useLayout } from "@/layout/composables/layout";
import { onMounted, ref, watch } from "vue";

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const lineData = ref(null);
const lineOptions = ref(null);

onMounted(() => {
    setColorOptions();
});

function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color");
    const textColorSecondary = documentStyle.getPropertyValue(
        "--text-color-secondary",
    );
    const surfaceBorder = documentStyle.getPropertyValue("--surface-border");

    lineData.value = {
        labels: [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
        ],
        datasets: [
            {
                label: "Room Revenue",
                data: [1200, 1900, 1700, 2500, 3000, 4000, 4500], // Sample room revenue data
                fill: false,
                backgroundColor:
                    documentStyle.getPropertyValue("--p-primary-500"),
                borderColor: documentStyle.getPropertyValue("--p-primary-500"),
                tension: 0.4,
            },
            {
                label: "Products Revenue",
                data: [800, 950, 1100, 1300, 1600, 2000, 2400], // Sample service revenue data
                fill: false,
                backgroundColor:
                    documentStyle.getPropertyValue("--p-primary-200"),
                borderColor: documentStyle.getPropertyValue("--p-primary-200"),
                tension: 0.4,
            },
        ],
    };

    lineOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: {
                        size: 14,
                    },
                },
            },
            title: {
                display: true,
                text: "Monthly Revenue Metrics",
                color: textColor,
                font: {
                    size: 18,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false,
                },
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false,
                },
                title: {
                    display: true,
                    text: "Revenue (USD)",
                    color: textColorSecondary,
                    font: {
                        size: 14,
                    },
                },
            },
        },
    };
}

watch(
    [getPrimary, getSurface, isDarkTheme],
    () => {
        setColorOptions();
    },
    { immediate: true },
);
</script>
<template>
    <Fluid>
        <div>
            <div class="card">
                <div class="font-semibold text-xl mb-4">Revenue Metrics</div>
                <Chart
                    type="line"
                    :data="lineData"
                    :options="lineOptions"
                    style="height: 280px; width: 100%"
                ></Chart>
            </div>
        </div>
    </Fluid>
</template>
