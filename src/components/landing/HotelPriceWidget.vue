<template>
    <div class="room-grid text-center">
        <h1 class="header">Room Types</h1>
        <p class="subheader">Comfortable rooms tailored to your needs</p>
        <!-- Single Size Room -->
        <div class="room-card">
            <h3>Single Size Room</h3>
            <p class="description">
                Ideal for individual travelers, offering comfort and
                convenience.
            </p>
            <p class="rate">₱280 for 6 hours</p>
        </div>
        <!-- Double Size Room -->
        <div class="room-card">
            <h3>Double Size Room</h3>
            <p class="description">
                Perfect for couples or friends traveling together, featuring two
                separate beds.
            </p>
            <p class="rate">₱280 for 6 hours</p>
        </div>
        <!-- Queen Size Room -->
        <div class="room-card">
            <h3>Queen Size Room</h3>
            <p class="description">
                Spacious room with a queen-size bed suitable for those who
                prefer extra space.
            </p>
            <p class="rate">₱280 for 6 hours</p>
        </div>
    </div>
</template>

<style>
.room-grid {
    max-width: 1200px;
    margin: 4rem auto;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2rem;
}

.header {
    width: 100%;
    font-size: 3rem; /* Large font for main header */
    color: #333;
    margin-bottom: 1rem;
}

.subheader {
    width: 100%;
    font-size: 1.8rem; /* Slightly larger subheader */
    color: #555;
    margin-bottom: 3rem;
}

.room-card {
    flex: 1 1 300px;
    background: white;
    border-radius: 10px;
    text-align: center;
    padding: 3rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease;
}

.room-card:hover {
    transform: translateY(-10px);
}

.room-card h3 {
    color: #333;
    font-size: 2rem; /* Larger font for room title */
    margin-bottom: 1rem;
}

.description {
    color: #666;
    font-size: 1.2rem; /* Clear readability for description */
    margin-bottom: 1rem;
}

.rate {
    color: #e53935;
    font-weight: bold;
    font-size: 1.5rem; /* Emphasized font size for rate */
}

@media (max-width: 768px) {
    .room-grid {
        flex-direction: column;
    }

    .room-card {
        flex: 1 1 100%;
        padding: 2rem;
    }

    .header,
    .subheader {
        text-align: center;
    }
}
</style>
