"use client";

import React, { useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { cn } from "@/lib/utils";

export interface PersianDatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format?: string;
  timePicker?: boolean;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = "تاریخ را انتخاب کنید",
  disabled = false,
  className,
  format = "YYYY/MM/DD",
  timePicker = false,
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleDateChange = (dateObject: DateObject | null) => {
    if (dateObject) {
      onChange?.(dateObject.toDate());
    } else {
      onChange?.(null);
    }
    setOpen(false);
  };

  const displayValue = value ? formatPersianDate(value, format) : "";

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DatePicker
            value={value ? new DateObject(value) : null}
            onChange={handleDateChange}
            calendar={persian}
            locale={persian_fa}
            format={format}
            timePicker={timePicker}
            className="persian-datepicker"
            containerClassName="persian-datepicker-container"
            arrowClassName="persian-datepicker-arrow"
            weekDaysClassName="persian-datepicker-weekdays"
            daysClassName="persian-datepicker-days"
            monthYearClassName="persian-datepicker-month-year"
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export interface PersianDateRangePickerProps {
  value?: [Date | null, Date | null];
  onChange?: (dates: [Date | null, Date | null]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format?: string;
}

export function PersianDateRangePicker({
  value,
  onChange,
  placeholder = "محدوده تاریخ را انتخاب کنید",
  disabled = false,
  className,
  format = "YYYY/MM/DD",
}: PersianDateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleDateChange = (dates: DateObject[] | null) => {
    if (dates && dates.length === 2) {
      onChange?.([dates[0]?.toDate() || null, dates[1]?.toDate() || null]);
    } else {
      onChange?.([null, null]);
    }
    setOpen(false);
  };

  const displayValue = value && value[0] && value[1] 
    ? `${formatPersianDate(value[0], format)} - ${formatPersianDate(value[1], format)}`
    : "";

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !displayValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DatePicker
            value={value?.[0] ? new DateObject(value[0]) : null}
            onChange={handleDateChange}
            calendar={persian}
            locale={persian_fa}
            format={format}
            range
            rangeHover
            className="persian-datepicker"
            containerClassName="persian-datepicker-container"
            arrowClassName="persian-datepicker-arrow"
            weekDaysClassName="persian-datepicker-weekdays"
            daysClassName="persian-datepicker-days"
            monthYearClassName="persian-datepicker-month-year"
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Custom input component for Persian numerals
export interface PersianNumeralsInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number | string;
  onChange?: (value: string) => void;
  label?: string;
}

export function PersianNumeralsInput({
  value,
  onChange,
  label,
  className,
  ...props
}: PersianNumeralsInputProps) {
  const [internalValue, setInternalValue] = useState(() => {
    if (value === undefined || value === null || value === "") return "";
    return toPersianNumerals(value.toString());
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const persianValue = e.target.value;
    setInternalValue(persianValue);
    
    // Convert to English numerals for internal processing
    const englishValue = persianValue.replace(/[۰-۹]/g, (digit) => {
      const persianNumerals = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
      return persianNumerals.indexOf(digit).toString();
    });
    
    onChange?.(englishValue);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <Input
        {...props}
        value={internalValue}
        onChange={handleChange}
        className={cn("text-right", className)}
        dir="rtl"
      />
    </div>
  );
}