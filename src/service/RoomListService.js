import { ref } from "vue";

export const rooms = ref([
    {
        id: 1,
        roomNumber: "101",
        floor: "1st Floor",
        name: "Room 101",
        type: "Double Size Bed",
        description: "Perfect for two guests with additional space.",
        status: "Available", // Room is available
        rate: {
            "6 Hours": 50,
            "12 Hours": 80,
            "24 Hours": 120,
        },
        cleaningStatus: "Clean",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null, // No check-in date since the room is available
            checkOut: null, // No check-out date since the room is available
            bookingCode: null, // No booking code for available room
            rate: null, // No rate assigned for available room
        },
    },

    {
        id: 2,
        roomNumber: "102",
        floor: "1st Floor",
        name: "Room 102",
        type: "Single Size Bed",
        description: "A cozy room for a single guest.",
        status: "Occupied", // Room is still occupied
        rate: {
            "6 Hours": 30,
            "12 Hours": 50,
            "24 Hours": 90,
        },
        cleaningStatus: "Clean",
        guestDetails: {
            guestName: "John Doe",
            cellphone: "123-456-7890",
            selectedHours: 24,
            checkIn: "2025-01-06T14:00:00",
            checkOut: "2025-01-07T14:00:00",
            bookingCode: "BK-2-ABCDEFG",
            rate: 90.0,
        },
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        name: "Room 103",
        type: "King Size Bed",
        description: "A luxurious suite for families or groups.",
        status: "Available", // Room is not booked or checked in
        rate: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null,
            checkOut: null,
            bookingCode: null,
            rate: null,
        },
    },
    {
        id: 4,
        roomNumber: "104",
        floor: "2nd Floor",
        name: "Room 104",
        type: "King Size Bed",
        description: "A luxurious suite for families or groups.",
        status: "Cleaning", // Room is being cleaned
        rate: {
            "6 Hours": 100,
            "12 Hours": 150,
            "24 Hours": 250,
        },
        cleaningStatus: "Needs Cleaning",
        guestDetails: {
            guestName: null,
            cellphone: null,
            selectedHours: null,
            checkIn: null,
            checkOut: null,
            bookingCode: null,
            rate: null,
        },
    },
    {
        id: 5,
        roomNumber: "105",
        floor: "2nd Floor",
        name: "Room 105",
        type: "Double Size Bed",
        description: "Spacious room perfect for couples.",
        status: "Booked", // Updated to reflect the room is booked
        rate: {
            "6 Hours": 60,
            "12 Hours": 100,
            "24 Hours": 140,
        },
        cleaningStatus: "Clean", // Updated to reflect that it's clean and ready for guests
        guestDetails: {
            guestName: "Jane Smith",
            cellphone: "987-654-3210",
            selectedHours: 12,
            checkIn: null, // No check-in date since the guest hasn't checked in yet
            checkOut: null, // No check-out date since the guest hasn't checked in yet
            bookingCode: "BK-5-HJKLMN", // Retain the booking code for reference
            rate: 100.0, // Rate calculated based on selected hours
        },
    },
]);
