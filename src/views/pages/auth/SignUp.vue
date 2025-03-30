
<script>
import FloatingConfigurator from "@/components/FloatingConfigurator.vue";
import { signup } from "@/api/auth";
import { useRouter } from "vue-router";

export default {
  data() {
    return {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      errorMessage: "",
      successMessage: "",
      isLoading: false,
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    async handleSignUp() {
      this.errorMessage = "";
      this.successMessage = "";

      // Input validation
      if (!this.name || !this.email || !this.password || !this.confirmPassword) {
        this.errorMessage = "All fields are required.";
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.errorMessage = "Passwords do not match.";
        return;
      }

      this.isLoading = true;
      try {
        const response = await signup(this.name, this.email, this.password, "user");
        this.successMessage = "Account created successfully. Redirecting...";
        setTimeout(() => this.$router.push("/pages/auth/login"), 2000);
      } catch (error) {
        this.errorMessage = "Signup failed. Email may already be in use.";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>


<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)"
            >
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
                            Woodland Suite Hotel
                        </div>
                        <span class="text-muted-color font-medium">Sign up to create an account</span>
                    </div>
                    <div>
                        <label for="name" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Name</label>
                        <InputText id="name" type="text" placeholder="Name" class="w-full md:w-[30rem] mb-4" v-model="name" />

                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email" type="email" placeholder="Email address" class="w-full md:w-[30rem] mb-4" v-model="email" />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Password</label>
                        <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false" />

                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-4">Confirm Password</label>
                        <Password id="confirmPassword" v-model="confirmPassword" placeholder="Confirm Password" :toggleMask="true" class="mb-8" fluid :feedback="false" />

                        <div class="text-red-500 mb-4" v-if="errorMessage">{{ errorMessage }}</div>
                        <div class="text-green-500 mb-4" v-if="successMessage">{{ successMessage }}</div>

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <router-link to="/auth/login" class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">
                                Already have an account?
                            </router-link>
                        </div>
                        <Button label="Sign Up" class="w-full" @click="handleSignUp" :loading="isLoading"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
