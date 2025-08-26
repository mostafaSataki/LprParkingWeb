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
import {
  Menu,
  CreditCard,
  Smartphone,
  Clock,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Car,
  DollarSign,
  Volume2,
  VolumeX,
} from "lucide-react";

interface NavigationMenuProps {
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  currentShift?: {
    name: string;
    operator: string;
  };
}

export function NavigationMenu({ 
  soundEnabled = true, 
  onSoundToggle,
  currentShift 
}: NavigationMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {currentShift && (
        <div className="text-right">
          <p className="font-semibold">{currentShift.name}</p>
          <p className="text-sm text-gray-600">اپراتور: {currentShift.operator}</p>
        </div>
      )}
      
      {onSoundToggle && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSoundToggle}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      )}
      
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="h-4 w-4 ml-2" />
            منو
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <a href="/" className="flex items-center">
              <BarChart3 className="h-4 w-4 ml-2" />
              داشبورد
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/tariffs" className="flex items-center">
              <CreditCard className="h-4 w-4 ml-2" />
              تعرفه‌ها
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/pos" className="flex items-center">
              <Smartphone className="h-4 w-4 ml-2" />
              دستگاه‌های POS
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/shifts" className="flex items-center">
              <Clock className="h-4 w-4 ml-2" />
              شیفت‌ها
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/users" className="flex items-center">
              <Users className="h-4 w-4 ml-2" />
              کاربران
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/reports" className="flex items-center">
              <BarChart3 className="h-4 w-4 ml-2" />
              گزارش‌ها
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/hardware" className="flex items-center">
              <Settings className="h-4 w-4 ml-2" />
              سخت‌افزار
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/vehicle-groups" className="flex items-center">
              <Car className="h-4 w-4 ml-2" />
              گروه‌های خودرو
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/credit-accounts" className="flex items-center">
              <DollarSign className="h-4 w-4 ml-2" />
              حساب‌های اعتباری
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Settings className="h-4 w-4 ml-2" />
            تنظیمات
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LogOut className="h-4 w-4 ml-2" />
            خروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}