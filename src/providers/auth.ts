import type { AuthProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_BACKEND_BASE_URL;

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        try {
            const response = await fetch(`${API_URL}/auth/sign-in/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        message: "Login failed",
                        name: "Invalid credentials",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/",
            };

        } catch (error) {
            console.error("Login request failed:", error);
            return {
                success: false,
                error: {
                    message: "Login error",
                    name: "Network error",
                },
            };
        }
    },

    register: async ({ name, email, password }) => {
        try {
            const response = await fetch(
                `${API_URL}/auth/sign-up/email`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                    }),
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        message: "Registration failed",
                        name: "Register error",
                    },
                };
            }

            return {
                success: true,
                redirectTo: "/",
            };

        } catch (error) {
            console.error("Registration request failed:", error);
            return {
                success: false,
                error: {
                    message: "Registration error",
                    name: "Network error",
                },
            };
        }
    },

    logout: async () => {
        await fetch(`${API_URL}/auth/sign-out`, {
            method: "POST",
            credentials: "include",
        });

        return {
            success: true,
        };
    },

    check: async () => {
        const response = await fetch(`${API_URL}/auth/get-session`, {
            credentials: "include",
        });

        const data = await response.json();

        if (data?.user) {
            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },

    getIdentity: async () => {
        const response = await fetch(`${API_URL}/auth/get-session`, {
            credentials: "include",
        });

        if (!response.ok) return null;

        const data = await response.json();

        return data.user;
    },

    onError: async (error) => {
        return {
            error,
        };
    },
};