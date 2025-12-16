<script>
import { login } from "@/api/auth";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";

export default {
  data() {
    return {
      form: {
        email: "",
        password: "",
      },
      errors: {
        email: null,
        password: null,
        form: null,
      },
      success: {
        form: null,
      },
      isLoading: false,
    };
  },
  setup() {
    const router = useRouter();
    const toast = useToast();
    return { router, toast };
  },
  mounted() {
    // Check for error messages from previous login attempts (after page refresh)
    const loginError = localStorage.getItem("loginError");
    const loginSuccess = localStorage.getItem("loginSuccess");
    
    if (loginError) {
      this.errors.form = loginError;
      localStorage.removeItem("loginError");
    }
    
    if (loginSuccess) {
      this.success.form = loginSuccess;
      localStorage.removeItem("loginSuccess");
    }
  },
  methods: {
    async handleLogin() {
      // Prevent multiple login attempts
      if (this.isLoading) return;
      
      // Clear any previous messages from localStorage
      localStorage.removeItem("loginError");
      localStorage.removeItem("loginSuccess");
      
      this.errors = { email: null, password: null, form: null };
      this.success = { form: null };

      if (!this.form.email) this.errors.email = "Email is required.";
      if (!this.form.password) this.errors.password = "Password is required.";
      if (this.errors.email || this.errors.password) return;

      this.isLoading = true;
      try {
        const response = await login(this.form.email, this.form.password);
        const token = response.data.token;
        const userId = response.data.user?.id || response.data.user_id;
        const userRole = response.data.user?.role;
        const additionalRoles = response.data.user?.additional_roles || [];

        if (token && userId) {
          localStorage.setItem("token", token);
          localStorage.setItem("userId", userId);

          // Store complete user data
          const userData = {
            id: userId,
            role: userRole,
            additional_roles: additionalRoles,
            ...response.data.user
          };
          localStorage.setItem("user", JSON.stringify(userData));

          // Store success message for after redirect
          

          // Get all user roles (primary + additional)
          const allRoles = [userRole, ...additionalRoles];
          
          // Determine redirect route based on role priority
          let redirectRoute = "/pages/website/HomePage";
          
          if (allRoles.includes("System Admin")) {
            redirectRoute = "/Rooms/RoomControl";
          } else if (allRoles.includes("Manager")) {
            redirectRoute = "/Dashboard";
          } else if (allRoles.includes("Front Desk")) {
            redirectRoute = "/Rooms/RoomList";
          } else if (allRoles.includes("Inventory")) {
            redirectRoute = "/Inventory/GenerateReport/StockHistory";
          } else if (userRole === "guest" || allRoles.includes("guest")) {
            redirectRoute = "/pages/website/BookedRooms";
          }
         
          // Navigate immediately - success message will show on destination page
          window.location.href = redirectRoute;
        }
      } catch (error) {
        // Store error message in localStorage in case page refreshes
        const errorMessage = "Invalid email or password. Please try again.";
        localStorage.setItem("loginError", errorMessage);
        this.errors.form = errorMessage;
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>


<template>
    <div class="min-h-screen flex flex-col md:flex-row">
        <!-- Left Side - Background Image -->
        <div
            class="hidden md:block md:w-1/2 bg-gradient-to-r from-red-600 to-orange-500 relative overflow-hidden"
        >
            <div class="relative w-full h-auto overflow-hidden">
                <img
                    src="@/assets/images/main.jpg"
                    class="w-full h-auto max-h-[450px] md:max-h-[600px] aspect-[16/9] object-cover opacity-10"
                    alt="Luxury Suite"
                />
            </div>

            <div
                class="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
                <div class="text-center z-10 px-4 max-w-6xl">
                    <h1
                        class="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 md:mb-4"
                    >
                        WOODLAND SUITES
                    </h1>
                    <p
                        class="text-white text-base sm:text-lg md:text-xl lg:text-2xl"
                    >
                        Your home away from home
                    </p>
                </div>
            </div>
        </div>

        <!-- Right Side - Login Form -->
        <div
            class="w-full md:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8  bg-#E3EAFF"
        >
            <div
                class="w-full max-w-md space-y-4 md:space-y-6 bg-white rounded-lg shadow-md"
            >
                <!-- Mobile Header -->
                <div class="block bg-red-500 md:hidden relative w-full">
                    <img
                        src="@/assets/images/main.jpg"
                        class="w-full h-48 sm:h-64 object-cover opacity-10"
                        alt="Luxury Suite"
                    />
                    <div
                        class="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                        <div class="text-center px-4">
                            <h1
                                class="text-white text-xl sm:text-2xl font-bold"
                            >
                                WOODLAND SUITES
                            </h1>
                            <p class="text-white text-sm sm:text-base">
                                Your home away from home
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Form Container -->
                <div class="card">
                    <h2
                        class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6"
                    >
                        Login to your account
                    </h2>

                    <form
                        @submit.prevent
                        class="space-y-3 sm:space-y-4"
                    >
                        <div class="space-y-4 sm:space-y-6">
                            <!-- Email Input -->
                            <div>
                                <label
                                    class="block text-sm sm:text-base font-medium text-gray-700 mb-2"
                                >
                                    Email Address
                                </label>
                                <InputText
                                    v-model="form.email"
                                    type="email"
                                    placeholder="Enter your email"
                                    class="w-full text-sm sm:text-base"
                                    :class="{ 'p-invalid': errors.email }"
                                    @keyup.enter="handleLogin"
                                />
                                <small
                                    v-if="errors.email"
                                    class="p-error mt-1 block text-xs sm:text-sm"
                                >
                                    {{ errors.email }}
                                </small>
                            </div>

                            <!-- Password Input -->
                            <div>
                                <div class="flex justify-between items-center mb-2">
                                    <label
                                        for="password"
                                        class="block text-sm sm:text-base font-medium text-gray-700"
                                    >
                                        Password
                                    </label>
                                    <router-link
                                        to="/pages/auth/forgot-password"
                                        class="text-primary text-xs sm:text-sm font-medium hover:underline"
                                    >
                                        Forgot Password?
                                    </router-link>
                                </div>
                                <Password
                                    id="password"
                                    v-model="form.password"
                                    toggleMask
                                    placeholder="Enter your password"
                                    class="w-full text-sm sm:text-base mb-10"
                                    inputClass="w-full"
                                    :class="{ 'p-invalid': errors.password }"
                                    @keyup.enter="handleLogin"
                                />
                                <small
                                    v-if="errors.password"
                                    class="p-error mt-1 block text-xs sm:text-sm mt-10"
                                >
                                    {{ errors.password }}
                                </small>
                                <!-- Login Result Messages -->
                                <small
                                    v-if="errors.form"
                                    class="text-red-500 mt-1 block text-xs sm:text-sm font-medium"
                                >
                                    <i class="pi pi-times-circle mr-1"></i>
                                    {{ errors.form }}
                                </small>
                                <small
                                    v-if="success.form"
                                    class="text-green-500 mt-1 block text-xs sm:text-sm font-medium"
                                >
                                    <i class="pi pi-check-circle mr-1"></i>
                                    {{ success.form }}
                                </small>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <Button
                            
                            type="button"
                            label="Sign In"
                            class="w-full p-button-success text-sm sm:text-base"
                            :loading="isLoading"
                            @click="handleLogin"
                        />

                        <!-- Registration Link -->
                        <div
                            class="text-center text-xs sm:text-sm mt-3 sm:mt-4"
                        >
                            <span class="text-gray-600"
                                >Don't have an account?</span
                            >
                            <router-link
                                to="/auth/signup"
                                class="text-primary font-medium hover:underline ml-1"
                                @click="() => router.push('/auth/SignUp')"
                            >
                                Create Account
                            </router-link>
                        </div>

                        <!-- Back to Home -->
                        <router-link to="/">
                            <Button
                                icon="pi pi-arrow-left"
                                class="p-button-text p-button-sm mt-4"
                                label="Back to Home"
                            />
                        </router-link>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
