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

export default function TestMenuPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8">Test Menu</h1>
        
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Menu className="h-4 w-4 ml-2" />
              منو
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            وضعیت منو: {isMenuOpen ? 'باز' : 'بسته'}
          </p>
        </div>
      </div>
    </div>
  );
}