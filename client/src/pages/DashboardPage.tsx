import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import NavigationTabs from "@/components/NavigationTabs";
import SecurityStatus from "@/components/Dashboard/SecurityStatus";
import AccountProfile from "@/components/Dashboard/AccountProfile";
import SessionManagement from "@/components/Dashboard/SessionManagement";
import NotificationSystem from "@/components/NotificationSystem";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [notification, setNotification] = useState<{
    type: "success" | "warning" | null;
    message: string;
    details?: string;
  }>({ type: null, message: "" });

  // Fetch user profile
  const { data: userData, error: userError, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (userError) {
      setLocation("/login");
    }
  }, [userError, setLocation]);

  // Handle force logout
  const handleForceLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/force-logout');
      
      setNotification({
        type: "success",
        message: "Force logout successful",
        details: "All other devices have been logged out"
      });
    } catch (error) {
      console.error("Force logout error:", error);
      
      setNotification({
        type: "warning",
        message: "Failed to force logout",
        details: "Please try again later"
      });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (userLoading) {
    return (
      <div className="container mx-auto p-4 min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-b-2 border-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen bg-neutral-100">
      <NavigationTabs activeTab="dashboard" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Security Status (2/3 width on large screens) */}
        <SecurityStatus className="lg:col-span-2" />
        
        {/* Account and Session Management (1/3 width on large screens) */}
        <div className="space-y-6">
          <AccountProfile />
          <SessionManagement 
            onForceLogout={handleForceLogout} 
            onLogout={handleLogout} 
          />
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
