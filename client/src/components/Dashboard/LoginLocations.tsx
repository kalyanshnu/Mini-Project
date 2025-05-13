import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLocations() {
  // Fetch login activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/auth/login-activities'],
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary-500 text-white">
        <CardTitle className="text-xl font-medium">Login Locations</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-2 h-64 relative overflow-hidden">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
              <p className="text-neutral-500 text-sm font-medium">
                {activities && activities.length > 0
                  ? "Your login locations are being tracked"
                  : "No login locations recorded yet"}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h3 className="text-base font-medium text-neutral-800 mb-2">Location Summary</h3>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="text-sm text-neutral-600">
              <p>You have logged in from {getUniqueLocationCount(activities)} different locations.</p>
              <p>Most recent location: {activities[0]?.location || 'Unknown'}</p>
            </div>
          ) : (
            <p className="text-sm text-neutral-600">
              No location data available. Your login locations will be tracked for security.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to count unique locations
function getUniqueLocationCount(activities: any[]) {
  if (!activities || activities.length === 0) return 0;
  
  const uniqueLocations = new Set(
    activities
      .filter(activity => activity.location)
      .map(activity => activity.location)
  );
  
  return uniqueLocations.size;
}
