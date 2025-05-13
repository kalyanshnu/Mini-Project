import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OtpFormProps {
  email: string;
  onSuccess: (locationInfo: any) => void;
  onBack: () => void;
}

export default function OtpForm({ email, onSuccess, onBack }: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // Handle OTP input change
  const handleChange = (value: string, index: number) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    
    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down events (for backspace)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      
      // Set focus to the last input
      inputRefs.current[5]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Check if OTP is complete
    if (otp.some(digit => !digit)) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits of the OTP",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the API to verify the OTP
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        email,
        otp: otp.join(""),
      });
      
      const data = await response.json();
      
      // Call the onSuccess callback
      onSuccess(data.locationInfo);
    } catch (error) {
      console.error("OTP verification error:", error);
      
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsResending(true);
    
    try {
      // Get stored catchphrase from session storage (not secure, but for demo purposes)
      const catchphrase = sessionStorage.getItem("catchphrase") || "";
      
      // Call the API to resend OTP
      await apiRequest("POST", "/api/auth/verify-identity", {
        email,
        catchphrase,
      });
      
      // Reset timer
      setTimeLeft(300);
      
      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      
      toast({
        title: "Resend Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Initialize timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-4 text-center">
        <span className="material-icons text-5xl text-primary-500 mb-2">email</span>
        <h3 className="text-lg font-medium text-neutral-800">Check your email</h3>
        <p className="text-sm text-neutral-600 mb-4">We've sent a one-time password to <span className="font-medium">{email}</span></p>
        
        {/* Development Testing - Show info about where to find OTP */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2 text-sm text-yellow-800">
          <p><strong>Development Note:</strong> Since this is a demo, the OTP will be printed in the server logs.</p>
          <p className="mt-1">Check the terminal console for a line starting with <code>[DEVELOPMENT OTP]</code>.</p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3 text-center">Enter the 6-digit code</label>
        <div className="flex justify-between max-w-xs mx-auto gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={otp[i]}
              onChange={(e) => handleChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={i === 0 ? handlePaste : undefined}
              ref={(el) => (inputRefs.current[i] = el)}
              className="w-12 h-12 text-center text-xl border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-center text-neutral-500">
          <span>{formatTime()}</span> remaining.{' '}
          <button
            type="button"
            className="text-primary-500 hover:text-primary-700 focus:outline-none"
            onClick={handleResendOtp}
            disabled={isResending || timeLeft > 0}
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </p>
      </div>
      
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          className="px-4 py-2 text-neutral-700 bg-neutral-200 rounded-md hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
          onClick={onBack}
          disabled={isLoading}
        >
          <span className="material-icons align-middle mr-1 text-sm">arrow_back</span>
          Back
        </Button>
        <Button
          type="button"
          variant="default"
          className="px-4 py-2"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            <span className="flex items-center">
              Verify
              <span className="material-icons align-middle ml-1 text-sm">arrow_forward</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
