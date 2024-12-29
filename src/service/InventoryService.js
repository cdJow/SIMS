export const InventoryService = {
    // Simulate fetching low-stock items
    getLowStockItems() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        itemName: "Shampoo (1L)",
                        category: "Consumable",
                        currentStock: 20,
                        reorderLevel: 30,
                        supplier: "XYZ Supplies",
                    },
                    {
                        itemName: "Bedsheet Set",
                        category: "Rental",
                        currentStock: 5,
                        reorderLevel: 10,
                        supplier: "ABC Textiles",
                    },
                    {
                        itemName: "Cup Noodles",
                        category: "Consumable",
                        currentStock: 15,
                        reorderLevel: 50,
                        supplier: "Food Corp",
                    },
                    {
                        itemName: "Coffee Pack",
                        category: "Consumable",
                        currentStock: 8,
                        reorderLevel: 25,
                        supplier: "Brew Co.",
                    },
                    {
                        itemName: "Water Glass",
                        category: "Non-Consumable",
                        currentStock: 3,
                        reorderLevel: 10,
                        supplier: "Kitchen Supplies Ltd.",
                    },
                ]);
            }); // Simulated network delay
        });
    },

    // Simulate fetching stock movement data with handled by information
    getStockMovements() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        dateTime: "2024-06-01T10:00:00",
                        itemName: "Shampoo (1L)",
                        actionType: "Stock In",
                        qtyChanged: +50,
                        balance: 150,
                        remarks: "Restocked from supplier",
                        handledBy: "Admin",
                    },
                    {
                        dateTime: "2024-06-02T12:30:00",
                        itemName: "Bedsheet Set",
                        actionType: "Stock Out",
                        qtyChanged: -10,
                        balance: 40,
                        remarks: "Assigned to rooms",
                        handledBy: "Front Desk",
                    },
                    {
                        dateTime: "2024-06-03T14:00:00",
                        itemName: "Cup Noodles",
                        actionType: "Stock Out",
                        qtyChanged: -20,
                        balance: 30,
                        remarks: "Sold",
                        handledBy: "Store Manager",
                    },
                    {
                        dateTime: "2024-06-04T09:45:00",
                        itemName: "Coffee Pack",
                        actionType: "Stock In",
                        qtyChanged: +30,
                        balance: 38,
                        remarks: "Restocked from supplier",
                        handledBy: "Admin",
                    },
                ]);
            }); // Simulated network delay
        });
    },

    getStockMovementsSummary() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        itemName: "Shampoo (1L)",
                        movementType: "Addition",
                        quantity: 50,
                        date: "2024-06-01",
                        remarks: "Restocked from supplier",
                    },
                    {
                        itemName: "Bedsheet Set",
                        movementType: "Reduction",
                        quantity: -10,
                        date: "2024-06-02",
                        remarks: "Assigned to rooms",
                    },
                    {
                        itemName: "Cup Noodles",
                        movementType: "Reduction",
                        quantity: -20,
                        date: "2024-06-03",
                        remarks: "Sold to cafeteria",
                    },
                    {
                        itemName: "Coffee Pack",
                        movementType: "Addition",
                        quantity: 30,
                        date: "2024-06-04",
                        remarks: "Restocked from supplier",
                    },
                    {
                        itemName: "Water Glass",
                        movementType: "Reduction",
                        quantity: -2,
                        date: "2024-06-05",
                        remarks: "Assigned to kitchen",
                    },
                ]);
            }); // Simulate network delay
        });
    },

    getDamagedItems() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        itemName: "Room Chair",
                        quantityDamaged: 4,
                        damageType: "Broken Leg",
                        reportedDate: "2024-12-10",
                        reason: "Rough Usage",
                        supplier: "Furniture Co.",
                    },
                    {
                        itemName: "Bedsheet",
                        quantityDamaged: 3,
                        damageType: "Torn",
                        reportedDate: "2024-12-09",
                        reason: "Improper Washing",
                        supplier: "ABC Textiles",
                    },
                    {
                        itemName: "Wardrobe",
                        quantityDamaged: 1,
                        damageType: "Broken Door",
                        reportedDate: "2024-12-08",
                        reason: "Overuse",
                        supplier: "Furniture Co.",
                    },
                    {
                        itemName: "Water Glass",
                        quantityDamaged: 6,
                        damageType: "Cracked",
                        reportedDate: "2024-12-07",
                        reason: "Accidental Drop",
                        supplier: "Kitchen Supplies Ltd.",
                    },
                    {
                        itemName: "Bathroom Mirror",
                        quantityDamaged: 2,
                        damageType: "Shattered",
                        reportedDate: "2024-12-06",
                        reason: "Improper Installation",
                        supplier: "Mirror Solutions",
                    },
                ]);
            }); // Simulated delay
        });
    },

    getExpiredItems() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        itemName: "Milk Carton",
                        batchNumber: "MC20241201",
                        quantity: 15, // Renamed from currentStock to quantity
                        expirationDate: "2024-12-01",
                        supplier: "Dairy Co.",
                    },
                    {
                        itemName: "Yogurt Pack",
                        batchNumber: "YP20241120",
                        quantity: 10, // Renamed from currentStock to quantity
                        expirationDate: "2024-11-20",
                        supplier: "Dairy Co.",
                    },
                    {
                        itemName: "Cheese Block",
                        batchNumber: "CB20241215",
                        quantity: 5, // Renamed from currentStock to quantity
                        expirationDate: "2024-12-15",
                        supplier: "Cheese Makers Ltd.",
                    },
                ]);
            }); // Simulated delay
        });
    },

    // Simulate fetching detailed mock data for inventory items
    getInventoryDetails() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        itemName: "Shampoo (1L)",
                        category: "Consumable",
                        batchNumber: "B12345",
                        currentStock: 150,
                        supplier: "XYZ Supplies",
                        dateReceived: "2024-06-01",
                        warranty: "N/A",
                        status: "Available",
                    },
                    {
                        itemName: "Bedsheet Set",
                        category: "Rental",
                        batchNumber: "R56789",
                        currentStock: 40,
                        supplier: "ABC Textiles",
                        dateReceived: "2024-05-20",
                        warranty: "6 Months",
                        status: "Assigned",
                    },
                    {
                        itemName: "Cup Noodles",
                        category: "Consumable",
                        batchNumber: "C90876",
                        currentStock: 30,
                        supplier: "Food Corp",
                        dateReceived: "2024-06-03",
                        warranty: "N/A",
                        status: "Available",
                    },
                    {
                        itemName: "Coffee Pack",
                        category: "Consumable",
                        batchNumber: "CP33321",
                        currentStock: 38,
                        supplier: "Brew Co.",
                        dateReceived: "2024-06-04",
                        warranty: "N/A",
                        status: "Available",
                    },
                    {
                        itemName: "Water Glass",
                        category: "Non-Consumable",
                        batchNumber: "W45678",
                        currentStock: 3,
                        supplier: "Kitchen Supplies Ltd.",
                        dateReceived: "2024-05-15",
                        warranty: "2 Years",
                        status: "Damaged",
                    },
                ]);
            }); // Simulated network delay
        });
    },
};
