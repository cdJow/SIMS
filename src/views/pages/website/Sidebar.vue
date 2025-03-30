<script setup>
import { ref } from "vue";
import ProfileDetails from "./ProfileDetails.vue";
import ProfileLayout from "./ProfileLayout.vue";
import RoomCatalog from "./RoomCatalog.vue";
import TransactionHistory from "./TransactionHistory.vue";

defineProps(["routes"]);
const emit = defineEmits(["route-change"]);

const handleClick = (route) => {
    emit("route-change", route); // Emit the route object with `path` or `name`
};

// Composable sidebar logic
const useSidebar = () => {
    const user = ref({
        name: "John Doe",
        email: "john@woodland.com",
        avatar: "https://example.com/avatar.jpg",
    });

    const routes = ref([
        {
            name: "rooms",
            label: "Available Rooms",
            iconComponent: "RoomIcon",
            component: RoomCatalog,
        },
        {
            name: "transactions",
            label: "Transaction History",
            iconComponent: "TransactionIcon",
            component: TransactionHistory,
        },
    ]);

    const activeRoute = ref(routes.value[0]);

    const setActiveRoute = (route) => {
        activeRoute.value = route;
    };

    return {
        user,
        routes,
        activeRoute,
        setActiveRoute,
    };
};

const { user, routes, activeRoute, setActiveRoute } = useSidebar();
</script>

<!-- Sidebar.vue -->
<template>
    <div
        class="sidebar-container bg-white w-64 h-screen shadow-lg flex flex-col"
    >
        <!-- Profile Section -->
        <ProfileLayout>
            <template #profile-content>
                <ProfileDetails :user="user" />
            </template>
        </ProfileLayout>

        <!-- Navigation Routes -->
        <nav class="flex-1 overflow-y-auto p-4">
            <ul class="space-y-2">
                <li
                    v-for="route in routes"
                    :key="route.name"
                    @click="setActiveRoute(route)"
                    class="cursor-pointer p-3 rounded-lg transition-colors"
                    :class="{
                        'bg-blue-50 text-blue-600':
                            activeRoute?.name === route.name,
                        'hover:bg-gray-100 text-gray-600':
                            activeRoute?.name !== route.name,
                    }"
                >
                    <component
                        :is="route.iconComponent"
                        class="w-5 h-5 mr-3 inline-block"
                    />
                    {{ route.label }}
                </li>
            </ul>
        </nav>
    </div>
</template>

<style scoped>
.sidebar-container {
    transition: all 0.3s ease;
}
</style>
