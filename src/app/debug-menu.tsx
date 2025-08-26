"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Home, Settings, LogOut } from "lucide-react";

export default function DebugMenuPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const handleMenuClick = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    setDebugInfo(`Menu clicked. New state: ${newState ? 'OPEN' : 'CLOSED'}`);
    console.log("Menu clicked, new state:", newState);
  };

  const handleOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    setDebugInfo(`DropdownMenu onOpenChange: ${open ? 'OPEN' : 'CLOSED'}`);
    console.log("DropdownMenu onOpenChange:", open);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Debug Menu</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border">
            <h2 className="font-semibold mb-2">Debug Info:</h2>
            <p className="text-sm text-gray-600">{debugInfo || "No interaction yet"}</p>
            <p className="text-sm text-gray-600 mt-1">
              Menu state: {isMenuOpen ? 'OPEN' : 'CLOSED'}
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h2 className="font-semibold mb-2">Dropdown Menu Test:</h2>
            <DropdownMenu open={isMenuOpen} onOpenChange={handleOpenChange}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" onClick={handleMenuClick}>
                  <Menu className="h-4 w-4 ml-2" />
                  منو
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border shadow-lg">
                <DropdownMenuItem asChild>
                  <a href="/" className="flex items-center">
                    <Home className="h-4 w-4 ml-2" />
                    خانه
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 ml-2" />
                  تنظیمات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-4 bg-white rounded-lg border">
            <h2 className="font-semibold mb-2">Simple Button Test:</h2>
            <Button 
              variant="outline" 
              onClick={() => {
                setDebugInfo("Simple button clicked");
                console.log("Simple button clicked");
              }}
            >
              Simple Button
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}