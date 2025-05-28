// src/lib/local-storage.ts
"use client";

// Key for storing username in localStorage
const USER_NAME_KEY = "musicshare_username";

/**
 * Get the saved username from localStorage
 */
export function getUserName(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(USER_NAME_KEY);
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null;
  }
}

/**
 * Save username to localStorage
 */
export function saveUserName(userName: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(USER_NAME_KEY, userName);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Clear the saved username from localStorage
 */
export function clearUserName(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(USER_NAME_KEY);
  } catch (error) {
    console.error("Error clearing from localStorage:", error);
  }
}
