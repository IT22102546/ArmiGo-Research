'use client';

import { Search, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function DashHeader({ sidebarOpen, setSidebarOpen }: DashHeaderProps) {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white transform rotate-45 rounded-sm"></div>
          </div>
          <span className="text-lg font-semibold text-foreground">
            Learn App
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            placeholder="Ctrl + K"
            className="pl-10 bg-muted/50 border-0 focus:bg-background w-full h-10 rounded-md outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
            2
          </span>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            <span className="text-sm font-medium">SB</span>
          </div>
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
            ✓
          </span>
        </Button>
      </div>
    </header>
  );
}
