import { apiRequest } from "./queryClient";
import { generatePublicKey } from "./ecc";
import { getCurrentLocation } from "./geolocation";

/**
 * Register a new user
 * @param username - Username
 * @param email - Email address
 * @param catchphrase - Secret catchphrase for ECC key generation
 * @returns Promise with the registration result
 */
export async function registerUser(
  username: string,
  email: string,
  catchphrase: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate public key from catchphrase
    const publicKey = await generatePublicKey(catchphrase);
    
    // Call the API to register the user
    await apiRequest("POST", "/api/auth/register", {
      username,
      email,
      catchphrase,
      publicKey,
    });
    
    return { success: true, message: "Registration successful" };
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Registration failed" 
    };
  }
}

/**
 * Verify user identity (step 1 of login)
 * @param email - User's email
 * @param catchphrase - Secret catchphrase
 * @returns Promise with verification result
 */
export async function verifyIdentity(
  email: string,
  catchphrase: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Store catchphrase temporarily for potential OTP resend
    // This is not secure and only for demo purposes
    sessionStorage.setItem("catchphrase", catchphrase);
    
    // Call the API to verify identity
    await apiRequest("POST", "/api/auth/verify-identity", {
      email,
      catchphrase,
    });
    
    return { success: true, message: "Identity verified" };
  } catch (error) {
    console.error("Identity verification error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Identity verification failed" 
    };
  }
}

/**
 * Verify OTP (step 2 of login)
 * @param email - User's email
 * @param otp - One-time password
 * @returns Promise with verification result and location info
 */
export async function verifyOTP(
  email: string,
  otp: string
): Promise<{ 
  success: boolean; 
  message: string; 
  locationInfo?: any;
}> {
  try {
    // Try to get current location
    const locationInfo = await getCurrentLocation();
    
    // Call the API to verify OTP
    const response = await apiRequest("POST", "/api/auth/verify-otp", {
      email,
      otp,
      locationInfo,
    });
    
    const data = await response.json();
    
    // Clean up temporary catchphrase
    sessionStorage.removeItem("catchphrase");
    
    return { 
      success: true, 
      message: "OTP verified", 
      locationInfo: data.locationInfo 
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "OTP verification failed" 
    };
  }
}

/**
 * Logout the current session
 * @returns Promise with logout result
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
  try {
    // Call the API to logout
    await apiRequest("POST", "/api/auth/logout");
    
    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Logout failed" 
    };
  }
}

/**
 * Force logout all other sessions
 * @returns Promise with force logout result
 */
export async function forceLogoutOthers(): Promise<{ success: boolean; message: string }> {
  try {
    // Call the API to force logout other sessions
    await apiRequest("POST", "/api/auth/force-logout");
    
    return { success: true, message: "All other sessions have been terminated" };
  } catch (error) {
    console.error("Force logout error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Force logout failed" 
    };
  }
}
