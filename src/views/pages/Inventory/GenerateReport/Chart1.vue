<script setup>
import { useLayout } from "@/layout/composables/layout";
import { onMounted, ref, watch, computed } from "vue";
import { InventoryService } from "@/service/InventoryService";
import { useToast } from "primevue/usetoast";

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const pieData = ref(null);
const pieOptions = ref(null);
const loading = ref(true);
const error = ref(null);
const toast = useToast();
const categoryDetails = ref([]);
const visibleCategories = ref([]);

// Define a set of colors for categories
const getColors = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    return {
        backgroundColors: [
            documentStyle.getPropertyValue("--p-indigo-500"),
            documentStyle.getPropertyValue("--p-purple-500"), 
            documentStyle.getPropertyValue("--p-teal-500"),
            documentStyle.getPropertyValue("--p-orange-500"),
            documentStyle.getPropertyValue("--p-green-500"),
            documentStyle.getPropertyValue("--p-red-500"),
            documentStyle.getPropertyValue("--p-blue-500"),
            documentStyle.getPropertyValue("--p-yellow-500"),
        ],
        hoverColors: [
            documentStyle.getPropertyValue("--p-indigo-400"),
            documentStyle.getPropertyValue("--p-purple-400"),
            documentStyle.getPropertyValue("--p-teal-400"),
            documentStyle.getPropertyValue("--p-orange-400"),
            documentStyle.getPropertyValue("--p-green-400"),
            documentStyle.getPropertyValue("--p-red-400"),
            documentStyle.getPropertyValue("--p-blue-400"),
            documentStyle.getPropertyValue("--p-yellow-400"),
        ]
    };
};

// Fetch real-time category data
async function fetchCategoryData() {
    try {
        loading.value = true;
        error.value = null;
        
        console.log('📊 Fetching category breakdown data...');
        const response = await InventoryService.getCategoryBreakdown();
        
        if (response.success && response.labels && response.data) {
            const colors = getColors();
            const numCategories = response.labels.length;
            
            pieData.value = {
                labels: response.labels,
                datasets: [
                    {
                        data: response.data,
                        backgroundColor: colors.backgroundColors.slice(0, numCategories),
                        hoverBackgroundColor: colors.hoverColors.slice(0, numCategories),
                    },
                ],
            };
            
            // Store detailed information
            categoryDetails.value = response.details || [];
            
            // Initialize all categories as visible
            visibleCategories.value = [...response.labels];
            
            toast.add({
                severity: 'success',
                summary: 'Data Updated',
                detail: `Category breakdown loaded with ${numCategories} categories`,
                life: 3000
            });
            
        } else {
            throw new Error('Invalid response format from server');
        }
        
    } catch (err) {
        console.error('❌ Error fetching category data:', err);
        error.value = err.message || 'Failed to load category data';
        
        // Set fallback data
        setFallbackData();
        
        toast.add({
            severity: 'error',
            summary: 'Error Loading Data',
            detail: error.value,
            life: 5000
        });
    } finally {
        loading.value = false;
    }
}

// Set fallback data when API fails
function setFallbackData() {
    const colors = getColors();
    
    pieData.value = {
        labels: ["Consumable", "Non-Consumable", "Rental"],
        datasets: [
            {
                data: [540, 325, 702],
                backgroundColor: colors.backgroundColors.slice(0, 3),
                hoverBackgroundColor: colors.hoverColors.slice(0, 3),
            },
        ],
    };
    
    categoryDetails.value = [
        { category: "Consumable", item_count: 45, total_quantity: 540 },
        { category: "Non-Consumable", item_count: 28, total_quantity: 325 },
        { category: "Rental", item_count: 52, total_quantity: 702 }
    ];
    
    // Initialize all categories as visible
    visibleCategories.value = ["Consumable", "Non-Consumable", "Rental"];
}

// Computed property to filter visible category details
const visibleCategoryDetails = computed(() => {
    return categoryDetails.value.filter(detail => 
        visibleCategories.value.includes(detail.category)
    );
});

// Get icon for category
function getCategoryIcon(category) {
    const icons = {
        'Consumable': 'pi-shopping-cart',
        'Non-Consumable': 'pi-box',
        'Rental': 'pi-calendar'
    };
    return icons[category] || 'pi-tag';
}

// Get color for category
function getCategoryColor(category) {
    const colors = {
        'Consumable': 'text-indigo-600',
        'Non-Consumable': 'text-purple-600',
        'Rental': 'text-teal-600'
    };
    return colors[category] || 'text-gray-600';
}

// Get background color for category
function getCategoryBgColor(category) {
    const bgColors = {
        'Consumable': 'bg-indigo-100 dark:bg-indigo-500/10',
        'Non-Consumable': 'bg-purple-100 dark:bg-purple-500/10',
        'Rental': 'bg-teal-100 dark:bg-teal-500/10'
    };
    return bgColors[category] || 'bg-gray-100 dark:bg-gray-500/10';
}

function setColorOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue("--text-color");

    pieOptions.value = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: textColor,
                    font: {
                        size: 12
                    },
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            const meta = chart.getDatasetMeta(0);
                            return data.labels.map((label, i) => {
                                const hidden = meta.data[i].hidden;
                                return {
                                    text: label,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                    lineWidth: 0,
                                    hidden: hidden,
                                    index: i,
                                    // Add strikethrough when hidden
                                    fontColor: hidden ? textColor + '80' : textColor,
                                    textDecoration: hidden ? 'line-through' : ''
                                };
                            });
                        }
                        return [];
                    }
                },
                position: 'bottom',
                onClick: (e, legendItem, legend) => {
                    // Default chart.js legend click behavior
                    const index = legendItem.index;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(0);
                    
                    // Toggle the data visibility
                    meta.data[index].hidden = !meta.data[index].hidden;
                    chart.update();
                    
                    // Update visible categories for detail cards
                    updateVisibleCategories(chart);
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} items (${percentage}%)`;
                    }
                }
            }
        },
    };
}

// Update visible categories based on chart legend state
function updateVisibleCategories(chart) {
    const meta = chart.getDatasetMeta(0);
    const labels = chart.data.labels;
    
    visibleCategories.value = labels.filter((label, index) => {
        return !meta.data[index].hidden;
    });
}

// Refresh data function
const refreshData = () => {
    fetchCategoryData();
};

onMounted(() => {
    setColorOptions();
    fetchCategoryData();
});

watch(
    [getPrimary, getSurface, isDarkTheme],
    () => {
        setColorOptions();
    },
    { immediate: true },
);
</script>

<template>
    <div class="w-full">
        <div class="card">
            <!-- Header with Icon and Refresh Button -->
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <i class="pi pi-chart-pie text-xl text-blue-600"></i>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Category Breakdown</h2>
                </div>
                <Button
                    icon="pi pi-refresh"
                    @click="refreshData"
                    :loading="loading"
                    severity="secondary"
                    outlined
                    size="small"
                    class="px-3 py-1"
                    v-tooltip="'Refresh data'"
                />
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-12">
                <ProgressSpinner strokeWidth="3" class="mb-4" animationDuration="1s" />
                <p class="text-gray-600 dark:text-gray-400 text-sm">Loading category data...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full text-center">
                    <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 text-2xl mb-3"></i>
                    <h4 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error Loading Data</h4>
                    <p class="text-red-700 dark:text-red-300 mb-4 text-sm">{{ error }}</p>
                    <Button
                        icon="pi pi-refresh"
                        label="Try Again"
                        @click="refreshData"
                        severity="danger"
                        outlined
                        size="small"
                    />
                </div>
            </div>

            <!-- Chart Display -->
            <div v-else>
                <div class="flex justify-center mb-6">
                    <div class="w-full max-w-lg">
                        <Chart 
                            type="pie" 
                            :data="pieData" 
                            :options="pieOptions"
                            class="w-full h-80"
                        />
                    </div>
                </div>
            
                
                <!-- Category Details Cards Inside -->
                <div v-if="visibleCategoryDetails.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        v-for="(detail, index) in visibleCategoryDetails" 
                        :key="index"
                        class="p-6 border border-gray-200 dark:border-gray-700 rounded-lg transition-all"
                    >
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {{ detail.category }}
                                </h3>
                                
                            </div>
                            <div 
                                :class="[
                                    'w-12 h-12 rounded-lg flex items-center justify-center',
                                    getCategoryBgColor(detail.category)
                                ]"
                            >
                                <i 
                                    :class="[
                                        'pi text-xl',
                                        getCategoryIcon(detail.category),
                                        getCategoryColor(detail.category)
                                    ]"
                                ></i>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <!-- Total Quantity -->
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Total Quantity:</span>
                                <span class="text-2xl font-bold text-gray-900 dark:text-white">
                                    {{ detail.total_quantity.toLocaleString() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Toast for notifications --></div>
</template>
