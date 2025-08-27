import { useState, useEffect } from 'react';

/**
 * A hook to safely handle dates in SSR environments
 * Prevents hydration errors by ensuring date values are consistent between server and client
 */
export function useSSRSafeDate(serverDate?: Date | string) {
  const [date, setDate] = useState<Date>(() => {
    // If we're on the server, return a fixed date or the provided server date
    if (typeof window === 'undefined') {
      return serverDate ? new Date(serverDate) : new Date('2024-01-01T00:00:00');
    }
    // If we're on the client, use the provided date or current date
    return serverDate ? new Date(serverDate) : new Date();
  });

  // Update the date on client-side if needed
  useEffect(() => {
    if (serverDate) {
      setDate(new Date(serverDate));
    }
  }, [serverDate]);

  return date;
}

/**
 * A hook to safely handle date formatting in SSR environments
 */
export function useSSRSafeDateFormat() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatPersianDate = (date: Date | string, format: string = "YYYY/MM/DD HH:mm"): string => {
    if (!isClient) {
      // Return a consistent format for server-side rendering
      return "۱۴۰۳/۰۶/۰۵، ۱۲:۰۰";
    }
    
    try {
      // Dynamic import would be better, but for simplicity we'll use a fallback
      // In a real app, you might want to handle this differently
      const dateObj = new Date(date);
      return dateObj.toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // Fallback to simple formatting
      const dateObj = new Date(date);
      return dateObj.toLocaleString('fa-IR');
    }
  };

  return { formatPersianDate };
}