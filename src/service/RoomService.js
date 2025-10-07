// RoomService.js
import { getRooms } from "@/api/auth";

export const RoomService = {
    async getAvailableRooms() {
        try {
            const response = await getRooms();
            console.log("Raw rooms response:", response);
            
            // Extract room data and ensure proper formatting
            const rooms = response.data || [];
            
            return rooms.map(room => ({
                id: room.id,
                roomNumber: room.room_number || room.roomNumber,
                type: room.room_type_name || room.type || 'Standard',
                category: room.category || 'Standard',
                status: room.status || 'Available',
                price: parseFloat(room.price || 0)
            }));
        } catch (error) {
            console.error("Error fetching real rooms data:", error);
            // Fallback to empty array if API fails
            return [];
        }
    }
};
