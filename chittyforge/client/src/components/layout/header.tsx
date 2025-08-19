import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // In a real app, this would update theme context
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-bg-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-electric-blue-500 to-mint-green-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-fingerprint text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-electric-blue-400 to-mint-green-400 bg-clip-text text-transparent">
                ChittyID
              </span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#dashboard" 
              className="text-white hover:text-electric-blue-400 transition-colors"
              data-testid="link-dashboard"
            >
              Dashboard
            </a>
            <a 
              href="#verify" 
              className="text-slate-400 hover:text-white transition-colors"
              data-testid="link-verify"
            >
              Verify ID
            </a>
            <a 
              href="#badges" 
              className="text-slate-400 hover:text-white transition-colors"
              data-testid="link-badges"
            >
              Badges
            </a>
            <a 
              href="#profile" 
              className="text-slate-400 hover:text-white transition-colors"
              data-testid="link-profile"
            >
              Profile
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-white"
              data-testid="button-notifications"
            >
              <i className="fas fa-bell"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white"
              data-testid="button-theme-toggle"
            >
              <i className={`fas fa-${isDark ? 'moon' : 'sun'}`}></i>
            </Button>
            {user && (
              <img 
                src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                alt="Profile Avatar" 
                className="w-8 h-8 rounded-full border-2 border-electric-blue-500/30"
                data-testid="img-avatar"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
