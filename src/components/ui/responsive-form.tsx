"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResponsiveFormProps {
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
  className?: string
}

interface ResponsiveFormSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

interface ResponsiveFormFieldProps {
  label: string
  children: React.ReactNode
  required?: boolean
  className?: string
  fullWidth?: boolean
}

export function ResponsiveForm({ children, onSubmit, className }: ResponsiveFormProps) {
  return (
    <form 
      onSubmit={onSubmit} 
      className={cn("space-y-6", className)}
    >
      {children}
    </form>
  )
}

export function ResponsiveFormSection({ title, children, className }: ResponsiveFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="font-semibold text-lg border-b pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

export function ResponsiveFormField({ label, children, required, className, fullWidth = false }: ResponsiveFormFieldProps) {
  return (
    <div className={cn(
      fullWidth ? "col-span-1 md:col-span-2 lg:col-span-3" : "",
      "space-y-2",
      className
    )}>
      <Label className={cn(required && "after:content-['*'] after:ml-1 after:text-red-500")}>
        {label}
      </Label>
      {children}
    </div>
  )
}

export function ResponsiveFormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {children}
    </div>
  )
}

export function ResponsiveFormActions({ 
  children, 
  className,
  align = "right"
}: { 
  children: React.ReactNode; 
  className?: string;
  align?: "left" | "center" | "right" | "between";
}) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between"
  }

  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-2 pt-4 border-t",
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// Helper components for common form patterns
export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  className,
  fullWidth = false,
  ...props
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  fullWidth?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <ResponsiveFormField label={label} required={required} fullWidth={fullWidth} className={className}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full"
        {...props}
      />
    </ResponsiveFormField>
  )
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  className,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
  fullWidth?: boolean
}) {
  return (
    <ResponsiveFormField label={label} required={required} fullWidth={fullWidth} className={className}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className="w-full"
      />
    </ResponsiveFormField>
  )
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = "انتخاب کنید...",
  className,
  fullWidth = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  fullWidth?: boolean
}) {
  return (
    <ResponsiveFormField label={label} required={required} fullWidth={fullWidth} className={className}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ResponsiveFormField>
  )
}