import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AccountProfile() {
  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Get initials from username
  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Truncate public key
  const truncatePublicKey = (key: string) => {
    if (!key) return '';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary-500 text-white">
        <CardTitle className="text-xl font-medium">Account Profile</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <Skeleton className="h-16 w-16 rounded-full mr-4" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 text-2xl font-medium mr-4">
                {user?.username ? getInitials(user.username) : '?'}
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-800">{user?.username}</h3>
                <p className="text-sm text-neutral-600">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Account created</span>
                <span className="text-neutral-800 font-medium">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Public key</span>
                <span className="text-neutral-800 font-medium truncate max-w-[120px]" title={user?.publicKey}>
                  {user?.publicKey ? truncatePublicKey(user.publicKey) : 'Unknown'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center px-4 py-2 border border-primary-500 text-primary-500 rounded-md hover:bg-primary-50"
              >
                <span className="material-icons mr-2 text-sm">manage_accounts</span>
                Update Profile
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
