"use client";

import React, { useState, useMemo } from "react";
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

export function NavigationMenuSimple({ 
  soundEnabled = true, 
  onSoundToggle,
  currentShift 
}: NavigationMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => [
    { href: "/", icon: BarChart3, label: "داشبورد" },
    { href: "/tariffs", icon: CreditCard, label: "تعرفه‌ها" },
    { href: "/pos", icon: Smartphone, label: "دستگاه‌های POS" },
    { href: "/shifts", icon: Clock, label: "شیفت‌ها" },
    { href: "/users", icon: Users, label: "کاربران" },
    { href: "/reports", icon: BarChart3, label: "گزارش‌ها" },
    { href: "/hardware", icon: Settings, label: "سخت‌افزار" },
    { href: "/vehicle-groups", icon: Car, label: "گروه‌های خودرو" },
    { href: "/credit-accounts", icon: DollarSign, label: "حساب‌های اعتباری" },
  ], []);

  const actionItems = useMemo(() => [
    { icon: Settings, label: "تنظیمات" },
    { icon: LogOut, label: "خروج" },
  ], []);

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
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <a href={item.href} className="flex items-center">
                <item.icon className="h-4 w-4 ml-2" />
                {item.label}
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {actionItems.map((item, index) => (
            <DropdownMenuItem key={index}>
              <item.icon className="h-4 w-4 ml-2" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}