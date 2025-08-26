"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Search, 
  Clock, 
  User, 
  DollarSign, 
  Car,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Calendar,
  Users
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  operator: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  _count: {
    sessions: number;
    payments: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface CreateShiftDialogProps {
  users: User[];
  onShiftCreated: () => void;
}

function CreateShiftDialog({ users, onShiftCreated }: CreateShiftDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    operatorId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "خطا در ایجاد شیفت");
      }

      setFormData({ name: "", startTime: "", operatorId: "" });
      setIsOpen(false);
      onShiftCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد شیفت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          شیفت جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ایجاد شیفت جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">نام شیفت</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: شیفت صبح"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">زمان شروع</label>
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">اپراتور</label>
            <Select
              value={formData.operatorId}
              onValueChange={(value) => setFormData({ ...formData, operatorId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب اپراتور" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "در حال ایجاد..." : "ایجاد شیفت"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              انصراف
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getRoleLabel(role: string) {
  const roles = {
    OPERATOR: "اپراتور",
    SUPERVISOR: "سرپرست",
    ADMIN: "مدیر",
    AUDITOR: "بازرس"
  };
  return roles[role as keyof typeof roles] || role;
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "ADMIN": return "destructive";
    case "SUPERVISOR": return "default";
    case "AUDITOR": return "secondary";
    default: return "outline";
  }
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchShifts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/shifts?${params}`);
      if (!response.ok) throw new Error("خطا در دریافت اطلاعات شیفت‌ها");

      const data = await response.json();
      setShifts(data.shifts);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users?isActive=true");
      if (!response.ok) throw new Error("خطا در دریافت اطلاعات کاربران");

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchUsers();
  }, [currentPage, statusFilter, searchTerm]);

  const handleEndShift = async (shiftId: string) => {
    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          endTime: new Date().toISOString(),
          isActive: false 
        })
      });

      if (!response.ok) throw new Error("خطا در پایان شیفت");

      fetchShifts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در پایان شیفت");
    }
  };

  const filteredShifts = shifts.filter(shift => {
    const matchesSearch = shift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shift.operator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && shift.isActive) ||
                         (statusFilter === "inactive" && !shift.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت شیفت‌ها</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <CreateShiftDialog users={users} onShiftCreated={fetchShifts} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل شیفت‌ها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(shifts.length)}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">شیفت‌های فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(shifts.filter(s => s.isActive).length)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اپراتورها</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(users.length)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">جلسات امروز</p>
                  <p className="text-2xl font-bold">
                    {toPersianNumerals(shifts.reduce((sum, shift) => sum + shift._count.sessions, 0))}
                  </p>
                </div>
                <Car className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="جستجوی شیفت یا اپراتور..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>لیست شیفت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام شیفت</TableHead>
                    <TableHead>اپراتور</TableHead>
                    <TableHead>زمان شروع</TableHead>
                    <TableHead>زمان پایان</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>جلسات</TableHead>
                    <TableHead>پرداخت‌ها</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{shift.operator.name}</div>
                          <Badge variant={getRoleBadgeVariant(shift.operator.role)} className="mt-1">
                            {getRoleLabel(shift.operator.role)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPersianDate(shift.startTime, "HH:mm - YYYY/MM/DD")}
                      </TableCell>
                      <TableCell>
                        {shift.endTime 
                          ? formatPersianDate(shift.endTime, "HH:mm - YYYY/MM/DD")
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.isActive ? "default" : "secondary"}>
                          {shift.isActive ? "فعال" : "پایان یافته"}
                        </Badge>
                      </TableCell>
                      <TableCell>{toPersianNumerals(shift._count.sessions)}</TableCell>
                      <TableCell>{toPersianNumerals(shift._count.payments)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {shift.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEndShift(shift.id)}
                            >
                              پایان شیفت
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {filteredShifts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                هیچ شیفتی یافت نشد
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  قبلی
                </Button>
                <span className="py-2 px-4">
                  صفحه {currentPage} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  بعدی
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}