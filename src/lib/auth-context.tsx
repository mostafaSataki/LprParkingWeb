"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: "OPERATOR" | "SUPERVISOR" | "ADMIN" | "AUDITOR";
  isActive: boolean;
  assignedLocations: string[];
  assignedGates: string[];
}

interface ParkingLocation {
  id: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  gates: Gate[];
}

interface Gate {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT";
  direction: "IN" | "OUT";
  isActive: boolean;
  cameras: Camera[];
}

interface Camera {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT";
  isActive: boolean;
  ipAddress?: string;
  rtspUrl?: string;
}

interface AuthContextType {
  user: User | null;
  currentLocation: ParkingLocation | null;
  currentGate: Gate | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string, locationId: string, gateId: string) => Promise<boolean>;
  logout: () => void;
  setLocation: (locationId: string) => void;
  setGate: (gateId: string) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demo
const mockUsers: User[] = [
  {
    id: "1",
    username: "operator1",
    name: "علی رضایی",
    email: "ali@example.com",
    role: "OPERATOR",
    isActive: true,
    assignedLocations: ["1", "2"],
    assignedGates: ["1", "2", "3", "4"]
  },
  {
    id: "2", 
    username: "operator2",
    name: "مریم احمدی",
    email: "maryam@example.com",
    role: "OPERATOR",
    isActive: true,
    assignedLocations: ["3"],
    assignedGates: ["5", "6"]
  },
  {
    id: "3",
    username: "supervisor1",
    name: "رضا محمدی",
    email: "reza@example.com",
    role: "SUPERVISOR",
    isActive: true,
    assignedLocations: ["1", "2", "3"],
    assignedGates: ["1", "2", "3", "4", "5", "6"]
  },
  {
    id: "4",
    username: "admin",
    name: "مدیر سیستم",
    email: "admin@example.com",
    role: "ADMIN",
    isActive: true,
    assignedLocations: ["1", "2", "3"],
    assignedGates: ["1", "2", "3", "4", "5", "6"]
  }
];

// Mock passwords (in real app, these would be hashed)
const mockPasswords: Record<string, string> = {
  "operator1": "123456",
  "operator2": "123456", 
  "supervisor1": "123456",
  "admin": "admin123"
};

const mockLocations: ParkingLocation[] = [
  {
    id: "1",
    name: "پارکینگ مرکزی",
    description: "پارکینگ اصلی مرکز تجاری",
    address: "میدان آزادی، خیابان آزادی",
    isActive: true,
    gates: [
      { id: "1", name: "دریازه ورودی اصلی", type: "ENTRY", direction: "IN", isActive: true, cameras: [
        { id: "1", name: "دوربین ورودی اصلی", type: "ENTRY", isActive: true, ipAddress: "192.168.1.101", rtspUrl: "rtsp://192.168.1.101:554/stream" }
      ]},
      { id: "2", name: "دریازه خروجی اصلی", type: "EXIT", direction: "OUT", isActive: true, cameras: [
        { id: "2", name: "دوربین خروجی اصلی", type: "EXIT", isActive: true, ipAddress: "192.168.1.102", rtspUrl: "rtsp://192.168.1.102:554/stream" }
      ]}
    ]
  },
  {
    id: "2",
    name: "پارکینگ غرب",
    description: "پارکینگ مجتمع تجاری غرب",
    address: "بلوار کشاورز، خیابان غربی",
    isActive: true,
    gates: [
      { id: "3", name: "دریازه ورودی غرب", type: "ENTRY", direction: "IN", isActive: true, cameras: [
        { id: "3", name: "دوربین ورودی غرب", type: "ENTRY", isActive: true, ipAddress: "192.168.1.103", rtspUrl: "rtsp://192.168.1.103:554/stream" }
      ]},
      { id: "4", name: "دریازه خروجی غرب", type: "EXIT", direction: "OUT", isActive: true, cameras: [
        { id: "4", name: "دوربین خروجی غرب", type: "EXIT", isActive: true, ipAddress: "192.168.1.104", rtspUrl: "rtsp://192.168.1.104:554/stream" }
      ]}
    ]
  },
  {
    id: "3",
    name: "پارکینگ شرق",
    description: "پارکینگ مجتمع اداری شرق",
    address: "خیابان امام خمینی، خیابان شرقی",
    isActive: true,
    gates: [
      { id: "5", name: "دریازه ورودی شرق", type: "ENTRY", direction: "IN", isActive: true, cameras: [
        { id: "5", name: "دوربین ورودی شرق", type: "ENTRY", isActive: true, ipAddress: "192.168.1.105", rtspUrl: "rtsp://192.168.1.105:554/stream" }
      ]},
      { id: "6", name: "دریازه خروجی شرق", type: "EXIT", direction: "OUT", isActive: true, cameras: [
        { id: "6", name: "دوربین خروجی شرق", type: "EXIT", isActive: true, ipAddress: "192.168.1.106", rtspUrl: "rtsp://192.168.1.106:554/stream" }
      ]}
    ]
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentLocation, setCurrentLocation] = useState<ParkingLocation | null>(null);
  const [currentGate, setCurrentGate] = useState<Gate | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('parkingUser');
    const savedLocation = localStorage.getItem('parkingLocation');
    const savedGate = localStorage.getItem('parkingGate');

    if (savedUser && savedLocation && savedGate) {
      try {
        const userData = JSON.parse(savedUser);
        const locationData = JSON.parse(savedLocation);
        const gateData = JSON.parse(savedGate);
        
        setUser(userData);
        setCurrentLocation(locationData);
        setCurrentGate(gateData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        clearAuthData();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string, locationId: string, gateId: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find user
      const foundUser = mockUsers.find(u => 
        u.username === username && 
        u.isActive
      );

      if (!foundUser) {
        return false;
      }

      // Check password
      const correctPassword = mockPasswords[username];
      if (password !== correctPassword) {
        return false;
      }

      // Check if user has access to selected location
      if (!foundUser.assignedLocations.includes(locationId)) {
        return false;
      }

      // Check if user has access to selected gate
      if (!foundUser.assignedGates.includes(gateId)) {
        return false;
      }

      // Find location and gate
      const location = mockLocations.find(l => l.id === locationId);
      const gate = location?.gates.find(g => g.id === gateId);

      if (!location || !gate || !location.isActive || !gate.isActive) {
        return false;
      }

      // Login successful
      setUser(foundUser);
      setCurrentLocation(location);
      setCurrentGate(gate);
      setIsLoggedIn(true);

      // Save to localStorage
      localStorage.setItem('parkingUser', JSON.stringify(foundUser));
      localStorage.setItem('parkingLocation', JSON.stringify(location));
      localStorage.setItem('parkingGate', JSON.stringify(gate));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentLocation(null);
    setCurrentGate(null);
    setIsLoggedIn(false);
    clearAuthData();
  };

  const clearAuthData = () => {
    localStorage.removeItem('parkingUser');
    localStorage.removeItem('parkingLocation');
    localStorage.removeItem('parkingGate');
  };

  const setLocation = (locationId: string) => {
    if (!user) return;
    
    if (!user.assignedLocations.includes(locationId)) {
      console.error('User does not have access to this location');
      return;
    }

    const location = mockLocations.find(l => l.id === locationId);
    if (location && location.isActive) {
      setCurrentLocation(location);
      setCurrentGate(null); // Reset gate when location changes
      localStorage.setItem('parkingLocation', JSON.stringify(location));
      localStorage.removeItem('parkingGate');
    }
  };

  const setGate = (gateId: string) => {
    if (!user || !currentLocation) return;
    
    if (!user.assignedGates.includes(gateId)) {
      console.error('User does not have access to this gate');
      return;
    }

    const gate = currentLocation.gates.find(g => g.id === gateId);
    if (gate && gate.isActive) {
      setCurrentGate(gate);
      localStorage.setItem('parkingGate', JSON.stringify(gate));
    }
  };

  const refreshUser = () => {
    // Refresh user data from server (in real app)
    if (user) {
      const refreshedUser = mockUsers.find(u => u.id === user.id);
      if (refreshedUser) {
        setUser(refreshedUser);
        localStorage.setItem('parkingUser', JSON.stringify(refreshedUser));
      }
    }
  };

  const value: AuthContextType = {
    user,
    currentLocation,
    currentGate,
    isLoggedIn,
    loading,
    login,
    logout,
    setLocation,
    setGate,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, isLoggedIn, loading } = useAuth();
  
  if (loading) {
    return { user: null, isLoggedIn: false, loading: true };
  }
  
  if (!isLoggedIn || !user) {
    return { user: null, isLoggedIn: false, loading: false };
  }
  
  return { user, isLoggedIn, loading: false };
}