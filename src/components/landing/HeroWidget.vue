<template>
    <div
        id="hero"
        class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
        style="
            background: linear-gradient(
                    0deg,
                    rgba(255, 255, 255, 0.2),
                    rgba(255, 255, 255, 0.2)
                ),
                radial-gradient(
                    77.36% 256.97% at 77.36% 57.52%,
                    rgb(255, 0, 0) 0%,
                    rgb(255, 165, 0) 100%
                );
            clip-path: ellipse(150% 87% at 93% 13%);
        "
    >
        <div class="pt-30 mx-6 md:mx-20 mt-0 md:mt-6 py-20;">
            <h1 class="text-6xl font-bold text-white leading-tight">
                <span class="font-light block">Woodland Suites</span>
                Your Home Away From Home
            </h1>
            <p class="font-normal text-2xl leading-normal md:mt-4 text-white">
                Situated in Iligan City where beauty of nature and culture meet.
            </p>
            <Button
                class="mt-6"
                label="BOOK NOW"
                severity="primary"
                as="router-link"
                to="/"
            ></Button>
        </div>
        <div class="flex justify-center md:justify-end">
            <img
                src="/demo/images/landing/screen-1.png"
                alt="Hero Image"
                class="w-9/12 md:w-auto"
            />
        </div>
    </div>
</template>
