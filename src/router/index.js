import AppLayout from "@/layout/AppLayout.vue";
import WebsiteLayout from "@/layout/WebsiteLayout.vue";

import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/HomePage",
            component: WebsiteLayout,
            children: [
                {
                    path: "/pages/website/HomePage",
                    name: "Home",
                    component: () =>
                        import("@/views/pages/website/HomePage.vue"),
                },

                {
                    path: "/pages/website/ProfilePage",
                    name: "ProfilePage",
                    component: () =>
                        import("@/views/pages/website/ProfilePage.vue"),
                },

                {
                    path: "/pages/website/RoomCatalog",
                    name: "RoomCatalog",
                    component: () =>
                        import("@/views/pages/website/RoomCatalog.vue"),
                },

                {
                    path: "/pages/website/TransactionHistory",
                    name: "TransactionHistory",
                    component: () =>
                        import("@/views/pages/website/TransactionHistory.vue"),
                },
            ],
        },

        {
            path: "/dashboard",
            component: AppLayout,
            children: [
                {
                    path: "/Dashboard",
                    name: "dashboard",
                    component: () => import("@/views/Dashboard.vue"),
                },
                {
                    path: "/Rooms/RoomControl",
                    name: "Room Control",
                    component: () =>
                        import("@/views/pages/Rooms/RoomControl.vue"),
                },
                {
                    path: "/Accounts/AccountsPanel",
                    name: "Accounts Panel",
                    component: () =>
                        import("@/views/pages/Accounts/AccountsPanel.vue"),
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
                    path: "/Rooms/RoomList",
                    name: "Room List",
                    component: () => import("@/views/pages/Rooms/RoomList.vue"),
                },
                {
                    path: "/Rooms/CheckIn",
                    name: "Check In",
                    component: () => import("@/views/pages/Rooms/CheckIn.vue"),
                },

                {
                    path: "/Rooms/CheckInList",
                    name: " Check In",
                    component: () =>
                        import("@/views/pages/Rooms/CheckInList.vue"),
                },

                {
                    path: "/Rooms/CheckoutList",
                    name: " Check Out List",
                    component: () =>
                        import("@/views/pages/Rooms/CheckoutList.vue"),
                },

                {
                    path: "/Rooms/DamageReport",
                    name: " Damage Report",
                    component: () =>
                        import("@/views/pages/Rooms/DamageReport.vue"),
                },

                {
                    path: "/FrontDeskMenu",
                    name: " Check Out",

                    component: () => import("@/views/pages/FrontDeskMenu.vue"),
                },

                {
                    path: "/MenuList",
                    name: " Menu List",

                    component: () => import("@/views/pages/MenuList.vue"),
                },

                {
                    path: "/Rooms/CanceledBooking",
                    name: " Canceled Booking",

                    component: () =>
                        import("@/views/pages/Rooms/CanceledBooking.vue"),
                },

                {
                    path: "/Rooms/CanceledBookingAdmin",
                    name: " Cancelled Booking",

                    component: () =>
                        import("@/views/pages/Rooms/CanceledBookingAdmin.vue"),
                },

                {
                    path: "/POS/POS",
                    name: " POS",
                    component: () => import("@/views/pages/POS/POS.vue"),
                },

                {
                    path: "/POS/Extra",
                    name: " Extra",
                    component: () => import("@/views/pages/POS/Extra.vue"),
                },

                {
                    path: "/POS/Invoice",
                    name: " Invoice",
                    component: () => import("@/views/pages/POS/Invoice.vue"),
                },

                {
                    path: "/POS/RoomInvoice",
                    name: " Room Invoice",
                    component: () =>
                        import("@/views/pages/POS/RoomInvoice.vue"),
                },

                {
                    path: "/POS/InvoiceAdmin",
                    name: " Invoice Admin",
                    component: () =>
                        import("@/views/pages/POS/InvoiceAdmin.vue"),
                },

                {
                    path: "/POS/RoomInvoiceAdmin",
                    name: " Room AdminInvoice",
                    component: () =>
                        import("@/views/pages/POS/RoomInvoiceAdmin.vue"),
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
                    path: "/Rooms/AddRoom",
                    name: "Rooms ",
                    component: () => import("@/views/pages/Rooms/AddRoom.vue"),
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
            path: "/",
            name: "landing",
            component: () => import("@/views/pages/Landing.vue"),
        },

        {
            path: "/pages/Catalog",
            name: "Catalog",
            component: () => import("@/views/pages/Catalog.vue"),
        },

        {
            path: "/:pathMatch(.*)*", // Proper catch-all route
            name: "not-found",
            component: () => import("@/views/pages/NotFound.vue"),
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
            path: "/pages/auth/login",
            name: "login",
            component: () => import("@/views/pages/auth/Login.vue"),
        },

        {
            path: "/KitchenModule",
            name: " KitchenModule",
            component: () => import("@/views/pages/KitchenModule.vue"),
        },

        {
            path: "/auth/signup",
            name: "signup",
            component: () => import("@/views/pages/auth/SignUp.vue"),
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
