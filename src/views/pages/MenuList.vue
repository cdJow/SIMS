<script setup>
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { computed, reactive, ref } from "vue";

const confirm = useConfirm();
const ingredientsPanel = ref();
const toast = useToast();
const recipes = ref([
    {
        id: 1,
        title: "Classic Spaghetti Carbonara",
        category: "Food",
        ingredients: [
            "spaghetti",
            "eggs",
            "pancetta",
            "parmesan",
            "black pepper",
        ],
        cookingTime: 30,
        difficulty: "Medium",
        instructions:
            "Traditional Italian pasta dish with creamy egg-based sauce.",
        price: 15.99,
    },
    {
        id: 2,
        title: "Chicken Tikka Masala",
        category: "Food",
        ingredients: ["chicken", "yogurt", "tomatoes", "garam masala", "cream"],
        cookingTime: 45,
        difficulty: "Hard",
        instructions: "Marinated chicken in a rich, spiced tomato-based sauce.",
        price: 18.99,
    },
    {
        id: 3,
        title: "Miso Ramen",
        category: "Food",
        ingredients: [
            "ramen noodles",
            "miso paste",
            "pork",
            "green onions",
            "seaweed",
        ],
        cookingTime: 50,
        difficulty: "Hard",
        instructions:
            "Japanese-style ramen with a miso-based broth and tender pork.",
        price: 20.5,
    },
    {
        id: 4,
        title: "Caesar Salad",
        category: "Food",
        ingredients: [
            "romaine lettuce",
            "croutons",
            "parmesan",
            "anchovies",
            "dressing",
        ],
        cookingTime: 15,
        difficulty: "Easy",
        instructions:
            "Classic Caesar salad with a creamy dressing and crunchy croutons.",
        price: 10.99,
    },
    {
        id: 5,
        title: "Margherita Pizza",
        category: "Food",
        ingredients: [
            "pizza dough",
            "tomato sauce",
            "mozzarella",
            "basil",
            "olive oil",
        ],
        cookingTime: 25,
        difficulty: "Medium",
        instructions: "Neapolitan-style pizza with simple, fresh ingredients.",
        price: 14.99,
    },
    {
        id: 6,
        title: "Beef Tacos",
        category: "Food",
        ingredients: ["ground beef", "tortillas", "cheese", "lettuce", "salsa"],
        cookingTime: 20,
        difficulty: "Easy",
        instructions:
            "Mexican-style tacos with seasoned beef and fresh toppings.",
        price: 12.99,
    },
    {
        id: 7,
        title: "Sushi Rolls",
        category: "Food",
        ingredients: ["sushi rice", "nori", "salmon", "avocado", "cucumber"],
        cookingTime: 60,
        difficulty: "Hard",
        instructions: "Japanese sushi rolls with fresh fish and vegetables.",
        price: 22.99,
    },
    {
        id: 8,
        title: "French Onion Soup",
        category: "Food",
        ingredients: [
            "onions",
            "beef broth",
            "baguette",
            "gruyere cheese",
            "butter",
        ],
        cookingTime: 40,
        difficulty: "Medium",
        instructions:
            "Classic French soup with caramelized onions and melted cheese.",
        price: 16.5,
    },
    {
        id: 9,
        title: "Pad Thai",
        category: "Food",
        ingredients: [
            "rice noodles",
            "shrimp",
            "peanuts",
            "eggs",
            "tamarind sauce",
        ],
        cookingTime: 35,
        difficulty: "Medium",
        instructions: "Thai stir-fried noodles with a tangy tamarind sauce.",
        price: 17.99,
    },
    {
        id: 10,
        title: "Chocolate Lava Cake",
        category: "Food",
        ingredients: ["dark chocolate", "butter", "sugar", "eggs", "flour"],
        cookingTime: 30,
        difficulty: "Medium",
        instructions: "Decadent dessert with a gooey chocolate center.",
        price: 9.99,
    },
]);

// ... other existing script code ...

const defaultRecipe = {
    id: null,
    title: "",
    category: "Food", // New field
    ingredients: [],
    cookingTime: 30,
    difficulty: "Easy",
    instructions: "",
    price: 0,
};

const categories = ref(["Food", "Beverage"]);
const selectedCategory = ref("All");

// Add filtered recipes computation
const filteredRecipes = computed(() => {
    if (selectedCategory.value === "All") return recipes.value;
    return recipes.value.filter(
        (recipe) => recipe.category === selectedCategory.value,
    );
});

const recipeDialog = ref(false);
const submitted = ref(false);
const isEdit = ref(false);

const recipe = reactive({ ...defaultRecipe });

const openNew = () => {
    Object.assign(recipe, defaultRecipe);
    submitted.value = false;
    isEdit.value = false;
    recipeDialog.value = true;
};

const editRecipe = (rec) => {
    Object.assign(recipe, { ...rec, ingredients: rec.ingredients.join(", ") });
    isEdit.value = true;
    recipeDialog.value = true;
};

const hideDialog = () => {
    recipeDialog.value = false;
    submitted.value = false;
};

const saveRecipe = () => {
    submitted.value = true;

    if (recipe.title && recipe.ingredients) {
        const recipeData = {
            ...recipe,
            ingredients: recipe.ingredients.split(",").map((i) => i.trim()),
            id: isEdit.value ? recipe.id : recipes.value.length + 1,
        };

        if (isEdit.value) {
            const index = recipes.value.findIndex((r) => r.id === recipe.id);
            recipes.value[index] = recipeData;
        } else {
            recipes.value.push(recipeData);
        }

        recipeDialog.value = false;
        showToast(
            "success",
            "Success",
            `Recipe ₱{isEdit.value ? "updated" : "added"} successfully`,
        );
    }
};

const confirmDelete = (recipe) => {
    confirm.require({
        message: `Are you sure you want to delete ₱{recipe.title}?`,
        header: "Confirm Deletion",
        icon: "pi pi-exclamation-triangle",
        accept: () => deleteRecipe(recipe),
    });
};

const deleteRecipe = (recipe) => {
    recipes.value = recipes.value.filter((r) => r.id !== recipe.id);
    showToast("success", "Success", "Recipe deleted successfully");
};

const showToast = (severity, summary, detail) => {
    toast.add({
        severity,
        summary,
        detail,
        life: 3000,
    });
};
</script>

<template>
    <div class="card">
        <div class="mb-6 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-800">Recipe Management</h1>
            <div class="flex gap-4">
                <Dropdown
                    v-model="selectedCategory"
                    :options="['All', ...categories]"
                    placeholder="Filter by Category"
                    class="w-48"
                />
                <Button
                    label="Add New Recipe"
                    icon="pi pi-plus"
                    class="p-button-success"
                    @click="openNew"
                />
            </div>
        </div>

        <!-- Recipes Table -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            <Card
                v-for="(recipe, index) in filteredRecipes"
                :key="index"
                class="shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
                <template #title>
                    <div class="flex justify-between items-start">
                        <div class="text-xl font-bold mb-4">
                            {{ recipe.title }}
                        </div>
                        <Tag
                            :value="recipe.category"
                            :severity="
                                recipe.category === 'Food' ? 'warning' : 'info'
                            "
                            class="text-sm"
                        />
                    </div>
                </template>

                <template #content>
                    <div class="space-y-3">
                        <div class="flex items-center text-sm">
                            <i class="pi pi-clock mr-2"></i>
                            <span>{{ recipe.cookingTime }} mins</span>
                        </div>

                        <div class="flex items-center text-sm">
                            <i class="pi pi-tag mr-2"></i>
                            <span class="font-semibold"
                                >₱{{ recipe.price.toFixed(2) }}</span
                            >
                        </div>

                        <div class="mt-4">
                            <h4 class="font-semibold mb-2">Ingredients:</h4>
                            <div
                                class="line-clamp-3 text-sm cursor-pointer hover:underline"
                                @click="ingredientsPanel.toggle($event)"
                            >
                                {{ recipe.ingredients.join(", ") }}
                            </div>
                        </div>

                        <OverlayPanel ref="ingredientsPanel">
                            <div class="p-4">
                                <h4 class="font-bold mb-3">
                                    Full Ingredients List
                                </h4>
                                <ul class="list-disc pl-4">
                                    <li
                                        v-for="(
                                            ingredient, idx
                                        ) in recipe.ingredients"
                                        :key="idx"
                                    >
                                        {{ ingredient }}
                                    </li>
                                </ul>
                            </div>
                        </OverlayPanel>
                    </div>
                </template>

                <template #footer>
                    <div class="flex justify-end space-x-2">
                        <Button
                            label="Edit"
                            class="p-button-primary w-full"
                            @click="editRecipe(recipe)"
                        />
                        <Button
                            label="Delete"
                            class="p-button-primary w-full"
                            @click="confirmDelete(recipe)"
                        />
                    </div>
                </template>
            </Card>
        </div>
        <!-- Add/Edit Dialog -->
        <Dialog
            v-model:visible="recipeDialog"
            :style="{ width: '600px' }"
            header="Recipe Details"
            :modal="true"
        >
            <div class="p-fluid grid gap-4">
                <div class="field col-12">
                    <label for="title"
                        >Name <span class="text-red-500">*</span></label
                    >
                    <InputText
                        id="title"
                        v-model.trim="recipe.title"
                        required="true"
                        class="w-full"
                        :class="{ 'p-invalid': submitted && !recipe.title }"
                    />
                    <small v-if="submitted && !recipe.title" class="p-error"
                        >Title is required.</small
                    >
                </div>

                <div class="field col-12 md:col-6">
                    <label for="category"
                        >Category <span class="text-red-500">*</span></label
                    >
                    <Dropdown
                        id="category"
                        v-model="recipe.category"
                        :options="categories"
                        class="w-full"
                        :class="{ 'p-invalid': submitted && !recipe.category }"
                    />
                </div>

                <div class="field col-12 md:col-6">
                    <label for="price"
                        >Price <span class="text-red-500">*</span></label
                    >
                    <InputNumber
                        id="price"
                        v-model="recipe.price"
                        mode="currency"
                        currency="PHP"
                        locale="en-US"
                        :min="0"
                        :max="1000"
                        class="w-full"
                        :class="{ 'p-invalid': submitted && !recipe.price }"
                    />
                    <small v-if="submitted && !recipe.price" class="p-error"
                        >Price is required.</small
                    >
                </div>

                <div class="field col-12">
                    <label for="ingredients"
                        >Ingredients <span class="text-red-500">*</span></label
                    >
                    <Textarea
                        id="ingredients"
                        v-model="recipe.ingredients"
                        rows="3"
                        class="w-full"
                        :class="{
                            'p-invalid': submitted && !recipe.ingredients,
                        }"
                        placeholder="Enter ingredients separated by commas"
                    />
                    <small
                        v-if="submitted && !recipe.ingredients"
                        class="p-error"
                        >Ingredients are required.</small
                    >
                </div>

                <div class="field col-12 md:col-6">
                    <label for="cookingTime"
                        >Cooking Time (mins)
                        <span class="text-red-500">*</span></label
                    >
                    <InputNumber
                        id="cookingTime"
                        v-model="recipe.cookingTime"
                        :min="5"
                        :max="240"
                        class="w-full"
                    />
                </div>

                <div class="field col-12">
                    <label for="instructions">Instructions</label>
                    <Textarea
                        id="instructions"
                        v-model="recipe.instructions"
                        rows="5"
                        class="w-full"
                        placeholder="Detailed cooking instructions..."
                    />
                </div>
            </div>

            <template #footer>
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    class="p-button-text"
                    @click="hideDialog"
                />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    class="p-button-success"
                    @click="saveRecipe"
                />
            </template>
        </Dialog>

        <ConfirmDialog></ConfirmDialog>
    </div>
</template>
