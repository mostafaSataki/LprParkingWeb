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
  Calendar,
  Camera,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavigationMenuProps {
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  currentShift?: {
    name: string;
    operator: string;
  };
}

export function NavigationMenuCustom({ 
  soundEnabled = true, 
  onSoundToggle,
  currentShift 
}: NavigationMenuProps) {
  const { toast } = useToast();
  
  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => [
    { href: "/", icon: BarChart3, label: "داشبورد" },
    { href: "/parking-locations", icon: Car, label: "پارکینگ‌ها" },
    { href: "/gates", icon: Settings, label: "درب‌ها" },
    { href: "/cameras", icon: Camera, label: "دوربین‌ها" },
    { href: "/tariffs", icon: CreditCard, label: "تعرفه‌ها" },
    { href: "/pos", icon: Smartphone, label: "دستگاه‌های POS" },
    { href: "/shifts", icon: Clock, label: "شیفت‌ها" },
    { href: "/users", icon: Users, label: "کاربران" },
    { href: "/contracts", icon: FileText, label: "قراردادها" },
    { href: "/reports", icon: BarChart3, label: "گزارش‌ها" },
    { href: "/hardware", icon: Settings, label: "سخت‌افزار" },
    { href: "/vehicle-groups", icon: Car, label: "گروه‌های خودرو" },
    { href: "/credit-accounts", icon: DollarSign, label: "حساب‌های اعتباری" },
    { href: "/holidays", icon: Calendar, label: "تعطیلات" },
    { href: "/reservations", icon: Calendar, label: "رزروها" },
  ], []);

  const actionItems = useMemo(() => [
    { 
      icon: Settings, 
      label: "تنظیمات", 
      onClick: () => {
        toast({
          title: "تنظیمات",
          description: "در حال انتقال به صفحه تنظیمات...",
        });
        setTimeout(() => {
          window.location.href = '/settings';
        }, 1000);
      }
    },
    { 
      icon: LogOut, 
      label: "خروج", 
      onClick: () => {
        if (confirm('آیا از خروج اطمینان دارید؟')) {
          toast({
            title: "خروج",
            description: "در حال خروج از سیستم...",
          });
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
    },
  ], [toast]);

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
      
      <DropdownMenu>
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
            <DropdownMenuItem key={index} onClick={item.onClick}>
              <item.icon className="h-4 w-4 ml-2" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}