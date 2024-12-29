import AppLayout from "@/layout/AppLayout.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: AppLayout,
            children: [
                {
                    path: "/",
                    name: "dashboard",
                    component: () => import("@/views/Dashboard.vue"),
                },
                {
                    path: "/Inventory/AddItems/ConsumableForm",
                    name: "ConsumableForm",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/AddItems/ConsumableForm.vue"
                        ),
                },

                      

                {
                    path: "/Inventory/ViewInventory/ViewItems",
                    name: "View Inventory",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/ViewInventory/ViewItems.vue"
                        ),
                },

                {
                    path: "/Inventory/AddItems/NonConsumableForm",
                    name: "Non Consumable Form",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/AddItems/NonConsumableForm.vue"
                        ),
                },

                {
                    path: "/Inventory/ManageInventory/ManageItems",
                    name: "Manage Inventory",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/ManageInventory/ManageItems.vue"
                        ),
                },

                {
                    path: "/Inventory/GenerateReport/InventorySummary",
                    name: "Inventory Summary",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/InventorySummary.vue"
                        ),
                },

                {
                    path: "/Rates/RatePage",
                    name: " Rate Page",
                    component: () => import("@/views/pages/Rates/RatePage.vue"),
                },

                {
                    path: "/Inventory/GenerateReport/StockHistory",
                    name: "Stock Table",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/StockHistory.vue"
                        ),
                },

                {
                    path: "/Inventory/GenerateReport/LowstockReport",
                    name: "Low stock Report",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/LowstockReport.vue"
                        ),
                },

                {
                    path: "/Inventory/GenerateReport/DamagedItems",
                    name: "Damaged Items",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/DamagedItems.vue"
                        ),
                },

                {
                    path: "/Inventory/GenerateReport/ExpiredItems",
                    name: "Expired Items",
                    component: () =>
                        import(
                            "@/views/pages/Inventory/GenerateReport/ExpiredItems.vue"
                        ),
                },

                {
                    path: "/uikit/formlayout",
                    name: "formlayout",
                    component: () => import("@/views/uikit/FormLayout.vue"),
                },
                {
                    path: "/uikit/input",
                    name: "input",
                    component: () => import("@/views/uikit/InputDoc.vue"),
                },
                {
                    path: "/uikit/button",
                    name: "button",
                    component: () => import("@/views/uikit/ButtonDoc.vue"),
                },
                {
                    path: "/uikit/table",
                    name: "table",
                    component: () => import("@/views/uikit/TableDoc.vue"),
                },
                {
                    path: "/uikit/list",
                    name: "list",
                    component: () => import("@/views/uikit/ListDoc.vue"),
                },
                {
                    path: "/uikit/tree",
                    name: "tree",
                    component: () => import("@/views/uikit/TreeDoc.vue"),
                },
                {
                    path: "/uikit/panel",
                    name: "panel",
                    component: () => import("@/views/uikit/PanelsDoc.vue"),
                },

                {
                    path: "/uikit/overlay",
                    name: "overlay",
                    component: () => import("@/views/uikit/OverlayDoc.vue"),
                },
                {
                    path: "/uikit/media",
                    name: "media",
                    component: () => import("@/views/uikit/MediaDoc.vue"),
                },
                {
                    path: "/uikit/message",
                    name: "message",
                    component: () => import("@/views/uikit/MessagesDoc.vue"),
                },
                {
                    path: "/uikit/file",
                    name: "file",
                    component: () => import("@/views/uikit/FileDoc.vue"),
                },
                {
                    path: "/uikit/menu",
                    name: "menu",
                    component: () => import("@/views/uikit/MenuDoc.vue"),
                },
                {
                    path: "/uikit/charts",
                    name: "charts",
                    component: () => import("@/views/uikit/ChartDoc.vue"),
                },
                {
                    path: "/uikit/misc",
                    name: "misc",
                    component: () => import("@/views/uikit/MiscDoc.vue"),
                },
                {
                    path: "/uikit/timeline",
                    name: "timeline",
                    component: () => import("@/views/uikit/TimelineDoc.vue"),
                },
                {
                    path: "/pages/empty",
                    name: "empty",
                    component: () => import("@/views/pages/Empty.vue"),
                },
                {
                    path: "/pages/crud",
                    name: "crud",
                    component: () => import("@/views/pages/Crud.vue"),
                },
                {
                    path: "/documentation",
                    name: "documentation",
                    component: () => import("@/views/pages/Documentation.vue"),
                },
            ],
        },
        {
            path: "/landing",
            name: "landing",
            component: () => import("@/views/pages/Landing.vue"),
        },

        {
            path: "/BookingPanel",
            name: "Booking",
            component: () => import("@/views/pages/BookingPanel.vue"),
        },
        {
            path: "/pages/notfound",
            name: "notfound",
            component: () => import("@/views/pages/NotFound.vue"),
        },

        {
            path: "/auth/login",
            name: "login",
            component: () => import("@/views/pages/auth/Login.vue"),
        },
        {
            path: "/auth/access",
            name: "accessDenied",
            component: () => import("@/views/pages/auth/Access.vue"),
        },
        {
            path: "/auth/error",
            name: "error",
            component: () => import("@/views/pages/auth/Error.vue"),
        },
    ],
});

export default router;
