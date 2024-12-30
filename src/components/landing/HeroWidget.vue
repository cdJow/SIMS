<script>
export default {
    name: "HeroSection",
    data() {
        return {
            backgroundStyle: {
                background: `linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.2),
              rgba(255, 255, 255, 0.2)
            ),
            radial-gradient(
              77.36% 256.97% at 77.36% 57.52%,
              rgb(255, 0, 0) 0%,
              rgb(255, 165, 0) 100%
            )`,
                clipPath: "ellipse(150% 87% at 93% 13%)",
            },
        };
    },
};
</script>

<template>
    <div
        id="hero"
        class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
        :style="backgroundStyle"
    >
        <div class="hero-content">
            <h1 class="text-6xl font-bold text-white leading-tight">
                <span class="font-light block">Woodland Suites</span>
                Your Home Away From Home
            </h1>
            <p class="font-normal text-2xl leading-normal md:mt-4 text-white">
                Situated in Iligan City where beauty of nature and culture meet.
            </p>
            <router-link to="/BookingPanel" class="mt-6 primary-button"
                >BOOK NOW</router-link
            >
        </div>
    </div>
</template>

<style scoped>
#hero {
    min-height: 75vh; /* Adjust this value as needed */
}

.hero-content {
    padding-top: 10vh; /* Adds more padding at the top */
    padding-bottom: 20vh; /* Adds more padding at the bottom */
}

.primary-button {
    background-color: #10b981; /* Changed to a green color */
    color: white;
    padding: 15px 30px; /* Adjusted to make the button medium-sized */
    font-size: 22px; /* Standard medium font size for buttons */
    text-decoration: none;
    border-radius: 10px;
    text-align: center;
    display: inline-block;
}

.primary-button:hover {
    background-color: #0c865d; /* A darker shade of green for hover */
}
</style>
