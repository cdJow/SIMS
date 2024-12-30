<script setup>
import { CustomerService } from "@/service/CustomerService";
import { ProductService } from "@/service/ProductService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { onBeforeMount, ref } from "vue";

const customers1 = ref(null);
const customers2 = ref(null);
const customers3 = ref(null);
const filters1 = ref(null);
const loading1 = ref(null);
const balanceFrozen = ref(false);
const products = ref(null);

onBeforeMount(() => {
    ProductService.getProductsWithOrdersSmall().then(
        (data) => (products.value = data),
    );
    CustomerService.getCustomersLarge().then((data) => {
        customers1.value = data;
        loading1.value = false;
        customers1.value.forEach(
            (customer) => (customer.date = new Date(customer.date)),
        );
    });
    CustomerService.getCustomersLarge().then(
        (data) => (customers2.value = data),
    );
    CustomerService.getCustomersMedium().then(
        (data) => (customers3.value = data),
    );

    initFilters1();
});

function initFilters1() {
    filters1.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        "country.name": {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        representative: { value: null, matchMode: FilterMatchMode.IN },
        date: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
        },
        balance: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        status: {
            operator: FilterOperator.OR,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        activity: { value: [0, 100], matchMode: FilterMatchMode.BETWEEN },
        verified: { value: null, matchMode: FilterMatchMode.EQUALS },
    };
}

function formatCurrency(value) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Frozen Columns</div>
        <ToggleButton
            v-model="balanceFrozen"
            onIcon="pi pi-lock"
            offIcon="pi pi-lock-open"
            onLabel="Balance"
            offLabel="Balance"
        />

        <DataTable
            :value="customers2"
            scrollable
            scrollHeight="400px"
            class="mt-6"
        >
            <Column
                field="name"
                header="Name"
                style="min-width: 200px"
                frozen
                class="font-bold"
            ></Column>
            <Column field="id" header="Id" style="min-width: 100px"></Column>
            <Column
                field="name"
                header="Name"
                style="min-width: 200px"
            ></Column>
            <Column
                field="country.name"
                header="Country"
                style="min-width: 200px"
            ></Column>
            <Column
                field="date"
                header="Date"
                style="min-width: 200px"
            ></Column>
            <Column
                field="company"
                header="Company"
                style="min-width: 200px"
            ></Column>
            <Column
                field="status"
                header="Status"
                style="min-width: 200px"
            ></Column>
            <Column
                field="activity"
                header="Activity"
                style="min-width: 200px"
            ></Column>
            <Column
                field="representative.name"
                header="Representative"
                style="min-width: 200px"
            ></Column>
            <Column
                field="balance"
                header="Balance"
                style="min-width: 200px"
                alignFrozen="right"
                :frozen="balanceFrozen"
            >
                <template #body="{ data }">
                    <span class="font-bold">{{
                        formatCurrency(data.balance)
                    }}</span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}
</style>
