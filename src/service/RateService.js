// Room Categories Data
export const roomCategories = [
    {
        id: 1,
        category: "Standard",
        description: "Basic amenities, ideal for budget stays",
    },
    {
        id: 2,
        category: "Deluxe",
        description: "Enhanced features for a comfortable experience",
    },
    {
        id: 3,
        category: "Suite",
        description: "Luxury rooms with premium services",
    },
];

// Room Types Data
export const roomTypes = [
    {
        id: 1,
        categoryId: 1,
        name: "Single",
        rates: { "6hrs": 30, "12hrs": 50, "24hrs": 80 },
    },
    {
        id: 2,
        categoryId: 1,
        name: "Double",
        rates: { "6hrs": 50, "12hrs": 80, "24hrs": 120 },
    },
    {
        id: 3,
        categoryId: 2,
        name: "King",
        rates: { "6hrs": 100, "12hrs": 150, "24hrs": 200 },
    },
    {
        id: 4,
        categoryId: 3,
        name: "Family",
        rates: { "6hrs": 200, "12hrs": 250, "24hrs": 300 },
    },
];
