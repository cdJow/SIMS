// RoomService.js

export const RoomService = {
    getAvailableRooms() {
        return [
            {
                roomNumber: "101",
                type: "Single",
                status: "Available",
                price: 50,
            },
            {
                roomNumber: "102",
                type: "Double",
                status: "Available",
                price: 75,
            },
            {
                roomNumber: "103",
                type: "Suite",
                status: "Available",
                price: 120,
            },
            {
                roomNumber: "104",
                type: "Single",
                status: "Available",
                price: 50,
            },
            {
                roomNumber: "105",
                type: "Double",
                status: "Available",
                price: 80,
            },
        ];
    },
};
