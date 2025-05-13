import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, LogOut, AlertTriangle } from "lucide-react";

interface SessionManagementProps {
  onForceLogout: () => void;
  onLogout: () => void;
}

export default function SessionManagement({ onForceLogout, onLogout }: SessionManagementProps) {
  const [showSecurityAlert, setShowSecurityAlert] = useState(true);
  
  // Fetch active sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['/api/auth/sessions'],
  });

  // Format date for display
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    const now = new Date();
    
    if (dateObj.toDateString() === now.toDateString()) {
      return `Today, ${format(dateObj, 'h:mm a')}`;
    } else if (
      dateObj.toDateString() === 
      new Date(now.setDate(now.getDate() - 1)).toDateString()
    ) {
      return `Yesterday, ${format(dateObj, 'h:mm a')}`;
    } else {
      return format(dateObj, 'MMM d, h:mm a');
    }
  };

  // Get device icon based on user agent
  const getDeviceIcon = (deviceInfo: string) => {
    if (!deviceInfo) return 'devices';
    
    const deviceInfo_lower = deviceInfo.toLowerCase();
    if (deviceInfo_lower.includes('iphone') || deviceInfo_lower.includes('ipad') || deviceInfo_lower.includes('android')) {
      return 'smartphone';
    } else if (deviceInfo_lower.includes('macintosh') || deviceInfo_lower.includes('mac os')) {
      return 'laptop_mac';
    } else if (deviceInfo_lower.includes('windows')) {
      return 'computer';
    } else {
      return 'devices';
    }
  };

  // Get device name based on user agent
  const getDeviceName = (deviceInfo: string) => {
    if (!deviceInfo) return 'Unknown Device';
    
    const deviceInfo_lower = deviceInfo.toLowerCase();
    let browser = 'Browser';
    let device = 'Device';
    
    // Detect browser
    if (deviceInfo_lower.includes('chrome')) {
      browser = 'Chrome';
    } else if (deviceInfo_lower.includes('firefox')) {
      browser = 'Firefox';
    } else if (deviceInfo_lower.includes('safari')) {
      browser = 'Safari';
    } else if (deviceInfo_lower.includes('edge')) {
      browser = 'Edge';
    }
    
    // Detect device/OS
    if (deviceInfo_lower.includes('iphone')) {
      device = 'iPhone';
    } else if (deviceInfo_lower.includes('ipad')) {
      device = 'iPad';
    } else if (deviceInfo_lower.includes('android')) {
      device = 'Android';
    } else if (deviceInfo_lower.includes('macintosh') || deviceInfo_lower.includes('mac os')) {
      device = 'Mac';
    } else if (deviceInfo_lower.includes('windows')) {
      device = 'Windows';
    } else if (deviceInfo_lower.includes('linux')) {
      device = 'Linux';
    }
    
    return `${browser} on ${device}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary-500 text-white">
        <CardTitle className="text-xl font-medium">Session Management</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <h3 className="text-base font-medium text-neutral-800 mb-3">Active Sessions</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-md p-3">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div key={index} className="border border-neutral-200 rounded-md p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="material-icons text-primary-500 mr-2">
                      {getDeviceIcon(session.deviceInfo)}
                    </span>
                    <span className="text-sm font-medium text-neutral-800">
                      {getDeviceName(session.deviceInfo)}
                    </span>
                  </div>
                  <span className={`text-xs ${session.isCurrent ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-700'} px-2 py-0.5 rounded-full`}>
                    {session.isCurrent ? 'Current' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600 mb-2">
                  <span>{session.location || 'Unknown location'}</span>
                  <span>{session.ipAddress || 'Unknown IP'}</span>
                </div>
                <div className="text-xs text-neutral-500">
                  Active since: {session.createdAt ? formatDate(session.createdAt) : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-neutral-500">
            No active sessions found
          </div>
        )}
        
        {showSecurityAlert && sessions && sessions.length > 1 && (
          <Alert variant="warning" className="mt-6 mb-2 border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 text-sm font-medium">Multiple Active Sessions Detected</AlertTitle>
            <AlertDescription className="text-amber-800 text-xs">
              You have {sessions.length} active sessions. If you don't recognize any of these devices, 
              you should use the "Force Logout" button below to secure your account.
            </AlertDescription>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
              onClick={() => setShowSecurityAlert(false)}
            >
              ✕
            </Button>
          </Alert>
        )}
          
        <div className="mt-6 space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Force Logout All Other Devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will immediately disconnect all sessions except your current one. 
                  Anyone else using your account will be logged out.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onForceLogout} className="bg-red-600 hover:bg-red-700">
                  Yes, Force Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full flex items-center justify-center px-4 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout Current Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
