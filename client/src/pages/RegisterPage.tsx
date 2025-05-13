import { useState } from "react";
import NavigationTabs from "@/components/NavigationTabs";
import RegistrationForm from "@/components/RegistrationForm";
import NotificationSystem from "@/components/NotificationSystem";
import { useLocation } from "wouter";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | null;
    message: string;
    details?: string;
  }>({ type: null, message: "" });

  const handleRegistrationSuccess = () => {
    // Show success notification
    setNotification({
      type: "success",
      message: "Registration successful!",
      details: "You can now log in with your credentials"
    });
    
    // Redirect to login page after a delay
    setTimeout(() => {
      setLocation("/login");
    }, 3000);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-neutral-100">
      <NavigationTabs activeTab="register" />
      
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary-500 p-4 text-white">
            <h2 className="text-xl font-medium">Create Account</h2>
            <p className="text-sm opacity-80">Secure ECC-based Authentication</p>
          </div>
          
          <div className="p-6">
            <RegistrationForm onSuccess={handleRegistrationSuccess} />
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
