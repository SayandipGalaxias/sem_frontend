import { LocalStorageItems } from "@/constants/config";
import { useEncryptionStore } from "@/store/EncryptionStore";
import { useUserStore } from "@/store/UserStore";
import { generateRandomString } from "@/utils/Utility";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { errorHandler } from "../utils/handlers";
import { LoginRequest, RegisterRequest } from "./types";

const TEST_EMAIL = "testsayandip1@gmail.com";
const TEST_PASSWORD = "testsayandip";

export function useAuthApi() {
    const [loading, setLoading] = useState(false);
    const setUser = useUserStore((store) => store.setUser);
    const router = useRouter();

    async function login(payload: LoginRequest) {
        setLoading(true);
        try {
            if (
                payload.email.trim().toLowerCase() !== TEST_EMAIL ||
                payload.password !== TEST_PASSWORD
            ) {
                Toast.show({ type: "error", text1: "Invalid email or password" });
                return;
            }

            const user = { email: TEST_EMAIL, type: "user" };

            await AsyncStorage.setItem(
                LocalStorageItems.USER,
                JSON.stringify(user),
            );
            setUser(user);

            await useEncryptionStore.getState().loadRandomString(user.email);
            if (!useEncryptionStore.getState().randomString) {
                const newRandomString = generateRandomString(32);
                await useEncryptionStore
                    .getState()
                    .saveRandomString(user.email, newRandomString);
            }

            if (Platform.OS === "web") {
                router.replace("/dashboard" as any);
            } else {
                router.replace("/(dashboard)" as any);
            }
        } catch (error) {
            Toast.show({ type: "error", text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        const email = useUserStore.getState().user?.email;

        // await useEncryptionStore.getState().clearRandomString(email ?? '');

        useEncryptionStore.setState({ randomString: '' });
        useUserStore.setState({ user: undefined, isAuthenticated: false });

        await AsyncStorage.removeItem(LocalStorageItems.USER);
        // SecretsApi.clearAll()

        router.replace("/login");
    }

    async function register(
        email: string,
        password: string,
        payload: RegisterRequest,
    ) {
        setLoading(true);
        try {
            Toast.show({ type: "info", text1: "Registration not available yet" });
        } catch (error: any) {
            Toast.show({ type: "error", text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    return { loading, login, register, logout };
}