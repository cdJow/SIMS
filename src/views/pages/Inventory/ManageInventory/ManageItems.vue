<script setup>
import { ProductService } from "@/service/ProductService";
import { updateProduct, deleteProductById, updateBatch, deleteBatchById, deleteSerialById, assignItemToRoom, unassignItemFromRoom, createDamageReport, updateSerialNumber } from "@/api/auth";
import { RoomService } from "@/service/RoomService";
import { FilterMatchMode, FilterOperator } from "@primevue/core/api";
import { InputNumber } from "primevue";
import Select from "primevue/select";

import { onBeforeMount, onMounted, ref, computed } from "vue";

const expandedRows = ref([]);
const batchExpandedRows = ref([]);
const toast = ref(null);
const NonConsumablebatchDialog = ref(false);
const assignItemDialogVisible = ref(false); // For assigning items
const reassignItemDialogVisible = ref(false); // For re-assigning items

const deleteProductDialog = ref(false); // State for delete dialog
const deleteBatchDialog = ref(false);
const selectedBatchForDeletion = ref(null);

const product = ref({}); // Initialize product as a reactive reference
const batchDialog = ref(false);

const productDialog = ref(false);

const submitted = ref(false);

const selectedBatch = ref({});

const products = ref([]); // Products for the DataTable
const selectedProduct = ref(null); // Selected product from the DataTable
const selectedItem = ref(null); // Selected item details
const isLoading = ref(false); // Loading state
const error = ref(null); // Error state

// Computed property to ensure products is always a valid array with proper structure
const safeProducts = computed(() => {
    try {
        if (!Array.isArray(products.value)) {
            console.warn("products is not an array, returning empty array");
            return [];
        }
        return products.value.filter(product => product && typeof product.id !== 'undefined');
    } catch (error) {
        console.error("Error accessing products:", error);
        return [];
    }
});
const popoverRef = ref(null); // Reference to the Popover

const availableRooms = ref([]);
const selectedRoom = ref(null);
const serialNumbers = ref([]);
// For damaged item reporting
const damageDialogVisible = ref(false);
const selectedDamageItem = ref(null);
const damageDetails = ref({
    damage_description: "",
    notes: "",
});
const damageTypes = ref([
    { name: "Broken", value: "broken" },
    { name: "Stained", value: "stained" },
    { name: "Malfunctioning", value: "malfunction" },
    { name: "Water Damage", value: "water_damage" },
    { name: "Burn Marks", value: "burn_marks" },
    { name: "Scratches", value: "scratches" },
    { name: "Torn Fabric", value: "torn_fabric" },
    { name: "Pest Infestation", value: "pest_infestation" },
    { name: "Odor Issues", value: "odor_issues" },
    { name: "Electrical Fault", value: "electrical_fault" },
    { name: "Plumbing Issue", value: "plumbing_issue" },
    { name: "Furniture Damage", value: "furniture_damage" },
    { name: "Wall Damage", value: "wall_damage" },
    { name: "Carpet Stains", value: "carpet_stains" },
    { name: "Bed Frame Issue", value: "bed_frame_issue" },
    { name: "HVAC Malfunction", value: "hvac_malfunction" },
    { name: "Window Damage", value: "window_damage" },
    { name: "Door Lock Issue", value: "door_lock_issue" },
    { name: "Lighting Issue", value: "lighting_issue" },
]);

const deleteConsumableDialogVisible = ref(false); // Dialog visibility state
const consumableToDelete = ref(null); // Stores the consumable item to be deleted

function confirmDeleteConsumable(item) {
    consumableToDelete.value = item; // Store the consumable item to be deleted
    deleteConsumableDialogVisible.value = true; // Open the confirmation dialog
}

async function deleteConsumable() {
    if (!consumableToDelete.value) {
        console.error("No consumable item selected for deletion.");
        return;
    }

    try {
        // Call the API to delete the serial number from the database
        await deleteSerialById(consumableToDelete.value.serialNumber);

        // Locate the product and batch containing the serial number
        const consumableIndex = products.value.findIndex((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) =>
                        sn.serialNumber === consumableToDelete.value.serialNumber
                )
            )
        );

        if (consumableIndex !== -1) {
            const product = products.value[consumableIndex];
            const batch = product.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) =>
                        sn.serialNumber === consumableToDelete.value.serialNumber
                )
            );

            if (batch) {
                const serialIndex = batch.serialNumbers.findIndex(
                    (sn) =>
                        sn.serialNumber === consumableToDelete.value.serialNumber
                );

                if (serialIndex !== -1) {
                    // Remove the serial number from the batch
                    batch.serialNumbers.splice(serialIndex, 1);
                    console.log(
                        "Consumable item deleted successfully:",
                        consumableToDelete.value
                    );

                    // Show success toast
                    toast.value.add({
                        severity: "success",
                        summary: "Deleted",
                        detail: "Consumable item deleted successfully from database!",
                        life: 3000,
                    });

                    consumableToDelete.value = null; // Reset the selected consumable
                    deleteConsumableDialogVisible.value = false; // Close the dialog
                    return;
                }
            }
        }

        console.error("Consumable item not found in frontend data.");
        consumableToDelete.value = null; // Reset the selected consumable
        deleteConsumableDialogVisible.value = false; // Close the dialog

    } catch (error) {
        console.error("Error deleting consumable item:", error);
        
        // Show error toast
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: `Failed to delete consumable item: ${error.response?.data?.error || error.message}`,
            life: 5000,
        });

        consumableToDelete.value = null; // Reset the selected consumable
        deleteConsumableDialogVisible.value = false; // Close the dialog
    }
}

// Add filter function with proper error handling
const ConsumableBatchSearch = ref("");
const NonConsumableBatchSearch = ref("");
const roomSearchQuery = ref(""); // Search for rooms by room number

// Separate filter functions
const filterConsumableBatches = (batches) => {
    try {
        if (!Array.isArray(batches)) {
            console.warn("filterConsumableBatches: batches is not an array", batches);
            return [];
        }
        const query = ConsumableBatchSearch.value.toLowerCase().trim();
        return query
            ? batches.filter((batch) => {
                  if (!batch || typeof batch !== 'object') return false;
                  return Object.values(batch).some((value) =>
                      String(value || '').toLowerCase().includes(query)
                  );
              })
            : batches;
    } catch (error) {
        console.error("Consumable batch filter error:", error);
        return Array.isArray(batches) ? batches : [];
    }
};

// Function to refresh products data
async function refreshProducts() {
    isLoading.value = true;
    error.value = null;
    try {
        console.log("Refreshing products with batches...");
        const data = await ProductService.getProductsWithOrders();
        console.log("Refreshed API response:", data);
        
        // Ensure data is array and properly structured
        if (Array.isArray(data)) {
            // Add defensive data structure validation
            const validatedData = data.map(product => ({
                ...product,
                batches: Array.isArray(product.batches) ? product.batches.map(batch => ({
                    ...batch,
                    batchId: batch.item_id || batch.batchId || batch.id,
                    batchNumber: batch.batchNumber || batch.batch_number || '-',
                    serialNumbers: Array.isArray(batch.serialNumbers) ? batch.serialNumbers : []
                })) : []
            }));
            
            products.value = validatedData;
            console.log("Refreshed products:", validatedData);
        } else {
            console.warn("API returned non-array data:", data);
            products.value = [];
        }
    } catch (err) {
        console.error("Error refreshing products:", err);
        error.value = err.message || "Failed to refresh products data";
        if (toast.value) {
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: error.value,
                life: 3000
            });
        }
    } finally {
        isLoading.value = false;
    }
}

onMounted(async () => {
    isLoading.value = true;
    error.value = null;
    try {
        console.log("Loading products with batches...");
        const data = await ProductService.getProductsWithOrders();
        console.log("Raw API response:", data);
        
        // Ensure data is array and properly structured
        if (Array.isArray(data)) {
            // Add defensive data structure validation
            const validatedData = data.map(product => ({
                ...product,
                batches: Array.isArray(product.batches) ? product.batches.map(batch => ({
                    ...batch,
                    batchId: batch.item_id || batch.batchId || batch.id,
                    batchNumber: batch.batchNumber || batch.batch_number || '-',
                    serialNumbers: Array.isArray(batch.serialNumbers) ? batch.serialNumbers : []
                })) : []
            }));
            
            products.value = validatedData;
            console.log("Validated products data:", validatedData);
            console.log("Total products loaded:", validatedData.length);
        } else {
            console.warn("API returned non-array data:", data);
            products.value = [];
        }
        
        initFilters();
    } catch (err) {
        console.error("Data loading failed:", err);
        error.value = err.message || "Failed to load product data";
        showErrorToast(error.value);
        products.value = []; // Ensure empty array state
    } finally {
        isLoading.value = false;
    }
});

const showErrorToast = (message) => {
    if (toast.value) {
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: message,
            life: 3000,
        });
    }
};

const filterNonConsumableBatches = (batches) => {
    try {
        if (!Array.isArray(batches)) {
            console.warn("filterNonConsumableBatches: batches is not an array", batches);
            return [];
        }
        const query = NonConsumableBatchSearch.value.toLowerCase().trim();
        return query
            ? batches.filter((batch) => {
                  if (!batch || typeof batch !== 'object') return false;
                  return Object.values(batch).some((value) =>
                      String(value || '').toLowerCase().includes(query)
                  );
              })
            : batches;
    } catch (error) {
        console.error("Non-consumable batch filter error:", error);
        return Array.isArray(batches) ? batches : [];
    }
};
// Separate clear functions
const clearConsumableFilter = () => {
    ConsumableBatchSearch.value = "";
};

const clearNonConsumableBatchFilter = () => {
    NonConsumableBatchSearch.value = "";
};

// Computed property to filter rooms by room number
const filteredRooms = computed(() => {
    try {
        if (!Array.isArray(availableRooms.value)) {
            return [];
        }
        const query = roomSearchQuery.value.toLowerCase().trim();
        return query
            ? availableRooms.value.filter(room => 
                room.roomNumber && room.roomNumber.toString().toLowerCase().includes(query)
              )
            : availableRooms.value;
    } catch (error) {
        console.error("Room filter error:", error);
        return Array.isArray(availableRooms.value) ? availableRooms.value : [];
    }
});

// Clear room search function
const clearRoomSearch = () => {
    roomSearchQuery.value = "";
};
const editConsumableDialogVisible = ref(false); // Dialog visibility state
const editingConsumableData = ref({
    serialNumber: "",
    srp: "",
}); // Holds the consumable data being edited

// Edit serial dialog for isDialog2Visible
const editSerialDialogVisible = ref(false);
const editingSerialData = ref({
    id: null,
    serialNumber: "",
    originalSerialNumber: ""
});
const serialNumberExists = ref(false);
const serialNumberWarning = ref("");

function openEditConsumableDialog(serial) {
    editingConsumableData.value = { ...serial }; // Clone the serial data to avoid direct mutations
    editConsumableDialogVisible.value = true; // Open the dialog
}

function saveEditConsumable() {
    if (
        !editingConsumableData.value.serialNumber ||
        !editingConsumableData.value.srp
    ) {
        console.error("All fields are required.");
        return;
    }

    // Find and update the edited serial number in the consumable batch data
    const consumableIndex = products.value.findIndex((product) =>
        product.batches.some((batch) =>
            batch.serialNumbers.some(
                (sn) =>
                    sn.serialNumber === editingConsumableData.value.serialNumber
            )
        )
    );

    if (consumableIndex !== -1) {
        const product = products.value[consumableIndex];
        const batch = product.batches.find((batch) =>
            batch.serialNumbers.some(
                (sn) =>
                    sn.serialNumber === editingConsumableData.value.serialNumber
            )
        );
        const serial = batch.serialNumbers.find(
            (sn) => sn.serialNumber === editingConsumableData.value.serialNumber
        );

        if (serial) {
            serial.serialNumber = editingConsumableData.value.serialNumber;
            serial.srp = editingConsumableData.value.srp;
        }
    }

    console.log(
        "Consumable data updated successfully:",
        editingConsumableData.value
    );

    // Show success toast notification
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: "Updated successfully!",
        life: 3000, // Duration in milliseconds
    });

    editConsumableDialogVisible.value = false; // Close the dialog
}

// Functions for editing serial number in isDialog2Visible
// Computed property for filtered products
const filteredProducts = computed(() => {
    const globalFilter = filters.value.global?.value?.toLowerCase().trim() || '';
    return globalFilter
        ? products.value.filter(product => {
            return [
                product.name,
                product.brand,
                product.category,
                product.type,
                product.unit
            ].some(field => 
                field?.toString().toLowerCase().includes(globalFilter)
            );
        })
        : products.value;
});

// Computed property for button state
const isUpdateButtonDisabled = computed(() => {
    return !editingSerialData.value.serialNumber.trim() || 
           serialNumberExists.value || 
           editingSerialData.value.serialNumber === editingSerialData.value.originalSerialNumber;
});

function openEditSerialDialog(serial) {
    // Close the batch items dialog first
    isDialog2Visible.value = false;
    
    editingSerialData.value = { 
        id: serial.id || serial.serialId,
        serialNumber: serial.serialNumber,
        originalSerialNumber: serial.serialNumber
    };
    serialNumberExists.value = false;
    serialNumberWarning.value = "";
    editSerialDialogVisible.value = true;
}

async function saveEditedSerialNumber() {
    if (!editingSerialData.value.serialNumber.trim()) {
        toast.value.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Serial number is required",
            life: 3000,
        });
        return;
    }

    // Check if serial number actually changed
    if (editingSerialData.value.serialNumber === editingSerialData.value.originalSerialNumber) {
        toast.value.add({
            severity: "info",
            summary: "No Changes",
            detail: "No changes made to serial number",
            life: 3000,
        });
        cancelEditSerial();
        return;
    }

    try {
        // Update in database
        await updateSerialNumber(editingSerialData.value.id, {
            serialNumber: editingSerialData.value.serialNumber
        });

        // Update in frontend - serialNumbers array (for isDialog2Visible)
        const serialIndex = serialNumbers.value.findIndex(
            (item) => (item.id || item.serialId) === editingSerialData.value.id
        );
        
        if (serialIndex !== -1) {
            serialNumbers.value[serialIndex].serialNumber = editingSerialData.value.serialNumber;
        }
        
        // Also update in the main products data structure
        const targetProduct = products.value.find((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) => (sn.id || sn.serialId) === editingSerialData.value.id
                )
            )
        );

        if (targetProduct) {
            const targetBatch = targetProduct.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) => (sn.id || sn.serialId) === editingSerialData.value.id
                )
            );

            if (targetBatch) {
                const targetSerial = targetBatch.serialNumbers.find(
                    (sn) => (sn.id || sn.serialId) === editingSerialData.value.id
                );

                if (targetSerial) {
                    targetSerial.serialNumber = editingSerialData.value.serialNumber;
                }
            }
        }
        
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: "Serial number updated successfully",
            life: 3000,
        });
        
        cancelEditSerial();
        
    } catch (error) {
        console.error("Error updating serial number:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.error || "Failed to update serial number",
            life: 3000,
        });
    }
}

function checkSerialNumberExists(newSerialNumber) {
    if (!newSerialNumber || newSerialNumber === editingSerialData.value.originalSerialNumber) {
        serialNumberExists.value = false;
        serialNumberWarning.value = "";
        return;
    }

    // Check in serialNumbers array (current batch)
    const existsInCurrentBatch = serialNumbers.value.some(
        (item) => item.serialNumber === newSerialNumber && 
                 (item.id || item.serialId) !== editingSerialData.value.id
    );

    if (existsInCurrentBatch) {
        serialNumberExists.value = true;
        serialNumberWarning.value = "Serial number already exists in this batch";
        return;
    }

    // Check in all products/batches
    let existsInOtherBatch = false;
    for (const product of products.value) {
        for (const batch of product.batches || []) {
            const exists = batch.serialNumbers.some(
                (sn) => sn.serialNumber === newSerialNumber && 
                       (sn.id || sn.serialId) !== editingSerialData.value.id
            );
            if (exists) {
                existsInOtherBatch = true;
                break;
            }
        }
        if (existsInOtherBatch) break;
    }

    if (existsInOtherBatch) {
        serialNumberExists.value = true;
        serialNumberWarning.value = "Serial number already exists in another batch";
    } else {
        serialNumberExists.value = false;
        serialNumberWarning.value = "";
    }
}

function cancelEditSerial() {
    editSerialDialogVisible.value = false;
    editingSerialData.value = {
        id: null,
        serialNumber: "",
        originalSerialNumber: ""
    };
    serialNumberExists.value = false;
    serialNumberWarning.value = "";
}

// Function to open the damage report dialog
function reportDamage(item) {
    selectedDamageItem.value = item; // Set the selected item for damage reporting
    damageDetails.value = { damage_description: "", notes: "" }; // Reset the form data
    damageDialogVisible.value = true; // Show the damage dialog
}

// Function to submit the damage report
async function submitDamageReport() {
    if (!damageDetails.value.damage_description.trim()) {
        toast.value.add({
            severity: "warn",
            summary: "Validation Error",
            detail: "Please describe the damage",
            life: 3000,
        });
        return;
    }

    try {
        // Find the room ID from the selected item's room assignment (optional)
        let roomId = null;
        let isAssignedToRoom = false;
        
        if (selectedDamageItem.value.roomNumber && 
            selectedDamageItem.value.roomNumber !== '-' && 
            selectedDamageItem.value.roomNumber !== 'Not Assigned' &&
            selectedDamageItem.value.roomNumber.trim() !== '') {
            // Find room by room number in available rooms
            const assignedRoom = availableRooms.value.find(room => 
                room.roomNumber === selectedDamageItem.value.roomNumber
            );
            if (assignedRoom) {
                roomId = assignedRoom.id;
                isAssignedToRoom = true;
            }
        }

        // Find the serial ID from the serial number
        // We need to get the actual database ID for this serial number
        let actualSerialId = selectedDamageItem.value.id || selectedDamageItem.value.serialId;
        
        // Validate that we have required data
        if (!actualSerialId) {
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: "Unable to find serial ID for this item",
                life: 3000,
            });
            return;
        }
        
        if (!selectedDamageItem.value.serialNumber) {
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: "Serial number is missing",
                life: 3000,
            });
            return;
        }
        
        const reportData = {
            room_id: roomId, // Can be null for unassigned items
            serial_id: actualSerialId,
            item_name: selectedDamageItem.value.serialNumber, // Using serialNumber as item identifier
            damage_description: damageDetails.value.damage_description,
            notes: damageDetails.value.notes || '' // Ensure notes is never null
        };

        console.log('Selected damage item:', selectedDamageItem.value);
        console.log('Submitting damage report:', reportData);
        console.log('Item assignment status:', isAssignedToRoom ? 'Assigned to room' : 'Not assigned to any room');
        await createDamageReport(reportData);
        
        // Update the item's status to "Damaged" in frontend
        selectedDamageItem.value.status = "Damaged";
        
        // Update in serialNumbers array (for isDialog2Visible)
        const itemIndex = serialNumbers.value.findIndex(
            (item) => item.serialNumber === selectedDamageItem.value.serialNumber
        );
        if (itemIndex !== -1) {
            serialNumbers.value[itemIndex].status = "Damaged";
        }

        // Also update in the main products data structure
        const targetProduct = products.value.find((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedDamageItem.value.serialNumber
                )
            )
        );

        if (targetProduct) {
            const targetBatch = targetProduct.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedDamageItem.value.serialNumber
                )
            );

            if (targetBatch) {
                const targetSerial = targetBatch.serialNumbers.find(
                    (sn) => sn.serialNumber === selectedDamageItem.value.serialNumber
                );

                if (targetSerial) {
                    targetSerial.status = "Damaged";
                }
            }
        }

        const successMessage = isAssignedToRoom 
            ? `Damage report created for item ${selectedDamageItem.value.serialNumber} in room ${selectedDamageItem.value.roomNumber}`
            : `Damage report created for unassigned item ${selectedDamageItem.value.serialNumber}`;
            
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: successMessage,
            life: 4000,
        });
        
        // Close the dialog
        cancelDamageReport();
        
    } catch (error) {
        console.error("Error creating damage report:", error);
        toast.value.add({
            severity: "error",
            summary: "Error", 
            detail: error.response?.data?.error || "Failed to create damage report",
            life: 3000,
        });
    }
}

// Function to cancel damage report
function cancelDamageReport() {
    damageDialogVisible.value = false;
}

// Reassign the selected item
async function reassignItem() {
    if (!selectedItem.value) {
        console.error("No item selected for reassignment.");
        return;
    }

    if (!selectedRoom.value) {
        console.error("No room selected for reassignment.");
        return;
    }

    try {
        // Update the item in the serialNumbers array (for isDialog2Visible)
        const itemIndex = serialNumbers.value.findIndex(
            (item) => item.serialNumber === selectedItem.value.serialNumber
        );
        
        if (itemIndex !== -1) {
            serialNumbers.value[itemIndex].roomNumber = selectedRoom.value.roomNumber;
            serialNumbers.value[itemIndex].status = "Assigned";
        }

        // Also update in the main products data structure
        const targetProduct = products.value.find((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            )
        );

        if (targetProduct) {
            const targetBatch = targetProduct.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            );

            if (targetBatch) {
                const targetSerial = targetBatch.serialNumbers.find(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                );

                if (targetSerial) {
                    targetSerial.roomNumber = selectedRoom.value.roomNumber;
                    targetSerial.status = "Assigned";
                }
            }
        }

        // Update selectedItem for immediate UI feedback
        const reassignedRoomNumber = selectedRoom.value.roomNumber;
        const reassignedRoomId = selectedRoom.value.id || selectedRoom.value.roomId;
        
        selectedItem.value.roomNumber = reassignedRoomNumber;
        selectedItem.value.status = "Assigned";

        console.log("Item successfully reassigned:", selectedItem.value);

        // Persist reassignment to database
        await assignItemToRoom(selectedItem.value.serialNumber, reassignedRoomId);

        // Close the dialog
        reassignItemDialogVisible.value = false;

        // Reset the selected room
        selectedRoom.value = null;

        // Toast notification
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: `Item ${selectedItem.value.serialNumber} reassigned to Room ${reassignedRoomNumber}.`,
            life: 3000,
        });
        
    } catch (error) {
        console.error("Error reassigning item:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to reassign item to room",
            life: 3000,
        });
    }
}

async function moveToStockroom() {
    if (!selectedItem.value) {
        console.error("No item selected for stockroom move.");
        return;
    }

    try {
        // Update in serialNumbers array (for isDialog2Visible)
        const serialIndex = serialNumbers.value.findIndex(
            (item) => item.serialNumber === selectedItem.value.serialNumber
        );
        
        if (serialIndex !== -1) {
            serialNumbers.value[serialIndex].status = "In_stock";
            serialNumbers.value[serialIndex].roomNumber = "-";
        }

        // Find the product and batch containing the item
        let targetProduct = products.value.find((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            )
        );

        if (targetProduct) {
            let targetBatch = targetProduct.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            );

            if (targetBatch) {
                // Update the item in the original data structure
                let targetItem = targetBatch.serialNumbers.find(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                );

                if (targetItem) {
                    targetItem.status = "In_stock";
                    targetItem.roomNumber = "-";
                }
            }
        }

        // Persist unassignment to database
        await unassignItemFromRoom(selectedItem.value.serialNumber);

        // Force UI update
        products.value = [...products.value];

        // Close dialog and show success
        reassignItemDialogVisible.value = false;
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: `Item ${selectedItem.value.serialNumber} moved to stockroom`,
            life: 3000,
        });

    } catch (error) {
        console.error("Error moving item to stockroom:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to move item to stockroom",
            life: 3000,
        });
    }
}

// Function to open the dialog for reassignment
function reassign(item) {
    // Close the batch items dialog first
    isDialog2Visible.value = false;
    
    console.log("Reassigning item:", item); // Debugging
    selectedItem.value = { ...item }; // Clone the item to avoid direct mutations
    reassignItemDialogVisible.value = true; // Open the dialog
}

// Function to toggle the popover visibility
function toggleDataTable3(event) {
    if (popoverRef.value) {
        popoverRef.value.toggle(event); // Toggle the popover
    }
}

// Function to handle room selection
function selectRoom(room) {
    console.log("Room selected:", room);
    console.log("Room ID:", room.id, "Type:", typeof room.id);
    selectedRoom.value = room; // Update the selected room
    if (popoverRef.value) {
        popoverRef.value.hide(); // Close the popover after selection
    }
}

// Fetch available rooms from RoomService
onBeforeMount(async () => {
    try {
        console.log("Fetching available rooms...");
        availableRooms.value = await RoomService.getAvailableRooms();
        console.log("Available rooms loaded:", availableRooms.value);
        
        if (availableRooms.value.length === 0) {
            console.warn("No rooms were loaded from the API");
            if (toast.value) {
                toast.value.add({
                    severity: "warn",
                    summary: "Warning",
                    detail: "No rooms available for assignment",
                    life: 3000
                });
            }
        }
    } catch (error) {
        console.error("Error loading available rooms:", error);
        availableRooms.value = []; // Fallback to empty array
        if (toast.value) {
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: "Failed to load room data: " + (error.message || "Unknown error"),
                life: 5000
            });
        }
    }
});

// Function to handle product selection
function onProductSelect(event) {
    console.log("Selected Product:", event.data);
    selectedProduct.value = event.data; // Update the selected product
    if (popoverRef.value) {
        popoverRef.value.hide(); // Close the popover
    }
}

function editProduct(prod) {
    product.value = { ...prod }; // Clone the product data to avoid direct mutations
    productDialog.value = true; // Open the dialog
}

function hideDialog() {
    productDialog.value = false;
    batchDialog.value = false;
    submitted.value = false;
    NonConsumablebatchDialog.value = false;
    NonConsumablSerialDialog.value = false;

    selectedSerial.value = {};
}

const selectedSerialForDeletion = ref(null); // Serial selected for deletion
const deleteserialDialog = ref(false); // Dialog state

// Function to confirm serial deletion
function confirmDeleteSerial(serial) {
    if (!serial || !serial.serialNumber) {
        console.error("Invalid serial data provided.");
        return;
    }

    // Store the selected serial for deletion
    selectedSerialForDeletion.value = {
        serialNumber: serial.serialNumber,
        itemData: serial, // Store the complete item data for UI updates
    };

    // Open the confirmation dialog
    deleteserialDialog.value = true;

    console.log("Serial set for deletion:", selectedSerialForDeletion.value);
}

function saveEditedSerial(serialData) {
    if (!serialData || !serialData.serialNumber) {
        console.error("Invalid serial data provided:", serialData);
        return;
    }

    console.log("Serial data to save:", serialData);

    // Ensure products is iterable
    if (!Array.isArray(products.value) || products.value.length === 0) {
        console.error("Products list is empty or not loaded.");
        return;
    }

    let matchedProduct = null;
    let matchedBatch = null;
    let matchedSerial = null;

    // Search for the serial number in all products and their batches
    for (const product of products.value) {
        console.log("Checking Product:", product);

        for (const batch of product.batches || []) {
            console.log("Checking Batch:", batch);

            matchedSerial = batch.serialNumbers?.find(
                (sn) => sn.serialNumber === serialData.serialNumber
            );

            if (matchedSerial) {
                matchedProduct = product;
                matchedBatch = batch;
                break;
            }
        }
        if (matchedSerial) break;
    }

    if (!matchedProduct || !matchedBatch || !matchedSerial) {
        console.error("Product, batch, or serial number not found.");
        return;
    }

    console.log("Matched Product:", matchedProduct);
    console.log("Matched Batch:", matchedBatch);
    console.log("Matched Serial:", matchedSerial);

    // Reset assignedRoom if status is set to "Available" or "In_stock"
    if (serialData.status.toLowerCase().trim() === "available" || serialData.status.toLowerCase().trim() === "in_stock") {
        serialData.roomNumber = "-";
    }

    // Remove rentalPrice if rental is set to "No"
    if (serialData.rental === "No") {
        serialData.rentalPrice = "-"; // Or use "-" based on your requirements
    }

    // Update the rentalPrice field explicitly
    if (serialData.rentalPrice !== undefined) {
        matchedSerial.rentalPrice = serialData.rentalPrice;
    }

    // Update the rest of the serial data
    Object.assign(matchedSerial, serialData);
    console.log("Serial updated successfully:", matchedSerial);

    // Show success message
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: `Serial number ${matchedSerial.serialNumber} updated successfully`,
        life: 3000,
    });

    hideSerialDialog();
}

// State management
const isDialog2Visible = ref(false); // Controls the dialog visibility
const isDialogVisible = ref(false); // Controls the dialog visibility

async function assignItem() {
    if (!selectedItem.value) {
        console.error("No item selected for assignment.");
        return;
    }

    if (!selectedRoom.value) {
        console.error("No room selected for assignment.");
        return;
    }

    try {
        // Update the item in the serialNumbers array (for isDialog2Visible)
        const serialIndex = serialNumbers.value.findIndex(
            (item) => item.serialNumber === selectedItem.value.serialNumber
        );
        
        if (serialIndex !== -1) {
            serialNumbers.value[serialIndex].roomNumber = selectedRoom.value.roomNumber;
            serialNumbers.value[serialIndex].status = "Assigned";
        }

        // Also update in the main products data structure
        const targetProduct = products.value.find((product) =>
            product.batches.some((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            )
        );

        if (targetProduct) {
            const targetBatch = targetProduct.batches.find((batch) =>
                batch.serialNumbers.some(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                )
            );

            if (targetBatch) {
                const targetSerial = targetBatch.serialNumbers.find(
                    (sn) => sn.serialNumber === selectedItem.value.serialNumber
                );

                if (targetSerial) {
                    targetSerial.roomNumber = selectedRoom.value.roomNumber;
                    targetSerial.status = "Assigned";
                }
            }
        }

        // Update selectedItem for immediate UI feedback
        const assignedRoomNumber = selectedRoom.value.roomNumber;
        const assignedRoomId = selectedRoom.value.id || selectedRoom.value.roomId;
        
        selectedItem.value.roomNumber = assignedRoomNumber;
        selectedItem.value.status = "Assigned";

        console.log("Item successfully assigned:", selectedItem.value);

        // Validate data before sending
        if (!assignedRoomId) {
            throw new Error("Room ID is missing or invalid");
        }

        // Debug: Log the data being sent
        console.log("Assigning item:", {
            serialNumber: selectedItem.value.serialNumber,
            roomId: assignedRoomId,
            roomData: selectedRoom.value
        });

        // Persist assignment to database
        await assignItemToRoom(selectedItem.value.serialNumber, assignedRoomId);

        // Close the dialog
        assignItemDialogVisible.value = false;

        // Reset the selectedRoom
        selectedRoom.value = null;

        // Show success message
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: `Item ${selectedItem.value.serialNumber} assigned to Room ${assignedRoomNumber}.`,
            life: 3000,
        });
        
    } catch (error) {
        console.error("Error assigning item:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to assign item to room",
            life: 3000,
        });
    }
}

function openAssignItemDialog(item) {
    // Close the batch items dialog first
    isDialog2Visible.value = false;
    
    selectedItem.value = item;
    assignItemDialogVisible.value = true;
}
// Function to delete a serial number
async function deleteSerial() {
    if (!selectedSerialForDeletion.value || !selectedSerialForDeletion.value.serialNumber) {
        console.error("Invalid data for serial deletion.");
        return;
    }

    const serialNumber = selectedSerialForDeletion.value.serialNumber;
    
    try {
        // Call API to delete from database
        await deleteSerialById(serialNumber);
        
        // Remove from serialNumbers array (isDialog2Visible)
        const serialIndex = serialNumbers.value.findIndex(
            (item) => item.serialNumber === serialNumber
        );
        if (serialIndex !== -1) {
            serialNumbers.value.splice(serialIndex, 1);
        }
        
        // Remove from main products data structure
        for (const product of products.value) {
            for (const batch of product.batches || []) {
                const itemIndex = batch.serialNumbers.findIndex(
                    (item) => item.serialNumber === serialNumber
                );
                if (itemIndex !== -1) {
                    batch.serialNumbers.splice(itemIndex, 1);
                    break;
                }
            }
        }
        
        console.log("Serial deleted successfully:", serialNumber);
        
        // Show success toast
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: `Item ${serialNumber} deleted successfully.`,
            life: 3000,
        });
        
    } catch (error) {
        console.error("Error deleting serial:", error);
        
        // Show error toast
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete item. Please try again.",
            life: 3000,
        });
    } finally {
        // Close the dialog and reset the state
        deleteserialDialog.value = false;
        selectedSerialForDeletion.value = null;
    }
}

// Options for rental dropdown
const rentalOptions = [
    { label: "Yes", value: "Yes" },
    { label: "No", value: "No" },
];

async function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        try {
            if (product.value.id) {
                // Update existing product via API
                await updateProduct(product.value.id, {
                    name: product.value.name,
                    brand: product.value.brand,
                    category: product.value.category,
                    type: product.value.type,
                    unit: product.value.unit,
                    minimum_stock: product.value.minimum_stock,
                    stock_limit: product.value.stock_limit
                });

                // Update local data only if API call succeeds
                const index = products.value.findIndex(
                    (p) => p.id === product.value.id
                );
                if (index !== -1) {
                    products.value[index] = { ...products.value[index], ...product.value };
                }

                toast.value.add({
                    severity: "success",
                    summary: "Success",
                    detail: "Product updated successfully",
                    life: 3000
                });

                // Refresh data to get updated information
                await refreshProducts();
            } else {
                // Create new product (this would need a separate API endpoint)
                product.value.id = createId();
                products.value.push(product.value);
                
                toast.value.add({
                    severity: "info",
                    summary: "Info",
                    detail: "Product created locally (API endpoint needed for persistence)",
                    life: 3000
                });
            }
            
            productDialog.value = false;
            product.value = {};
            
        } catch (error) {
            console.error("Error saving product:", error);
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: "Failed to save product: " + error.message,
                life: 3000
            });
        }
    }
}

const warrantyUnitOptions = ref([
    { name: "Day(s)", value: "day" },
    { name: "Month(s)", value: "month" },
    { name: "Year(s)", value: "year" },
]);

const unitOptions = ref([
    // Weight
    { label: "Kilograms", value: "kilograms" },
    { label: "Grams", value: "grams" },
    { label: "Pounds", value: "pounds" },
    { label: "Ounces", value: "ounces" },

    // Volume
    { label: "Liters", value: "liters" },
    { label: "Milliliters", value: "milliliters" },
    { label: "Cubic Meters", value: "cubic_meters" },
    { label: "Gallons", value: "gallons" },
    { label: "Pints", value: "pints" },
    { label: "Fluid Ounces", value: "fluid_ounces" },

    // Count
    { label: "Pieces", value: "pieces" },
    { label: "Units", value: "units" },
    { label: "Items", value: "items" },
    { label: "Packages", value: "packages" },
    { label: "Boxes", value: "boxes" },
]);

async function saveNonConsumableBatchDetails() {
    if (
        !selectedBatch.value.batchNumber ||
        !selectedBatch.value.warrantyValue
    ) {
        console.error("Batch data is incomplete.");
        return;
    }

    // Ensure the `unit` field stores only the value, not the full object
    if (
        selectedBatch.value.unit &&
        typeof selectedBatch.value.unit === "object"
    ) {
        selectedBatch.value.unit = selectedBatch.value.unit.value;
    }

    try {
        // Make API call to update the batch in the database
        // Only include fields that are editable in Non-Consumable batch dialog
        const updateData = {
            batchNumber: selectedBatch.value.batchNumber,
            purchasePrice: selectedBatch.value.purchasePrice,
            supplier: selectedBatch.value.supplier,
            warranty: `${selectedBatch.value.warrantyValue} ${selectedBatch.value.warrantyUnit}`,
            unitRentalPrice: selectedBatch.value.unitRentalPrice || selectedBatch.value.rentalprice,
        };
        
        // Only include fields if they have values to avoid overwriting with null/undefined
        if (selectedBatch.value.quantity) updateData.quantity = selectedBatch.value.quantity;
        // Map frontend purchaseDate to backend arrivalDate to match database schema
        if (selectedBatch.value.purchaseDate) updateData.arrivalDate = selectedBatch.value.purchaseDate;
        if (selectedBatch.value.srp) updateData.unitRetailPrice = selectedBatch.value.srp;
        if (selectedBatch.value.status) updateData.status = selectedBatch.value.status;

        await updateBatch(selectedBatch.value.batchId, updateData);

        // Update the local data only if API call succeeds
        const productIndex = products.value.findIndex((product) =>
            product.batches?.some(
                (batch) => batch.batchId === selectedBatch.value.batchId
            )
        );

        if (productIndex !== -1) {
            const batchIndex = products.value[productIndex].batches.findIndex(
                (batch) => batch.batchId === selectedBatch.value.batchId
            );

            if (batchIndex !== -1) {
                // Update the batch data
                products.value[productIndex].batches[batchIndex] = {
                    ...selectedBatch.value,
                };
                console.log("Batch updated successfully:", selectedBatch.value);
            }
        }

        showSuccess();
        NonConsumablebatchDialog.value = false;
        
        // Refresh the data to show updated information
        await refreshProducts();
        
    } catch (error) {
        console.error("Error updating batch:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to update batch: " + error.message,
            life: 3000
        });
    }
}

function showSuccess() {
    toast.value.add({
        severity: "success",
        summary: "Success",
        detail: "Edit Successful",
        life: 3000,
    });
}

const NonConsumablSerialDialog = ref(false);

const selectedSerial = ref({
    serialNumber: "",
    status: "Available",
    rental: "No", // Default rental status
    rentalPrice: "",
});

// Options for rental dropdown

// Edit serial function
function editSerial(serial) {
    selectedSerial.value = {
        rental: "No", // Default value
        rentalPrice: null, // Default price
        ...serial, // Clone the rest of the data
    };
    NonConsumablSerialDialog.value = true;
    console.log("Selected serial:", selectedSerial.value);
}

// Close dialog and reset the form
function hideSerialDialog() {
    NonConsumablSerialDialog.value = false;

    // Reset selectedSerial
    selectedSerial.value = {
        serialNumber: "",
        status: "",
        roomNumber: "",
    };
    console.log("Dialog closed and form reset.");
}

function saveBatchDetails() {
    // Mark form as submitted to trigger validation messages
    submitted.value = true;

    // Validate required fields
    if (
        !selectedBatch.value.batchNumber ||
        !selectedBatch.value.quantity ||
        !selectedBatch.value.purchaseDate ||
        !selectedBatch.value.purchasePrice ||
        !selectedBatch.value.unit ||
        !selectedBatch.value.supplier ||
        !selectedBatch.value.expDate
    ) {
        console.error("Validation failed: All required fields must be filled.");
        return;
    }

    // Find the product containing the batch
    const productIndex = products.value.findIndex((product) =>
        product.batches?.some(
            (batch) => batch.batchId === selectedBatch.value.batchId
        )
    );

    if (productIndex !== -1) {
        // Find the batch within the product's batches
        const batchIndex = products.value[productIndex].batches.findIndex(
            (batch) => batch.batchId === selectedBatch.value.batchId
        );

        if (batchIndex !== -1) {
            // Update the existing batch
            products.value[productIndex].batches[batchIndex] = {
                ...selectedBatch.value,
            };
            console.log(
                "Batch updated successfully:",
                products.value[productIndex].batches[batchIndex]
            );
        } else {
            // Add a new batch to the product's batches
            selectedBatch.value.batchId = createId(); // Generate a new ID for the batch
            products.value[productIndex].batches.push({
                ...selectedBatch.value,
            });
            console.log(
                "New batch added to product:",
                products.value[productIndex]
            );
        }
    } else {
        console.warn("Product containing this batch was not found.");
    }

    showSuccess();
    // Close the dialog after successful save
    batchDialog.value = false;

    // Reset form state
    submitted.value = false;
    Object.keys(selectedBatch.value).forEach((key) => {
        selectedBatch.value[key] = null;
    });

    console.log("Form closed and reset.");
}

function createId() {
    return Math.random().toString(36).substr(2, 9);
}

function confirmDeleteProduct(prod) {
    // Check if this is a non-consumable product with assigned serial numbers
    if (prod.category === 'Non-Consumable') {
        let totalAssignedSerials = 0;
        
        // Check all batches in this product for assigned serial numbers
        if (prod.batches && Array.isArray(prod.batches)) {
            for (const batch of prod.batches) {
                if (batch.serialNumbers && Array.isArray(batch.serialNumbers)) {
                    const assignedSerials = batch.serialNumbers.filter(serial => 
                        serial.status === 'Assigned' || 
                        (serial.roomNumber && serial.roomNumber !== '-' && serial.roomNumber !== '')
                    );
                    totalAssignedSerials += assignedSerials.length;
                }
            }
        }

        if (totalAssignedSerials > 0) {
            // Show warning toast for assigned items
            toast.value.add({
                severity: "warn",
                summary: "Cannot Delete Product",
                detail: `This non-consumable product has ${totalAssignedSerials} item(s) currently assigned to rooms across all batches. Please unassign all items from rooms before deleting the product.`,
                life: 6000,
            });
            return; // Prevent deletion
        }
    }

    product.value = prod; // Set the product to be deleted
    deleteProductDialog.value = true; // Show the confirmation dialog
}

async function deleteProduct() {
    if (product.value) {
        try {
            // Make API call to delete the product from the database
            await deleteProductById(product.value.id);

            // Remove from local data only if API call succeeds
            const index = products.value.findIndex(
                (p) => p.id === product.value.id
            );
            if (index !== -1) {
                products.value.splice(index, 1); // Remove the product from the list
            }

            deleteProductDialog.value = false; // Close the dialog
            product.value = null; // Reset the product reference
            
            toast.value.add({
                severity: "success",
                summary: "Success",
                detail: "Product deleted successfully",
                life: 3000
            });

            // Refresh data to ensure consistency
            await refreshProducts();
            
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.value.add({
                severity: "error",
                summary: "Error",
                detail: "Failed to delete product: " + error.message,
                life: 3000
            });
            
            // Close dialog even on error
            deleteProductDialog.value = false;
        }
    }
}

function getOrderSeverity(order) {
    switch (order.status) {
        case "DELIVERED":
            return "success";

        case "IN_STOCK":
            return "success";

        case "CANCELLED":
            return "danger";

        case "OUT_OF_STOCK":
            return "danger";

        case "EXPIRED":
            return "danger";

        case "PENDING":
            return "warn";

        case "RETURNED":
            return "info";

        default:
            return null;
    }
}

function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        brand: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        category: { value: null, matchMode: FilterMatchMode.EQUALS },
        type: { value: null, matchMode: FilterMatchMode.EQUALS },
        unit: { value: null, matchMode: FilterMatchMode.EQUALS },
        minimum_stock: { value: null, matchMode: FilterMatchMode.EQUALS },
        stock_limit: { value: null, matchMode: FilterMatchMode.EQUALS },
        inventoryStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
    };
}

// Function to open the first dialog
function toggleDataTable(item) {
    selectedItem.value = item; // Set the selected item
    isDialogVisible.value = true; // Open the dialog
}

// Function to open the second dialog
function toggleDataTable2(item) {
    selectedBatch.value = item; // Store the selected batch data
    selectedItem.value = item; // Set the selected item
    // Store the serial numbers for this specific batch
    serialNumbers.value = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];
    isDialog2Visible.value = true; // Open the dialog
}

function getStockSeverity(product) {
    switch (product.inventoryStatus) {
        case "INSTOCK":
            return "success";

        case "LOWSTOCK":
            return "warn";

        case "OUTOFSTOCK":
            return "danger";

        default:
            return null;
    }
}

function formatDate(value) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

function formatDateTime(value) {
    if (!value) return '-';
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).format(new Date(value));
}

onBeforeMount(async () => {
    try {
        const data = await ProductService.getProductsWithOrders();
        
        if (Array.isArray(data)) {
            // Ensure each product has required fields and proper structure
            products.value = data.map(product => ({
                ...product,
                id: product.id || Math.random(),
                batches: Array.isArray(product.batches) ? product.batches.map(batch => ({
                    ...batch,
                    batchId: batch.item_id || batch.batchId || batch.id,
                    serialNumbers: Array.isArray(batch.serialNumbers) ? batch.serialNumbers : []
                })) : []
            }));
        } else {
            products.value = [];
        }
    } catch (error) {
        console.error("Error loading products:", error);
        products.value = [];
    }
    // Other service calls...
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    brand: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
    inventoryStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
});

function editbatch(batchData) {
    if (!batchData) {
        console.error("Batch data is not defined");
        return;
    }
    selectedBatch.value = { ...batchData }; // Clone the batch data
    batchDialog.value = true; // Open the dialog
}

function openNonConsumableBatchDialog(batchData) {
    if (!batchData) {
        console.error("Batch data is undefined");
        return;
    }

    // Clone the batch data into selectedBatch
    selectedBatch.value = { ...batchData };

    // Map property names for consistency between frontend and database schema
    if (batchData.rentalprice && !selectedBatch.value.unitRentalPrice) {
        selectedBatch.value.unitRentalPrice = batchData.rentalprice;
    }
    
    // Map database arrival_date to frontend purchaseDate
    if (batchData.arrivalDate && !selectedBatch.value.purchaseDate) {
        selectedBatch.value.purchaseDate = batchData.arrivalDate;
    }

    // Parse warranty if it's a string like "12 months"
    if (selectedBatch.value.warranty && typeof selectedBatch.value.warranty === 'string') {
        const warrantyParts = selectedBatch.value.warranty.split(' ');
        selectedBatch.value.warrantyValue = parseInt(warrantyParts[0]) || 1;
        selectedBatch.value.warrantyUnit = warrantyParts[1] || 'year';
    } else {
        // Ensure warrantyValue and warrantyUnit are defined
        if (!selectedBatch.value.warrantyValue) {
            selectedBatch.value.warrantyValue = 1; // Default warranty value
        }
        if (!selectedBatch.value.warrantyUnit) {
            selectedBatch.value.warrantyUnit = "year"; // Default warranty unit
        }
    }

    NonConsumablebatchDialog.value = true;

    console.log("Opening dialog with data:", selectedBatch.value);
}

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        brand: {
            operator: FilterOperator.AND,
            constraints: [
                { value: null, matchMode: FilterMatchMode.STARTS_WITH },
            ],
        },
        category: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        type: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        unit: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        minimum_stock: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        stock_limit: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
        inventoryStatus: {
            operator: FilterOperator.AND,
            constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
        },
    };
}

function expandAll() {
    try {
        const validProducts = safeProducts.value;
        if (!Array.isArray(validProducts) || validProducts.length === 0) {
            console.warn("No products available for expansion");
            expandedRows.value = {};
            return;
        }
        
        expandedRows.value = validProducts.reduce((acc, p) => {
            if (p && typeof p.id !== 'undefined') {
                acc[p.id] = true;
            }
            return acc;
        }, {});
        
        console.log("Expanded all rows:", expandedRows.value);
    } catch (error) {
        console.error("Error expanding all rows:", error);
        expandedRows.value = {};
    }
}

function collapseAll() {
    try {
        expandedRows.value = {};
        batchExpandedRows.value = {};
        console.log("Collapsed all rows");
    } catch (error) {
        console.error("Error collapsing rows:", error);
        expandedRows.value = {};
        batchExpandedRows.value = {};
    }
}

function toggleRowExpansion(event) {
    try {
        // Check if the click is on a button or within a button element
        const target = event.originalEvent?.target;
        if (target && (target.closest('.p-button') || target.closest('button') || target.tagName === 'BUTTON')) {
            console.log("Click on button detected, skipping row expansion");
            return;
        }

        const rowData = event.data;
        if (!rowData || typeof rowData.id === 'undefined') {
            console.warn("Invalid row data for expansion:", rowData);
            return;
        }
        
        // Debug: Log current state
        console.log("Current products count:", products.value?.length || 0);
        console.log("Current safeProducts count:", safeProducts.value?.length || 0);
        
        // Toggle expansion state
        if (expandedRows.value[rowData.id]) {
            delete expandedRows.value[rowData.id];
        } else {
            expandedRows.value[rowData.id] = true;
        }
        
        console.log("Toggled row expansion for:", rowData.id, expandedRows.value[rowData.id] ? 'expanded' : 'collapsed');
        
        // Debug: Log state after toggle
        console.log("Products after toggle:", products.value?.length || 0);
        console.log("SafeProducts after toggle:", safeProducts.value?.length || 0);
        
    } catch (error) {
        console.error("Error toggling row expansion:", error);
    }
}

function toggleBatchRowExpansion(event) {
    try {
        // Check if the click is on a button or within a button element
        const target = event.originalEvent?.target;
        if (target && (target.closest('.p-button') || target.closest('button') || target.tagName === 'BUTTON')) {
            console.log("Click on button detected, skipping batch expansion");
            return;
        }

        const batchData = event.data;
        if (!batchData || typeof batchData.batchId === 'undefined') {
            console.warn("Invalid batch data for expansion:", batchData);
            return;
        }
        
        // Toggle batch expansion state
        if (batchExpandedRows.value[batchData.batchId]) {
            delete batchExpandedRows.value[batchData.batchId];
        } else {
            batchExpandedRows.value[batchData.batchId] = true;
        }
        
        console.log("Toggled batch expansion for:", batchData.batchId, batchExpandedRows.value[batchData.batchId] ? 'expanded' : 'collapsed');
    } catch (error) {
        console.error("Error toggling batch expansion:", error);
    }
}

function confirmDeleteBatch(batch) {
    if (!batch || !batch.batchId) {
        console.error("Invalid batch data passed to confirmDeleteBatch.");
        return;
    }

    // Attach the productId to the batch for easier lookup
    const productContainingBatch = products.value.find((product) =>
        product.batches?.some((b) => b.batchId === batch.batchId)
    );

    if (!productContainingBatch) {
        console.error("Product containing the batch not found.");
        return;
    }

    // Check if this is a non-consumable item with assigned serial numbers
    if (productContainingBatch.category === 'Non-Consumable') {
        const assignedSerials = batch.serialNumbers?.filter(serial => 
            serial.status === 'Assigned' || 
            (serial.roomNumber && serial.roomNumber !== '-' && serial.roomNumber !== '')
        ) || [];

        if (assignedSerials.length > 0) {
            // Show warning toast for assigned items
            toast.value.add({
                severity: "warn",
                summary: "Cannot Delete Batch",
                detail: `This batch has ${assignedSerials.length} item(s) currently assigned to rooms. Please unassign all items from rooms before deleting the batch.`,
                life: 6000,
            });
            return; // Prevent deletion
        }
    }

    selectedBatchForDeletion.value = {
        ...batch,
        productId: productContainingBatch.id,
    };

    deleteBatchDialog.value = true;

    console.log("Batch set for deletion:", selectedBatchForDeletion.value);
}

async function deleteBatch() {
    if (
        !selectedBatchForDeletion.value ||
        !selectedBatchForDeletion.value.batchId ||
        !selectedBatchForDeletion.value.productId
    ) {
        console.error("Invalid batch or product ID for deletion.");
        return;
    }

    try {
        // Debug: Log the batchId being sent
        console.log("Attempting to delete batch with ID:", selectedBatchForDeletion.value.batchId);
        console.log("Full batch data:", selectedBatchForDeletion.value);
        
        // Make API call to delete the batch from the database
        await deleteBatchById(selectedBatchForDeletion.value.batchId);

        // Remove from local data only if API call succeeds
        const productIndex = products.value.findIndex(
            (product) => product.id === selectedBatchForDeletion.value.productId
        );

        if (productIndex !== -1) {
            const batchIndex = products.value[productIndex].batches.findIndex(
                (batch) => batch.batchId === selectedBatchForDeletion.value.batchId
            );

            if (batchIndex !== -1) {
                // Remove the batch from the product's batch list
                products.value[productIndex].batches.splice(batchIndex, 1);
                console.log("Batch deleted successfully");
            }
        }

        // Close the dialog
        deleteBatchDialog.value = false;
        
        toast.value.add({
            severity: "success",
            summary: "Success",
            detail: "Batch deleted successfully",
            life: 3000
        });
        
        // Refresh the data to show updated information
        await refreshProducts();
        
    } catch (error) {
        console.error("Error deleting batch:", error);
        toast.value.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete batch: " + error.message,
            life: 3000
        });
    }

    // Reset the selectedBatchForDeletion
    selectedBatchForDeletion.value = null;

    console.log("Batch deleted successfully.");
    showError();
}

function showError() {
    toast.value.add({
        severity: "error",
        summary: "Deleted",
        detail: "Deleted Successfuly",
        life: 3000,
    });
}

function formatCurrency(value) {
    if (value == null || value === '' || isNaN(parseFloat(value))) return "₱0.00"; // Default if invalid or null
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(parseFloat(value));
}

function getStatusTextColor(status) {
    switch (status.toLowerCase()) {
        case "rented":
            return "text-yellow-600"; // Yellow for rented
        case "available":
            return "text-green-600"; // Green for available
        case "in_stock":
            return "text-green-600"; // Green for in_stock
        case "damaged":
            return "text-red-600"; // Red for damaged
        case "assigned":
            return "text-blue-600"; // Blue for assigned
        default:
            return "text-gray-600"; // Default gray
    }
}

function formatPrice(value) {
    if (value == null || isNaN(value)) return "₱0.00"; // Handle null or invalid value
    return `₱${parseFloat(value).toFixed(2).toLocaleString()}`; // Format to 2 decimal places with commas
}


</script>

<style scoped>
/* Make rows visually clickable */
:deep(.cursor-pointer) {
    cursor: pointer;
}

:deep(.cursor-pointer:hover) {
    background-color: #f8f9fa !important;
}

/* Ensure action buttons don't trigger row click */
:deep(.cursor-pointer .p-button) {
    position: relative;
    z-index: 10;
}
</style>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Item Control</div>
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
            <i class="pi pi-spin pi-spinner text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Loading Inventory</h3>
            <p class="text-gray-500 dark:text-gray-500">Please wait while we fetch your inventory items...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
            <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Error Loading Items</h3>
            <p class="text-gray-500 dark:text-gray-500 mb-4">{{ error }}</p>
            <Button
                icon="pi pi-refresh"
                label="Try Again"
                severity="danger"
                @click="refreshProducts"
            />
        </div>

        <!-- Empty State -->
        <div v-else-if="!safeProducts.length" class="text-center py-12">
            <i class="pi pi-box text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Items in Inventory</h3>
            <p class="text-gray-500 dark:text-gray-500 mb-4">
                Your inventory is empty. You can:<br>
                • Add new products<br>
                • Create batches<br>
                • Manage serial numbers<br><br>
                Get started by adding your first item!
            </p>
        </div>

        <!-- Search No Results State -->
        <div v-else-if="filters.global?.value && !filteredProducts.length" class="text-center py-12">
            <i class="pi pi-search text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
            <h3 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Results Found</h3>
            <p class="text-gray-500 dark:text-gray-500 mb-4">
                No items match your search "{{ filters.global.value }}"<br>
                Try adjusting your search terms or clear the filter to see all items.
            </p>
            <Button
                icon="pi pi-times"
                label="Clear Search"
                class="p-button-text"
                @click="clearFilter"
            />
        </div>

        <!-- DataTable when data exists -->
        <DataTable
            v-else
            v-model:expandedRows="expandedRows"
            :value="safeProducts"
            dataKey="id"
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="[
                'name',
                'brand',
                'category',
                'type',
                'unit',
                'minimum_stock',
                'stock_limit',
                'inventoryStatus',
            ]"
            tableStyle="min-width: 60rem"
            paginator
            :rows="10"
            @row-click="toggleRowExpansion"
            :rowClass="() => 'cursor-pointer'"
        >
            <template #header>
                <div class="flex justify-between items-center">
                    <!-- Filter Controls -->
                    <div class="flex items-center gap-2">
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="Clear"
                            outlined
                            @click="clearFilter()"
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText
                                v-model="filters['global'].value"
                                placeholder="Keyword Search"
                            />
                        </IconField>
                    </div>

                    <!-- Expand/Collapse Buttons -->
                    <div class="flex flex-wrap justify-end gap-2">
                        <Button
                            text
                            icon="pi pi-plus"
                            label="Expand All"
                            @click="expandAll"
                        />
                        <Button
                            text
                            icon="pi pi-minus"
                            label="Collapse All"
                            @click="collapseAll"
                        />
                    </div>
                </div>
            </template>

            <Column expander style="width: 2rem" />
            <Column
                field="name"
                header="Item Name"
                style="min-width: "
            ></Column>
            <Column field="brand" sortable header="Brand"></Column>
            <Column
                field="category"
                sortable
                header="Category"
                style="width: 10rem"
            ></Column>
            <Column
                field="type"
                sortable
                header="Type"
                style="width: 10rem"
            ></Column>
            <Column
                field="unit"
                sortable
                header="Unit"
                style="width: 8rem"
            ></Column>
            <Column
                field="created_at"
                sortable
                header="Date Added"
                style="width: 12rem"
            >
                <template #body="slotProps">
                    <span>{{ formatDateTime(slotProps.data.created_at) }}</span>
                </template>
            </Column>
            <Column
                field="minimum_stock"
                sortable
                header="Minimum Stock"
                style="width: 9rem"
            >
                <template #body="slotProps">
                    <span>{{ slotProps.data.minimum_stock || 0 }}</span>
                </template>
            </Column>
            <Column
                field="stock_limit"
                sortable
                header="Stock Limit"
                style="width: 10rem"
            >
                <template #body="slotProps">
                    <span>{{ slotProps.data.stock_limit || 0 }}</span>
                </template>
            </Column>
            <Column field="inventoryStatus" sortable header="Status">
                <template #body="slotProps">
                    <Tag
                        :value="slotProps.data.inventoryStatus"
                        :severity="getStockSeverity(slotProps.data)"
                    />
                </template>
            </Column>

            <!---not expand actions column----->
            <Column
                field="Actions"
                header="Actions"
                :exportable="false"
                style="min-width: 12rem"
            >
                <template #body="slotProps">
                    <Button
                        icon="pi pi-pencil"
                        outlined
                        rounded
                        class="mr-2"
                        @click="editProduct(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        outlined
                        rounded
                        severity="danger"
                        @click="confirmDeleteProduct(slotProps.data)"
                    />
                </template>
            </Column>

            <template #expansion="slotProps">
                <!--Consumable Batch Table-->
                <DataTable
                    class="p-datatable-sm"
                    :paginator="true"
                    :rows="10"
                    v-model:expandedRows="batchExpandedRows"
                    :value="
                        filterConsumableBatches(slotProps.data?.batches || [])
                    "
                    dataKey="batchId"
                    v-if="slotProps.data?.category === 'Consumable'"
                    @row-click="toggleBatchRowExpansion"
                    :rowClass="() => 'cursor-pointer'"
                >
                    <div class="flex items-center gap-2 mb-4">
                        <h5>Batch List for {{ slotProps.data.name }}</h5>
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="Clear"
                            outlined
                            @click="clearConsumableFilter"
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText
                                v-model="ConsumableBatchSearch"
                                placeholder="Search consumable batches..."
                                class="w-full"
                            />
                        </IconField>
                    </div>
                    <Column
                        field="batchNumber"
                        header="Batch Number"
                        sortable
                    ></Column>
                    <Column
                        field="quantity"
                        header="Quantity"
                        sortable
                    ></Column>
                    <Column
                        field="purchaseDate"
                        header="Arrival Date"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatDateTime(slotProps.data.purchaseDate)
                            }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchasePrice"
                        header="Purchase Price"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatPrice(slotProps.data.purchasePrice)
                            }}</span>
                        </template>
                    </Column>

                    <Column field="srp" header="SRP" sortable>
                        <template #body="slotProps">
                            <span>{{ 
                                (slotProps.data.srp && !isNaN(parseFloat(slotProps.data.srp)))
                                ? `₱${parseFloat(slotProps.data.srp).toFixed(2)}` 
                                : '-' 
                            }}</span>
                        </template>
                    </Column>
                    <Column field="unit" header="Unit" sortable></Column>
                    <Column
                        field="supplier"
                        header="Supplier"
                        sortable
                    ></Column>

                    <Column field="expDate" header="Exp Date" sortable>
                        <template #body="slotProps">
                            <span style="color: red">{{
                                formatDate(slotProps.data.expDate)
                            }}</span>
                        </template>
                    </Column>
                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.status"
                                :severity="getOrderSeverity(slotProps.data)"
                            />
                        </template>
                    </Column>
                    <Column
                        field="Actions"
                        header="Actions"
                        :exportable="false"
                        style="min-width: 3rem"
                        class="gap-2"
                    >
                        <template #body="slotProps">
                            <div class="flex">
                                <Button
                                    icon="pi pi-pencil"
                                    outlined
                                    rounded
                                    class="mb-1 mr-2"
                                    @click="editbatch(slotProps.data)"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    outlined
                                    rounded
                                    severity="danger"
                                    @click="confirmDeleteBatch(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!--Non-Consumable Batch Table-->
                <DataTable
                    class="p-datatable-sm"
                    :paginator="true"
                    :rows="10"
                    v-model:expandedRows="batchExpandedRows"
                    :value="
                        filterNonConsumableBatches(
                            slotProps.data?.batches || []
                        )
                    "
                    dataKey="batchId"
                    v-if="slotProps.data?.category === 'Non-Consumable'"
                    @row-click="toggleBatchRowExpansion"
                    :rowClass="() => 'cursor-pointer'"
                >
                    <div class="flex items-center gap-2 mb-4">
                        <h5>Batch List for {{ slotProps.data.name }}</h5>
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="Clear"
                            outlined
                            @click="clearNonConsumableBatchFilter"
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText
                                v-model="NonConsumableBatchSearch"
                                placeholder="Search non-consumable items..."
                                class="w-full"
                            />
                        </IconField>
                    </div>

                    <Column
                        field="batchNumber"
                        header="Serial Number"
                        sortable
                    ></Column>
                    <Column
                        field="purchaseDate"
                        header="Arrival Date"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                slotProps.data.purchaseDate ? formatDateTime(slotProps.data.purchaseDate) : '-'
                            }}</span>
                        </template>
                    </Column>
                    <Column
                        field="purchasePrice"
                        header="Purchase Price"
                        sortable
                    >
                        <template #body="slotProps">
                            <span>{{
                                formatPrice(slotProps.data.purchasePrice)
                            }}</span>
                        </template>
                    </Column>

                    <Column
                        field="supplier"
                        header="Supplier"
                        sortable
                    ></Column>

                    <Column
                        field="rentalprice"
                        header="Rental Price"
                        sortable
                    ></Column>

                    <Column field="warranty" header="Warranty" sortable>
                        <template #body="slotProps">
                            <span
                                >{{ slotProps.data.warrantyValue }}
                                {{ slotProps.data.warrantyUnit }}</span
                            >
                        </template>
                    </Column>
                    <Column
                        field="quantity"
                        header="Quantity"
                        sortable
                    ></Column>

                    <Column field="status" header="Status" sortable>
                        <template #body="slotProps">
                            <Tag
                                :value="slotProps.data.status"
                                :severity="getOrderSeverity(slotProps.data)"
                            />
                        </template>
                    </Column>
                    <Column
                        field="Actions"
                        header="Actions"
                        :exportable="false"
                        style="min-width: 3rem"
                    >
                        <template #body="slotProps">
                            <div class="flex">
                                <Button
                                    icon="pi pi-pencil"
                                    outlined
                                    rounded
                                    class="mr-2"
                                    @click="
                                        openNonConsumableBatchDialog(
                                            slotProps.data
                                        )
                                    "
                                />
                                <Button
                                    icon="pi pi-trash"
                                    outlined
                                    rounded
                                    severity="danger"
                                    @click="confirmDeleteBatch(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>

                    <column header="Items">
                        <template #body="slotProps">
                            <div class="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    icon="pi pi-list"
                                    @click="toggleDataTable2(slotProps.data)"
                                    rounded
                                    class="mr-2"
                                />
                                <Dialog
                                    v-model:visible="isDialog2Visible"
                                    :header="`Batch | ${
                                        selectedBatch?.batchNumber || 'N/A'
                                    }`"
                                    :breakpoints="{ '960px': '75vw' }"
                                    :style="{ width: '60vw' }"
                                    :modal="true"
                                    :dismissable-mask="true"
                                >
                                    <DataTable
                                        v-model:selection="selectedProduct"
                                        :value="serialNumbers"
                                        selectionMode="single"
                                    >
                                        <DataTable
                                            class="p-datatable-xl"
                                            :value="serialNumbers"
                                            :totalRecords="serialNumbers.length"
                                            :rows="5"
                                            paginator
                                            @row-select="onProductSelect"
                                        >
                                            <Column
                                                field="serialNumber"
                                                header="Serial Number"
                                                sortable
                                            ></Column>
                                            <Column
                                                field="status"
                                                header="Status"
                                                sortable
                                            >
                                                <!-- Custom Template for Status -->
                                                <template #body="slotProps">
                                                    <span
                                                        :class="
                                                            getStatusTextColor(
                                                                slotProps.data
                                                                    .status
                                                            )
                                                        "
                                                        class="font-bold"
                                                    >
                                                        {{
                                                            slotProps.data
                                                                .status
                                                        }}
                                                    </span>
                                                </template>
                                            </Column>

                                            <Column
                                                field="roomNumber"
                                                header="Assigned Room"
                                                sortable
                                            ></Column>
                                            <Column
                                                :exportable="false"
                                                header="Actions"
                                            >
                                                <template #body="slotProps">
                                                    <div class="flex gap-2">
                                                        <!-- Conditional Assign Button -->
                                                        <Button
                                                            v-if="
                                                                slotProps.data.status.toLowerCase() ===
                                                                'available' ||
                                                                slotProps.data.status.toLowerCase() ===
                                                                'in_stock'
                                                            "
                                                            icon="pi pi-arrow-up-right"
                                                            outlined
                                                            rounded
                                                            severity="success"
                                                            @click="
                                                                openAssignItemDialog(
                                                                    slotProps.data
                                                                )
                                                            "
                                                            v-tooltip="
                                                                'Assign Item to Room'
                                                            "
                                                        />

                                                        <!-- Button Visible for 'Assigned' Status -->
                                                        <Button
                                                            v-if="
                                                                slotProps.data.status.toLowerCase() ===
                                                                'assigned'
                                                            "
                                                            icon="pi pi-arrows-h"
                                                            outlined
                                                            rounded
                                                            severity="info"
                                                            @click="
                                                                reassign(
                                                                    slotProps.data
                                                                )
                                                            "
                                                            v-tooltip="
                                                                'Re-Assign Item'
                                                            "
                                                        ></Button>

                                                        <!-- Edit Serial Button -->
                                                        <Button
                                                            icon="pi pi-pencil"
                                                            outlined
                                                            rounded
                                                            severity="warning"
                                                            @click="
                                                                openEditSerialDialog(
                                                                    slotProps.data
                                                                )
                                                            "
                                                            v-tooltip="
                                                                'Edit Serial Number'
                                                            "
                                                        />

                                                        <!-- Delete Button -->
                                                        <Button
                                                            v-if="
                                                                slotProps.data.status.toLowerCase() ===
                                                                    'available' ||
                                                                slotProps.data.status.toLowerCase() ===
                                                                    'assigned' ||
                                                                slotProps.data.status.toLowerCase() ===
                                                                    'damaged' ||
                                                                slotProps.data.status.toLowerCase() ===
                                                                    'in_stock'
                                                            "
                                                            icon="pi pi-trash"
                                                            outlined
                                                            rounded
                                                            severity="danger"
                                                            @click="
                                                                confirmDeleteSerial(
                                                                    slotProps.data
                                                                )
                                                            "
                                                            v-tooltip="
                                                                'Delete Item'
                                                            "
                                                        />
                                                    </div>
                                                </template>
                                            </Column>
                                        </DataTable>
                                    </DataTable>
                                </Dialog>
                            </div>
                        </template>
                    </column>
                </DataTable>
            </template>
        </DataTable>
    </div>

    <!-- Delete Product Dialog -->
    <Dialog
        v-model:visible="deleteProductDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="product"
                >Are you sure you want to delete <b>{{ product.name }}</b
                >?</span
            >
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteProductDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
        </template>
    </Dialog>

    <!-- Edit Product Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="productDialog"
        :style="{ width: '450px' }"
        header="Product Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-3">Name</label>
                <InputText
                    id="name"
                    v-model.trim="product.name"
                    required="true"
                    :invalid="submitted && !product.name"
                    fluid
                />
                <small v-if="submitted && !product.name" class="text-red-500"
                    >Name is required.</small
                >
            </div>
            <div>
                <label for="brand" class="block font-bold mb-3">Brand</label>
                <InputText
                    id="brand"
                    v-model.trim="product.brand"
                    required="true"
                    :invalid="submitted && !product.brand"
                    fluid
                />
                <small v-if="submitted && !product.brand" class="text-red-500"
                    >brand is required.</small
                >
            </div>
            <div>
                <label for="category" class="block font-bold mb-3">Category</label>
                <Select
                    id="category"
                    v-model="product.category"
                    :options="[{label: 'Consumable', value: 'Consumable'}, {label: 'Non-Consumable', value: 'Non-Consumable'}]"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Category"
                    fluid
                />
                <small v-if="submitted && !product.category" class="text-red-500"
                    >Category is required.</small
                >
            </div>
            <div>
                <label for="type" class="block font-bold mb-3">Type</label>
                <InputText
                    id="type"
                    v-model.trim="product.type"
                    fluid
                />
            </div>
            <div>
                <label for="unit" class="block font-bold mb-3">Unit</label>
                <InputText
                    id="unit"
                    v-model.trim="product.unit"
                    fluid
                />
            </div>
            <div>
                <label for="minimum_stock" class="block font-bold mb-3">Minimum Stock</label>
                <InputNumber
                    id="minimum_stock"
                    v-model="product.minimum_stock"
                    :min="0"
                    fluid
                />
            </div>
            <div>
                <label for="stock_limit" class="block font-bold mb-3">Stock Limit</label>
                <InputNumber
                    id="stock_limit"
                    v-model="product.stock_limit"
                    :min="0"
                    fluid
                />
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveProduct" />
        </template>
    </Dialog>

    <!-- Delete Bactch Dialog-->
    <Dialog
        v-model:visible="deleteBatchDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="selectedBatchForDeletion">
                Are you sure you want to delete
                <b>{{ selectedBatchForDeletion.batchNumber }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteBatchDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteBatch" />
        </template>
    </Dialog>

    <!-- Edit  Consumable Batch  Details Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="batchDialog"
        :style="{ width: '450px' }"
        header="Batch Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Batch Number -->
            <div>
                <label for="batchNumber" class="block font-bold mb-3"
                    >Batch Number</label
                >
                <InputText
                    id="batchNumber"
                    v-model.trim="selectedBatch.batchNumber"
                    required="true"
                    :invalid="submitted && !selectedBatch.batchNumber"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.batchNumber"
                    class="text-red-500"
                    >Batch Number is required.</small
                >
            </div>

            <!-- Arrival Date -->
            <div>
                <label for="purchaseDate" class="block font-bold mb-3"
                    >Arrival Date</label
                >
                <DatePicker
                    id="purchaseDate"
                    v-model="selectedBatch.purchaseDate"
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.purchaseDate"
                    class="text-red-500"
                    >Arrival Date is required.</small
                >
            </div>

            <!-- Purchase Price -->
            <div>
                <label for="purchasePrice" class="block font-bold mb-3"
                    >Purchase Price</label
                >
                <InputNumber
                    id="purchasePrice"
                    v-model="selectedBatch.purchasePrice"
                    mode="currency"
                    currency="PHP"
                    required="true"
                    :invalid="submitted && !selectedBatch.purchasePrice"
                    fluid
                />
            </div>

            <div>
                <label for="srp" class="block font-bold mb-3">SRP</label>
                <InputNumber
                    id="srp"
                    v-model="selectedBatch.srp"
                    mode="currency"
                    currency="PHP"
                    fluid
                />
            </div>

            <!-- Supplier -->
            <div>
                <label for="supplier" class="block font-bold mb-3"
                    >Supplier</label
                >
                <InputText
                    id="supplier"
                    v-model="selectedBatch.supplier"
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.supplier"
                    class="text-red-500"
                    >Supplier is required.</small
                >
            </div>

            <!-- Expiration Date -->
            <div>
                <label for="expDate" class="block font-bold mb-3"
                    >Expiration Date</label
                >
                <DatePicker
                    id="expDate"
                    v-model="selectedBatch.expDate"
                    showIcon
                    required="true"
                    fluid
                />
                <small
                    v-if="submitted && !selectedBatch.expDate"
                    class="text-red-500"
                    >Expiration Date is required.</small
                >
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveBatchDetails" />
        </template>
    </Dialog>

    <!-- Edit Non-Consumable Batch Details Dialog -->
    <Dialog
        :dismissableMask="true"
        v-model:visible="NonConsumablebatchDialog"
        :style="{ width: '450px' }"
        header="Batch Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Batch Number -->
            <div>
                <label for="batchNumber" class="block font-bold mb-3"
                    >Serial Number</label
                >
                <InputText
                    id="batchNumber"
                    v-model.trim="selectedBatch.batchNumber"
                    fluid
                />
            </div>

            <!-- Purchase Price -->
            <div>
                <label for="purchasePrice" class="block font-bold mb-3"
                    >Purchase Price</label
                >
                <InputNumber
                    id="purchasePrice"
                    v-model="selectedBatch.purchasePrice"
                    mode="currency"
                    currency="PHP"
                    fluid
                />
            </div>

            <!-- Supplier -->
            <div>
                <label for="supplier" class="block font-bold mb-3"
                    >Supplier</label
                >
                <InputText
                    id="supplier"
                    v-model="selectedBatch.supplier"
                    fluid
                />
            </div>

            <!-- Unit Rental Price -->
            <div>
                <label for="unitRentalPrice" class="block font-bold mb-3"
                    >Unit Rental Price</label
                >
                <InputNumber
                    id="unitRentalPrice"
                    v-model="selectedBatch.unitRentalPrice"
                    mode="currency"
                    currency="PHP"
                    fluid
                />
            </div>

            <!-- Warranty and Day/Month/Year Section -->
            <div class="grid grid-cols-2 items-start gap-4">
                <!-- Warranty Input and Slider -->
                <div class="flex flex-col gap-2">
                    <label for="batchNumber" class="font-medium"
                        >Warranty</label
                    >
                    <InputText
                        v-model.number="selectedBatch.warrantyValue"
                        placeholder="Enter warranty value"
                        class="w-full"
                    />

                    <Slider
                        v-model.number="selectedBatch.warrantyValue"
                        :min="0"
                        :max="100"
                        class="mt-2 w-full"
                    />
                </div>

                <!-- Warranty Unit Dropdown -->
                <div class="flex flex-col gap-2">
                    <label for="warrantyUnit" class="font-medium"
                        >Select Duration</label
                    >
                    <Select
                        v-model="selectedBatch.warrantyUnit"
                        :options="warrantyUnitOptions"
                        optionLabel="name"
                        optionValue="value"
                        placeholder="Select Day / Month / Year"
                        class="w-full"
                    />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideDialog"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveNonConsumableBatchDetails"
            />
        </template>
    </Dialog>

    <!--Non COnsumbale Serial Details Dialog-->
    <Dialog
        :dismissableMask="true"
        v-model:visible="NonConsumablSerialDialog"
        :style="{ width: '450px' }"
        header="Edit Serial Details"
        :modal="true"
    >
        <div class="flex flex-col gap-6">
            <!-- Serial Number -->
            <div>
                <label for="serialNumber" class="block font-bold mb-3"
                    >Serial Number</label
                >
                <InputText
                    id="serialNumber"
                    v-model.trim="selectedSerial.serialNumber"
                    fluid
                    disabled
                />
            </div>

            <!-- Rental Dropdown -->
            <div>
                <label for="rental" class="block font-bold mb-3">Rental</label>
                <Select
                    id="rental"
                    v-model="selectedSerial.rental"
                    :options="rentalOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Rental"
                    class="w-full"
                />
            </div>

            <!-- Rental Price -->
            <div>
                <label for="rentalPrice" class="block font-bold mb-3"
                    >Rental Price</label
                >
                <InputText
                    id="rentalPrice"
                    v-model.number="selectedSerial.rentalPrice"
                    placeholder="Enter rental price"
                    class="w-full"
                    :disabled="selectedSerial.rental !== 'Yes'"
                />
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="hideSerialDialog"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveEditedSerial(selectedSerial)"
            />
        </template>
    </Dialog>

    <!-- Delete serial Dialog -->
    <Dialog
        v-model:visible="deleteserialDialog"
        :style="{ width: '450px' }"
        header="Confirm"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="selectedSerialForDeletion">
                Are you sure you want to delete
                <b>{{ selectedSerialForDeletion.serialNumber }}</b
                >?
            </span>
        </div>
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteserialDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteSerial" />
        </template>
    </Dialog>

    <!--Assign Room Serial Dialog-->
    <Dialog
        v-model:visible="assignItemDialogVisible"
        :style="{ width: '450px' }"
        :header="`Assign Item - ${selectedItem?.serialNumber || 'N/A'}`"
        :modal="true"
        :dismissable-mask="true"
    >
        <div class="flex flex-col gap-4">
            <!-- Display item details -->
            <p><strong>Item:</strong> {{ selectedItem?.serialNumber }}</p>
            <p><strong>Status:</strong> {{ selectedItem?.status }}</p>

            <!-- Room Selection Dropdown -->
            <div class="flex flex-wrap gap-2">
                <Button
                    type="button"
                    icon="pi pi-fw pi-list"
                    label="Select A Room"
                    @click="toggleDataTable3"
                />
                <Popover
                    ref="popoverRef"
                    id="overlay_panel"
                    style="width: 750px"
                >
                    <!-- Search Room Input -->
                    <div class="flex items-center gap-2 mb-3 p-2">
                        <Button
                            type="button"
                            icon="pi pi-filter-slash"
                            label="Clear"
                            outlined
                            @click="clearRoomSearch"
                        />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText
                                v-model="roomSearchQuery"
                                placeholder="Search by room number..."
                                class="w-full"
                            />
                        </IconField>
                    </div>
                    
                    <DataTable
                        v-model:selection="selectedRoom"
                        :value="filteredRooms"
                        selectionMode="single"
                        :paginator="true"
                        :rows="5"
                    >
                        <Column
                            field="roomNumber"
                            header="Room Number"
                            sortable
                        ></Column>
                        <Column field="type" header="Room Type" sortable></Column>
                        <Column field="category" header="Category" sortable></Column>
                        <Column
                            field="status"
                            header="Status"
                            sortable
                        ></Column>
                        <Column header="Action">
                            <template #body="slotProps">
                                <Button
                                    label="Select"
                                    class="p-button-sm p-button-primary"
                                    @click="selectRoom(slotProps.data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </Popover>
            </div>

            <!-- Room Preview -->
            <div v-if="selectedRoom" class="mt-4 p-3">
                <h3 class="font-bold mb-2">Selected Room</h3>
                <p>
                    <strong>Room Number:</strong> {{ selectedRoom.roomNumber }}
                </p>
                <p><strong>Room Type:</strong> {{ selectedRoom.type }}</p>
                <p><strong>Category:</strong> {{ selectedRoom.category }}</p>
                <p><strong>Status:</strong> {{ selectedRoom.status }}</p>
            </div>
        </div>

        <!-- Dialog Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="assignItemDialogVisible = false"
            />
            <Button label="Assign" icon="pi pi-check" @click="assignItem" />
        </template>
    </Dialog>

    <!-- Re-Assign Room Dialog -->
    <Dialog
        v-model:visible="reassignItemDialogVisible"
        :dismissableMask="true"
        :style="{ width: '450px' }"
        :header="`Re-Assign Item - ${selectedItem?.serialNumber || 'N/A'}`"
        :modal="true"
    >
        <div class="flex flex-col gap-4">
            <p><strong>Item:</strong> {{ selectedItem?.serialNumber }}</p>
            <p><strong>Status:</strong> {{ selectedItem?.status }}</p>
            <p>
                <strong>Current Room:</strong>
                {{ selectedItem?.roomNumber || "None" }}
            </p>

            <div class="flex flex-wrap gap-2">
                <!-- Button to Select a Room -->
                <Button
                    label="Select A Room"
                    icon="pi pi-fw pi-list"
                    @click="toggleDataTable3"
                />

                <!-- Button to Move to Stockroom -->
                <Button
                    label="Move to Stockroom"
                    icon="pi pi-fw pi-arrow-left"
                    class="p-button-sm p-button-warning"
                    @click="moveToStockroom"
                />

                <!-- Popover for Room Selection -->
                <Popover
                    ref="popoverRef"
                    id="overlay_panel"
                    style="width: 750px"
                >
                    <DataTable
                        v-model:selection="selectedRoom"
                        :value="availableRooms"
                        selectionMode="single"
                        :rows="5"
                        paginator
                    >
                        <Column
                            field="roomNumber"
                            header="Room Number"
                            sortable
                        ></Column>
                        <Column field="type" header="Type" sortable></Column>
                        <Column
                            field="status"
                            header="Status"
                            sortable
                        ></Column>
                        <Column field="price" header="Price" sortable>
                            <template #body="slotProps">
                                {{ formatPrice(slotProps.data.price) }}
                            </template>
                        </Column>
                        <Column header="Action">
                            <template #body="slotProps">
                                <Button
                                    label="Select"
                                    class="p-button-sm p-button-primary"
                                    @click="selectRoom(slotProps.data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </Popover>
            </div>

            <!-- Selected Room Preview -->
            <div v-if="selectedRoom" class="mt-4 p-3">
                <h3>Selected Room</h3>
                <p>
                    <strong>Room Number:</strong> {{ selectedRoom.roomNumber }}
                </p>
                <p><strong>Type:</strong> {{ selectedRoom.type }}</p>
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="reassignItemDialogVisible = false"
            />
            <Button
                label="Re-Assign"
                icon="pi pi-check"
                @click="reassignItem"
            />
        </template>
    </Dialog>

    <!-- Damage Report Dialog -->
    <Dialog
        v-model:visible="damageDialogVisible"
        header="Report Damage"
        :dismissableMask="true"
        :modal="true"
        :style="{ width: '500px' }"
    >
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Item Serial Number</label>
                <InputText
                    v-model="selectedDamageItem.serialNumber"
                    readonly
                    class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Assigned Room</label>
                <InputText
                    :value="selectedDamageItem?.roomNumber || 'Not Assigned'"
                    readonly
                    class="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Damage Description *</label>
                <Textarea
                    v-model="damageDetails.damage_description"
                    rows="3"
                    placeholder="Describe the damage..."
                    class="w-full"
                />
            </div>

            <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Additional Notes</label>
                <Textarea
                    v-model="damageDetails.notes"
                    rows="3"
                    placeholder="Any additional notes..."
                    class="w-full"
                />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    severity="secondary"
                    @click="cancelDamageReport"
                />
                <Button
                    label="Submit Report"
                    severity="danger"
                    @click="submitDamageReport"
                />
            </div>
        </template>
    </Dialog>

    <!-- Edit Serial Dialog for isDialog2Visible -->
    <Dialog
        v-model:visible="editSerialDialogVisible"
        header="Edit Serial Number"
        :dismissableMask="true"
        :modal="true"
        :style="{ width: '450px' }"
    >
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Serial Number *</label>
                <InputText
                    v-model="editingSerialData.serialNumber"
                    placeholder="Enter serial number"
                    class="w-full"
                    :class="{ 'border-red-500': serialNumberExists }"
                    @input="checkSerialNumberExists(editingSerialData.serialNumber)"
                    autofocus
                />
                <small class="text-gray-500 mt-1 block">
                    Current: {{ editingSerialData.originalSerialNumber }}
                </small>
                <div v-if="serialNumberWarning" class="mt-2">
                    <small class="text-red-500 flex items-center gap-1">
                        <i class="pi pi-exclamation-triangle"></i>
                        {{ serialNumberWarning }}
                    </small>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button
                    label="Cancel"
                    severity="secondary"
                    @click="cancelEditSerial"
                />
                <Button
                    label="Update Serial Number"
                    severity="success"
                    :disabled="isUpdateButtonDisabled"
                    @click="saveEditedSerialNumber"
                />
            </div>
        </template>
    </Dialog>

    <!-- Delete Consumable Dialog -->
    <Dialog
        v-model:visible="deleteConsumableDialogVisible"
        :dismissableMask="true"
        :style="{ width: '450px' }"
        header="Confirm Delete"
        :modal="true"
    >
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle text-3xl text-yellow-500" />
            <span>
                Are you sure you want to delete the consumable item
                <b>{{ consumableToDelete?.serialNumber }}</b
                >?
            </span>
        </div>

        <!-- Dialog Footer -->
        <template #footer>
            <Button
                label="No"
                icon="pi pi-times"
                text
                @click="deleteConsumableDialogVisible = false"
            />
            <Button
                label="Yes"
                icon="pi pi-check"
                severity="danger"
                @click="deleteConsumable"
            />
        </template>
    </Dialog>

    <!-- Edit Consumable Serial Dialog -->
    <Dialog
        v-model:visible="editConsumableDialogVisible"
        :style="{ width: '450px' }"
        header="Edit Consumable"
        :modal="true"
        :dismissableMask="true"
    >
        <div class="flex flex-col gap-4">
            <!-- Serial Number -->
            <div>
                <label for="serialNumber" class="block font-bold mb-2"
                    >Serial Number:</label
                >
                <InputText
                    id="serialNumber"
                    v-model="editingConsumableData.serialNumber"
                    placeholder="Enter Serial Number"
                    class="w-full"
                />
            </div>

            <!-- SRP -->
            <div>
                <label for="srp" class="block font-bold mb-2"
                    >Suggested Retail Price (SRP):</label
                >
                <InputNumber
                    id="srp"
                    v-model="editingConsumableData.srp"
                    mode="currency"
                    currency="PHP"
                    placeholder="Enter SRP"
                    class="w-full"
                />
            </div>
        </div>

        <!-- Dialog Footer -->
        <template #footer>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                @click="editConsumableDialogVisible = false"
            />
            <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                @click="confirmDeleteConsumable(editingConsumableData)"
            />
            <Button
                label="Save"
                icon="pi pi-check"
                @click="saveEditConsumable"
            />
        </template>
    </Dialog>

    <template>
        <Toast ref="toast" />
    </template>
</template>
