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
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  email: z.string().email("Please enter a valid email address"),
  catchphrase: z.string().min(4, "Catchphrase must be at least 4 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegistrationFormProps {
  onSuccess: () => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      catchphrase: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      // Generate public key from catchphrase
      const publicKey = await generatePublicKey(values.catchphrase);
      
      // Call the API to register the user
      await apiRequest("POST", "/api/auth/register", {
        ...values,
        publicKey,
      });
      
      // If successful, call the onSuccess callback
      onSuccess();
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully",
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Failed to register user",
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-700">Username</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Choose a username"
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
              <FormLabel className="text-sm font-medium text-neutral-700">Secret Catchphrase</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Create a memorable catchphrase"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isLoading}
                />
              </FormControl>
              <p className="mt-1 text-sm text-neutral-500">This will be hashed to generate your ECC key. Make it memorable but not easily guessable.</p>
              <FormMessage className="text-red-500 text-xs" />
            </FormItem>
          )}
        />
        
        <div className="mb-6 bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h4 className="text-sm font-medium text-neutral-800 mb-2 flex items-center">
            <span className="material-icons text-primary-500 mr-1 text-base">security</span>
            Security Information
          </h4>
          <ul className="text-xs text-neutral-600 space-y-1">
            <li className="flex items-start">
              <span className="material-icons text-xs mr-1 mt-0.5 text-green-500">check_circle</span>
              Your catchphrase is converted to a secure SHA-256 hash
            </li>
            <li className="flex items-start">
              <span className="material-icons text-xs mr-1 mt-0.5 text-green-500">check_circle</span>
              We use ECC (Elliptic Curve Cryptography) for authentication
            </li>
            <li className="flex items-start">
              <span className="material-icons text-xs mr-1 mt-0.5 text-green-500">check_circle</span>
              Your private keys are never stored on our servers
            </li>
            <li className="flex items-start">
              <span className="material-icons text-xs mr-1 mt-0.5 text-green-500">check_circle</span>
              2FA with email OTP protects your account
            </li>
          </ul>
        </div>
        
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
                Registering...
              </span>
            ) : (
              "Register Account"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
