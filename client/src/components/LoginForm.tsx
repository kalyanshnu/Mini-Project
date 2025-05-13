import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generatePublicKey } from "@/lib/ecc";

// Define form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  catchphrase: z.string().min(4, "Catchphrase must be at least 4 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      catchphrase: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Generate public key from catchphrase - ensures consistency with registration
      const publicKey = await generatePublicKey(values.catchphrase);
      
      // Call the API to verify identity with the email and public key
      await apiRequest("POST", "/api/auth/verify-identity", {
        email: values.email,
        catchphrase: values.catchphrase,
        publicKey // Include the public key for additional verification
      });
      
      // If successful, call the onSuccess callback
      onSuccess(values.email);
    } catch (error) {
      console.error("Identity verification error:", error);
      
      // Determine if it's an authentication error (401)
      let errorMessage = "Failed to verify identity";
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        errorMessage = "Invalid email or catchphrase. Please check your credentials and try again.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-700">Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="catchphrase"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-700">Catchphrase</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Enter your secret catchphrase"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLoading}
                />
              </FormControl>
              <p className="mt-1 text-sm text-neutral-500">This will be hashed to generate your ECC key.</p>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="default"
            className="px-4 py-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center">
                Continue
                <span className="material-icons align-middle ml-1 text-sm">arrow_forward</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
