import { ref } from "vue";

// Helper functions for generating data
const generatePhone = () =>
    `${Math.floor(100 + Math.random() * 900)}-${Math.floor(
        100 + Math.random() * 900
    )}-${Math.floor(1000 + Math.random() * 9000)}`;

const roomTypes = [
    "Single Size Bed",
    "Double Size Bed",
    "King Size Bed",
    "Queen Size Bed",
    "Executive Suite",
    "Family Suite",
    "Presidential Suite",
];

const statusOptions = ["Available", "Occupied", "Booked", "Cleaning"];
const floors = [
    "1st Floor",
    "2nd Floor",
    "3rd Floor",
    "4th Floor",
    "5th Floor",
];

// Base data (your original 5 rooms)
const baseRooms = [
    {
        id: 1,
        roomNumber: "101",
        floor: "1st Floor",
        name: "Room 101",
        type: "Single Size Bed",
        description: getDescription("Single Size Bed"),
        status: "Available",
        rate: generateRates("Single Size Bed"),
        cleaningStatus: "Clean",
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
        id: 2,
        roomNumber: "102",
        floor: "1st Floor",
        name: "Room 102",
        type: "Double Size Bed",
        description: getDescription("Double Size Bed"),
        status: "Occupied",
        rate: generateRates("Double Size Bed"),
        cleaningStatus: "Needs Cleaning",
        guestDetails: generateGuestDetails(2, "Occupied", "Double Size Bed"),
    },
    {
        id: 3,
        roomNumber: "103",
        floor: "2nd Floor",
        name: "Room 103",
        type: "King Size Bed",
        description: getDescription("King Size Bed"),
        status: "Booked",
        rate: generateRates("King Size Bed"),
        cleaningStatus: "Clean",
        guestDetails: generateGuestDetails(3, "Booked", "King Size Bed"),
    },
    {
        id: 4,
        roomNumber: "104",
        floor: "2nd Floor",
        name: "Room 104",
        type: "Queen Size Bed",
        description: getDescription("Queen Size Bed"),
        status: "Cleaning",
        rate: generateRates("Queen Size Bed"),
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
        floor: "3rd Floor",
        name: "Room 105",
        type: "Executive Suite",
        description: getDescription("Executive Suite"),
        status: "Available",
        rate: generateRates("Executive Suite"),
        cleaningStatus: "Clean",
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
];

// Generate 95 additional rooms
const generatedRooms = Array.from({ length: 95 }, (_, index) => {
    const id = index + 6;
    const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const floor = floors[Math.floor(Math.random() * floors.length)];
    const status =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];

    const isOccupiedOrBooked = ["Occupied", "Booked"].includes(status);
    const needsCleaning = Math.random() < 0.3;

    return {
        id: id,
        roomNumber: (100 + id).toString(),
        floor: floor,
        name: `Room ${100 + id}`,
        type: type,
        description: getDescription(type),
        status: status,
        rate: generateRates(type),
        cleaningStatus: needsCleaning ? "Needs Cleaning" : "Clean",
        guestDetails: isOccupiedOrBooked
            ? generateGuestDetails(id, status, type)
            : {
                  guestName: null,
                  cellphone: null,
                  selectedHours: null,
                  checkIn: null,
                  checkOut: null,
                  bookingCode: null,
                  rate: null,
              },
    };
});

// Helper functions
function getDescription(type) {
    const descriptions = {
        "Single Size Bed":
            "Compact room with single bed, ideal for solo travelers",
        "Double Size Bed": "Comfortable double bed room for couples",
        "King Size Bed": "Luxurious king-sized bed with premium amenities",
        "Queen Size Bed": "Spacious room with queen-sized bed",
        "Executive Suite": "Business-class accommodations with work area",
        "Family Suite": "Two connecting rooms with family-friendly amenities",
        "Presidential Suite":
            "Luxury suite with separate living area and VIP services",
    };
    return descriptions[type];
}

function generateRates(type) {
    const baseRates = {
        "Single Size Bed": { 6: 40, 12: 70, 24: 100 },
        "Double Size Bed": { 6: 60, 12: 100, 24: 140 },
        "King Size Bed": { 6: 80, 12: 130, 24: 200 },
        "Queen Size Bed": { 6: 70, 12: 110, 24: 160 },
        "Executive Suite": { 6: 100, 12: 180, 24: 250 },
        "Family Suite": { 6: 120, 12: 200, 24: 300 },
        "Presidential Suite": { 6: 200, 12: 350, 24: 500 },
    };
    return {
        "6 ": baseRates[type][6],
        "12 ": baseRates[type][12],
        "24 ": baseRates[type][24],
    };
}

function generateGuestDetails(id, status, type) {
    const hoursOptions = [6, 12, 24];
    return {
        guestName: `Guest ${id}`,
        cellphone: generatePhone(),
        selectedHours:
            hoursOptions[Math.floor(Math.random() * hoursOptions.length)],
        checkIn:
            status === "Occupied"
                ? new Date(Date.now() - Math.floor(Math.random() * 10000000))
                : null,
        checkOut:
            status === "Occupied"
                ? new Date(Date.now() + Math.floor(Math.random() * 10000000))
                : null,
        bookingCode: `BK-${id}-${Math.random()
            .toString(36)
            .substr(2, 6)
            .toUpperCase()}`,
        rate: generateRates(type)["24 Hours"], // Example using 24h rate
    };
}

export const rooms = ref([...baseRooms, ...generatedRooms]);
