import { useEffect, useState } from "react";

interface NotificationSystemProps {
  type: "success" | "warning" | null;
  message: string;
  details?: string;
  onClose: () => void;
}

export default function NotificationSystem({ 
  type, 
  message, 
  details, 
  onClose 
}: NotificationSystemProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show notification when props change
  useEffect(() => {
    if (type) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [type, message, onClose]);
  
  if (!type) return null;
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case "success":
        return "check_circle";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };
  
  // Get color based on notification type
  const getColor = () => {
    switch (type) {
      case "success":
        return "green-500";
      case "warning":
        return "yellow-500";
      default:
        return "blue-500";
    }
  };
  
  // Get border color based on notification type
  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-500";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-4">
      <div 
        className={`bg-white border-l-4 ${getBorderColor()} rounded-md shadow-lg overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className={`material-icons text-${getColor()}`}>
                {getIcon()}
              </span>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-neutral-900">{message}</p>
              {details && (
                <p className="mt-1 text-sm text-neutral-600">{details}</p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button 
                onClick={() => {
                  setIsVisible(false);
                  onClose();
                }}
                className="bg-white rounded-md inline-flex text-neutral-400 hover:text-neutral-500 focus:outline-none"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
