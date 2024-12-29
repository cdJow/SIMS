<script setup>
import { useLayout } from "@/layout/composables/layout";
import { onMounted, ref, watch } from "vue";

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const pieData = ref(null);
const pieOptions = ref(null);

onMounted(() => {
    setColorOptions();
});

function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color");

    pieData.value = {
        labels: ["Consumable", "Non-Consumable", "Rental"],
        datasets: [
            {
                data: [540, 325, 702],
                backgroundColor: [
                    documentStyle.getPropertyValue("--p-indigo-500"),
                    documentStyle.getPropertyValue("--p-purple-500"),
                    documentStyle.getPropertyValue("--p-teal-500"),
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue("--p-indigo-400"),
                    documentStyle.getPropertyValue("--p-purple-400"),
                    documentStyle.getPropertyValue("--p-teal-400"),
                ],
            },
        ],
    };

    pieOptions.value = {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: textColor,
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
        <div class="col-span-12 xl:col-span-6">
            <div class="card flex flex-col items-center">
                <div class="font-semibold text-xl mb-4">Category Breakdown</div>
                <Chart type="pie" :data="pieData" :options="pieOptions"></Chart>
            </div>
        </div>
    </Fluid>
</template>
