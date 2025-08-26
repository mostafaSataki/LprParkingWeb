"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomDropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

export function CustomDropdownMenu({ 
  trigger, 
  children, 
  align = "end", 
  className 
}: CustomDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Memoize align classes to prevent recalculation
  const alignClasses = useMemo(() => {
    switch (align) {
      case "start":
        return "left-0";
      case "center":
        return "left-1/2 transform -translate-x-1/2";
      case "end":
      default:
        return "right-0";
    }
  }, [align]);

  // Memoize click handler to prevent unnecessary re-renders
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current && 
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current && 
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  // Optimized effect for event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, handleClickOutside]);

  // Memoize dropdown classes
  const dropdownClasses = useMemo(() => cn(
    "absolute top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50",
    alignClasses,
    className
  ), [alignClasses, className]);

  return (
    <div className="relative inline-block">
      <div ref={triggerRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      </div>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className={dropdownClasses}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface CustomDropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
  href?: string;
}

export function CustomDropdownMenuItem({ 
  children, 
  onClick, 
  className,
  asChild = false,
  href
}: CustomDropdownMenuItemProps) {
  // Memoize base classes
  const baseClasses = useMemo(() => cn(
    "flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded-md transition-colors duration-150",
    className
  ), [className]);

  // Memoize click handler
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  if (asChild && href) {
    return (
      <a href={href} className={baseClasses}>
        {children}
      </a>
    );
  }

  return (
    <div 
      className={baseClasses}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

export function CustomDropdownMenuSeparator() {
  return <div className="border-t border-gray-200 my-1" />;
}