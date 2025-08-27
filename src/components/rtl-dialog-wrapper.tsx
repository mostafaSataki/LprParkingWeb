"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RTLDialogWrapperProps {
  children: ReactNode;
  className?: string;
}

export function RTLDialogWrapper({ children, className }: RTLDialogWrapperProps) {
  return (
    <div 
      dir="rtl" 
      className={cn(
        "w-full h-full",
        "text-right", // Ensure text alignment
        "[&>*]:text-right", // Ensure all children are right-aligned
        "[&>*]:ml-auto", // Add auto margin to left for proper spacing
        "[&>*]:mr-0", // Remove right margin
        className
      )}
      style={{
        direction: 'rtl',
        textAlign: 'right',
      }}
    >
      {children}
    </div>
  );
}