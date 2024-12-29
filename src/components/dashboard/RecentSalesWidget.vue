<script setup>
import { ProductService } from "@/service/ProductService";
import { onMounted, ref } from "vue";

const products = ref(null);

onMounted(() => {
    ProductService.getProductsSmall().then((data) => (products.value = data));
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Recent Sales</div>
        <DataTable
            :value="products"
            :rows="5"
            :paginator="true"
            responsiveLayout="scroll"
        >
            <Column
                field="name"
                header="Name"
                :sortable="true"
                style="width: 35%"
            ></Column>
            <Column
                field="price"
                header="Price"
                :sortable="true"
                style="width: 35%"
            >
                <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.price) }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>
