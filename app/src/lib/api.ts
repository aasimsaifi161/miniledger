import { router } from "expo-router";
import { getToken, clearSession } from "./auth";

declare const process: { env: Record<string, string | undefined> };

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      await clearSession();
      router.replace("/login");
      throw new ApiError("Session expired. Please log in again.", 401);
    }

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && data.error) ||
        (data && typeof data === "object" && data.message) ||
        `Request failed with status ${response.status}`;

      const errorDetails =
        data && typeof data === "object" && data.details
          ? data.details
          : undefined;

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err?.message || "Cannot connect to server. Check your network or API URL.",
      0
    );
  }
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "GET" });
  },

  post<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
  },

  async uploadReceipt<T>(loanId: string, imageUri: string): Promise<T> {
    const token = await getToken();
    const url = `${BASE_URL}/loans/${loanId}/receipt`;

    const formData = new FormData();
    const uriParts = imageUri.split(".");
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    const mimeType =
      fileType === "png"
        ? "image/png"
        : fileType === "webp"
        ? "image/webp"
        : "image/jpeg";

    const filePayload = {
      uri: imageUri,
      name: `receipt-${Date.now()}.${fileType || "jpg"}`,
      type: mimeType,
    };

    formData.append("receipt", filePayload as any);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.status === 401) {
      await clearSession();
      router.replace("/login");
      throw new ApiError("Session expired. Please log in again.", 401);
    }

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && data.error) ||
        `Upload failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    return data as T;
  },
};
