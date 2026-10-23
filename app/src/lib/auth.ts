import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "miniledger_jwt_token";
const USER_KEY = "miniledger_user_profile";

export interface UserProfile {
  id: string;
  phone: string;
  createdAt: string;
}

let memoryToken: string | null = null;
let memoryUser: UserProfile | null = null;

export async function saveToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn("Failed to save token to SecureStore:", error);
  }
}

export async function getToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        memoryToken = window.localStorage.getItem(TOKEN_KEY);
      }
    } else {
      memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return memoryToken;
  } catch (error) {
    console.warn("Failed to get token from SecureStore:", error);
    return null;
  }
}

export async function removeToken(): Promise<void> {
  memoryToken = null;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.warn("Failed to remove token from SecureStore:", error);
  }
}

export async function saveUser(user: UserProfile): Promise<void> {
  memoryUser = user;
  const serialized = JSON.stringify(user);
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(USER_KEY, serialized);
      }
    } else {
      await SecureStore.setItemAsync(USER_KEY, serialized);
    }
  } catch (error) {
    console.warn("Failed to save user profile:", error);
  }
}

export async function getUser(): Promise<UserProfile | null> {
  if (memoryUser) return memoryUser;
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        raw = window.localStorage.getItem(USER_KEY);
      }
    } else {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    if (raw) {
      memoryUser = JSON.parse(raw);
    }
    return memoryUser;
  } catch (error) {
    console.warn("Failed to get user profile:", error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  memoryToken = null;
  memoryUser = null;
  await Promise.all([removeToken(), deleteStoredUser()]);
}

async function deleteStoredUser(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(USER_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.warn("Failed to delete user profile:", error);
  }
}
