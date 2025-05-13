import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface SecurityStatusProps {
  className?: string;
}

export default function SecurityStatus({ className = "" }: SecurityStatusProps) {
  // Fetch user data
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch login activities
  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['/api/auth/login-activities'],
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

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-primary-500 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medium">Security Dashboard</CardTitle>
          <div className="text-sm bg-primary-700 px-3 py-1 rounded-full">Secure</div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <span className="material-icons text-4xl text-green-500 mr-4">verified_user</span>
          <div>
            <h3 className="text-lg font-medium text-neutral-800">Authentication Status</h3>
            {isUserLoading ? (
              <Skeleton className="h-4 w-32 mt-1" />
            ) : (
              <>
                <p className="text-sm text-neutral-600">Welcome back, {user?.username}!</p>
                <p className="text-xs text-neutral-500">
                  Last login: {activities?.[0] ? formatDate(activities[0].createdAt) : "N/A"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Security Features Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-neutral-200 rounded-md p-4">
            <div className="flex items-center mb-2">
              <span className="material-icons text-primary-500 mr-2">vpn_key</span>
              <h4 className="text-sm font-medium text-neutral-800">ECC Authentication</h4>
            </div>
            <p className="text-xs text-neutral-600 mb-2">Your account is secured with Elliptic Curve Cryptography.</p>
            <div className="flex items-center">
              <div className="h-2 bg-neutral-200 rounded-full w-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-xs font-medium text-green-500 ml-2">Active</span>
            </div>
          </div>
          
          <div className="border border-neutral-200 rounded-md p-4">
            <div className="flex items-center mb-2">
              <span className="material-icons text-primary-500 mr-2">smartphone</span>
              <h4 className="text-sm font-medium text-neutral-800">Two-Factor Authentication</h4>
            </div>
            <p className="text-xs text-neutral-600 mb-2">Email-based OTP verification is enabled.</p>
            <div className="flex items-center">
              <div className="h-2 bg-neutral-200 rounded-full w-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-xs font-medium text-green-500 ml-2">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-neutral-800 mb-3">Recent Login Activity</h3>
          <div className="overflow-hidden border border-neutral-200 rounded-md">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {isActivitiesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    </tr>
                  ))
                ) : activities && activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {formatDate(activity.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                        {activity.location || "Unknown"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
                        {activity.ipAddress || "Unknown"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          activity.status === 'successful' ? 'bg-green-100 text-green-800' :
                          activity.status === 'new_location' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {activity.status === 'successful' ? 'Successful' :
                           activity.status === 'new_location' ? 'New Location' :
                           'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-neutral-500">
                      No login activities found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Map */}
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-3">Login Locations</h3>
          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-2 h-64 relative overflow-hidden">
            <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
              <p className="text-neutral-500 text-sm font-medium">Location tracking map will be displayed here</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
