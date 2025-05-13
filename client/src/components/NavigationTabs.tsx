import { useLocation } from "wouter";

interface NavigationTabsProps {
  activeTab: 'login' | 'register' | 'dashboard';
}

export default function NavigationTabs({ activeTab }: NavigationTabsProps) {
  const [, setLocation] = useLocation();

  const handleTabClick = (tab: 'login' | 'register' | 'dashboard') => {
    switch (tab) {
      case 'login':
        setLocation('/login');
        break;
      case 'register':
        setLocation('/register');
        break;
      case 'dashboard':
        setLocation('/dashboard');
        break;
    }
  };

  return (
    <div className="flex justify-center mb-8 mt-4">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          className={`px-5 py-2.5 text-sm font-medium ${
            activeTab === 'login' 
              ? 'bg-primary-500 text-white' 
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 hover:text-neutral-800'
          } rounded-l-lg focus:z-10 focus:outline-none`}
          onClick={() => handleTabClick('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`px-5 py-2.5 text-sm font-medium ${
            activeTab === 'register' 
              ? 'bg-primary-500 text-white' 
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 hover:text-neutral-800'
          } focus:z-10 focus:outline-none`}
          onClick={() => handleTabClick('register')}
        >
          Register
        </button>
        <button
          type="button"
          className={`px-5 py-2.5 text-sm font-medium ${
            activeTab === 'dashboard' 
              ? 'bg-primary-500 text-white' 
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 hover:text-neutral-800'
          } rounded-r-lg focus:z-10 focus:outline-none`}
          onClick={() => handleTabClick('dashboard')}
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
