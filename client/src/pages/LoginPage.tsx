import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import OtpForm from "@/components/OtpForm";
import NavigationTabs from "@/components/NavigationTabs";
import { useLocation } from "wouter";
import NotificationSystem from "@/components/NotificationSystem";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<"identity" | "otp" | "success">("identity");
  const [email, setEmail] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | null;
    message: string;
    details?: string;
  }>({ type: null, message: "" });

  // Handle identity verification success
  const handleIdentitySuccess = (userEmail: string) => {
    setEmail(userEmail);
    setCurrentStep("otp");
  };

  // Handle OTP verification success
  const handleOtpSuccess = (locationInfo: any) => {
    setCurrentStep("success");
    
    // Show success notification
    setNotification({
      type: "success",
      message: "Login successful!",
      details: locationInfo?.city && locationInfo?.country 
        ? `${locationInfo.city}, ${locationInfo.country}`
        : "Unknown location"
    });
    
    // Redirect to dashboard after a delay
    setTimeout(() => {
      setLocation("/dashboard");
    }, 3000);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-neutral-100">
      <NavigationTabs activeTab="login" />
      
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary-500 p-4 text-white">
            <h2 className="text-xl font-medium">Secure Login</h2>
            <p className="text-sm opacity-80">Passwordless ECC Authentication</p>
          </div>
          
          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center mb-6">
              <div className={`flex items-center ${currentStep === "identity" ? "text-primary-500" : "text-primary-500"} relative`}>
                <div className={`rounded-full transition duration-500 ease-in-out h-8 w-8 py-1 border-2 ${currentStep === "identity" ? "border-primary-500" : "border-primary-500"} text-center font-semibold`}>
                  1
                </div>
                <div className="absolute top-0 -ml-10 text-center mt-10 w-32 text-xs font-medium text-primary-500">Identity</div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep !== "identity" ? "border-primary-500" : "border-neutral-300"}`}></div>
              <div className={`flex items-center ${currentStep === "otp" ? "text-primary-500" : "text-neutral-500"} relative`}>
                <div className={`rounded-full transition duration-500 ease-in-out h-8 w-8 py-1 border-2 ${currentStep === "otp" ? "border-primary-500" : "border-neutral-300"} text-center font-semibold`}>
                  2
                </div>
                <div className="absolute top-0 -ml-10 text-center mt-10 w-32 text-xs font-medium">OTP</div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep === "success" ? "border-primary-500" : "border-neutral-300"}`}></div>
              <div className={`flex items-center ${currentStep === "success" ? "text-primary-500" : "text-neutral-500"} relative`}>
                <div className={`rounded-full transition duration-500 ease-in-out h-8 w-8 py-1 border-2 ${currentStep === "success" ? "border-primary-500" : "border-neutral-300"} text-center font-semibold`}>
                  3
                </div>
                <div className="absolute top-0 -ml-10 text-center mt-10 w-32 text-xs font-medium">Success</div>
              </div>
            </div>

            {currentStep === "identity" && (
              <LoginForm onSuccess={handleIdentitySuccess} />
            )}

            {currentStep === "otp" && (
              <OtpForm email={email} onSuccess={handleOtpSuccess} onBack={() => setCurrentStep("identity")} />
            )}

            {currentStep === "success" && (
              <div className="text-center py-4">
                <div className="flex justify-center">
                  <span className="material-icons text-6xl text-green-500 mb-2">check_circle</span>
                </div>
                <h3 className="text-xl font-medium text-neutral-800 mb-2">Authentication Successful</h3>
                <p className="text-sm text-neutral-600 mb-6">You are being redirected to your dashboard...</p>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-primary-500 rounded-full animate-spin"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationSystem 
        type={notification.type}
        message={notification.message}
        details={notification.details}
        onClose={() => setNotification({ type: null, message: "" })}
      />
    </div>
  );
}
