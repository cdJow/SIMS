let accounts = [];

export const AccountService = {
    getAccounts() {
        if (accounts.length === 0) {
            accounts = [
                {
                    id: 1,
                    name: "Jane Smith",
                    email: "jane.smith@example.com",
                    password: "JaneSmith@123", // Current password
                    passwordHistory: [
                        {
                            password: "Jane@2023",
                            setAt: "2023-11-15",
                            changedVia: "Initial Setup",
                        },
                        {
                            password: "JS@2023Nov",
                            setAt: "2023-11-25",
                            changedVia: "User Reset",
                        },
                    ],
                    passwordLastUpdated: "2023-12-01",
                    image: null,
                    role: { label: "Manager", value: "Moderator" },
                    status: { label: "Active", value: "Active" },
                    dateCreated: "2023-11-15",
                    loginHistory: generateLoginHistory("2023-12-01", 30),
                    logs: generateLogs("2023-12-01", 5, [
                        "Password Reset",
                        "Account Edited",
                    ]),
                },
                {
                    id: 2,
                    name: "Alice Johnson",
                    email: "alice.johnson@example.com",
                    password: "AliceJ!2023",
                    passwordHistory: [
                        {
                            password: "AJ@initial1",
                            setAt: "2023-11-20",
                            changedVia: "Initial Setup",
                        },
                    ],
                    passwordLastUpdated: "2023-11-20",
                    image: null,
                    role: { label: "Front Desk", value: "User" },
                    status: { label: "Active", value: "Active" },
                    dateCreated: "2023-11-20",
                    loginHistory: generateLoginHistory("2023-12-01", 30),
                    logs: generateLogs("2023-12-01", 3, ["Password Reset"]),
                },
                {
                    id: 3,
                    name: "Bob Brown",
                    email: "bob.brown@example.com",
                    password: "B0bBr0wn#",
                    passwordHistory: [
                        {
                            password: "Bob@TempPwd",
                            setAt: "2023-11-25",
                            changedVia: "Initial Setup",
                        },
                    ],
                    passwordLastUpdated: "2023-11-25",
                    image: null,
                    role: { label: "Front Desk", value: "User" },
                    status: { label: "Disabled", value: "Disabled" },
                    dateCreated: "2023-11-25",
                    loginHistory: generateLoginHistory("2023-12-01", 30),
                    logs: [],
                },
                {
                    id: 4,
                    name: "John Doe",
                    email: "john.doe@example.com",
                    password: "AdminSecure#2023",
                    passwordHistory: [
                        {
                            password: "J0hnD03!",
                            setAt: "2023-11-10",
                            changedVia: "Initial Setup",
                        },
                        {
                            password: "JDoe@2023",
                            setAt: "2023-11-20",
                            changedVia: "Scheduled Reset",
                        },
                    ],
                    passwordLastUpdated: "2023-11-30",
                    image: null,
                    role: { label: "System Administrator", value: "Admin" },
                    status: { label: "Locked", value: "Locked" },
                    dateCreated: "2023-11-10",
                    loginHistory: generateLoginHistory("2023-12-01", 30),
                    logs: generateLogs("2023-12-01", 7, [
                        "Password Reset",
                        "Account Edited",
                    ]),
                },
            ];
        }

        return accounts;
    },
    verifyCurrentPassword: (accountId, currentPassword) => {
        const account = AccountService.getAccounts().find(
            (acc) => acc.id === accountId
        );
        return Promise.resolve(account?.password === currentPassword);
    },

    resetPassword: (accountId, newPassword) => {
        const accounts = AccountService.getAccounts();
        const account = accounts.find((acc) => acc.id === accountId);
        if (account) {
            account.passwordHistory.push({
                password: account.password,
                setAt: new Date().toISOString().split("T")[0],
                changedVia: "Admin Reset",
            });
            account.password = newPassword;
            account.passwordLastUpdated = new Date()
                .toISOString()
                .split("T")[0];
        }
        return Promise.resolve();
    },
};

// Utility function to generate login and logout history
function generateLoginHistory(startDate, days) {
    const history = [];

    // Helper function to format time in 12-hour format
    const formatTime = (hour, minute) => {
        const period = hour >= 12 ? "PM" : "AM"; // Determine AM/PM
        const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12-hour format
        const formattedMinute = minute.toString().padStart(2, "0");
        return `${formattedHour}:${formattedMinute} ${period}`;
    };

    // Generate random time within a range
    const randomTime = (baseHourStart, baseHourEnd) => {
        const randomHour =
            baseHourStart +
            Math.floor(Math.random() * (baseHourEnd - baseHourStart + 1));
        const randomMinute = Math.floor(Math.random() * 60);
        return formatTime(randomHour, randomMinute);
    };

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        history.push({
            date: date.toISOString().split("T")[0], // Format: YYYY-MM-DD
            loginTime: randomTime(7, 8), // Random login time between 7 AM and 8:59 AM
            logoutTime: randomTime(16, 17), // Random logout time between 4 PM and 5:59 PM
        });
    }

    return history;
}

// Utility function to generate random logs
function generateLogs(startDate, count, actions) {
    const logs = [];

    // Helper function to format date and time
    const formatDate = (date) => {
        const options = { year: "numeric", month: "2-digit", day: "2-digit" };
        return new Intl.DateTimeFormat("en-US", options).format(date);
    };

    const formatTime = (hour, minute) => {
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        const formattedMinute = minute.toString().padStart(2, "0");
        return `${formattedHour}:${formattedMinute} ${period}`;
    };

    // Generate random logs
    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(Math.random() * 30)); // Random day in the 30-day range
        const time = formatTime(
            Math.floor(Math.random() * 12) + 8, // Random hour between 8 AM and 8 PM
            Math.floor(Math.random() * 60) // Random minute
        );

        logs.push({
            action: actions[Math.floor(Math.random() * actions.length)], // Random action
            timestamp: `${formatDate(date)} ${time}`,
        });
    }

    return logs;
}
