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
  User, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Shield,
  Car,
  Building,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus as AddIcon,
  Database
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";

interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  vehicleName?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nationalCode?: string;
  mobile?: string;
  email?: string;
  organization?: string;
  department?: string;
  position?: string;
  accessLevel: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicles: Vehicle[];
  sessions: Array<{
    id: string;
    entryTime: string;
    exitTime?: string;
    status: string;
  }>;
}

interface CreatePersonDialogProps {
  onPersonCreated: () => void;
}

function CreatePersonDialog({ onPersonCreated }: CreatePersonDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalCode: "",
    mobile: "",
    email: "",
    organization: "",
    department: "",
    position: "",
    accessLevel: "STANDARD",
    notes: ""
  });
  const [vehicles, setVehicles] = useState<Array<{
    plateNumber: string;
    vehicleType: string;
    vehicleName: string;
    isPrimary: boolean;
    notes: string;
  }>>([{ plateNumber: "", vehicleType: "CAR", vehicleName: "", isPrimary: true, notes: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addVehicle = () => {
    setVehicles([...vehicles, { plateNumber: "", vehicleType: "CAR", vehicleName: "", isPrimary: false, notes: "" }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      const newVehicles = vehicles.filter((_, i) => i !== index);
      // If we're removing the primary vehicle, make the first one primary
      if (vehicles[index].isPrimary && newVehicles.length > 0) {
        newVehicles[0].isPrimary = true;
      }
      setVehicles(newVehicles);
    }
  };

  const updateVehicle = (index: number, field: string, value: any) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    
    // If setting isPrimary to true, set others to false
    if (field === 'isPrimary' && value === true) {
      newVehicles.forEach((v, i) => {
        if (i !== index) v.isPrimary = false;
      });
    }
    
    setVehicles(newVehicles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate at least one vehicle
      const validVehicles = vehicles.filter(v => v.plateNumber.trim() !== "");
      if (validVehicles.length === 0) {
        setError("حداقل یک پلاک خودرو باید ثبت شود");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          vehicles: validVehicles
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "خطا در ایجاد شخص");
      }

      setFormData({
        firstName: "",
        lastName: "",
        nationalCode: "",
        mobile: "",
        email: "",
        organization: "",
        department: "",
        position: "",
        accessLevel: "STANDARD",
        notes: ""
      });
      setVehicles([{ plateNumber: "", vehicleType: "CAR", vehicleName: "", isPrimary: true, notes: "" }]);
      setIsOpen(false);
      onPersonCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد شخص");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          شخص جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ایجاد شخص جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">اطلاعات شخصی</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">نام</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="نام"
                  required
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">نام خانوادگی</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="نام خانوادگی"
                  required
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">کد ملی</label>
                <Input
                  value={formData.nationalCode}
                  onChange={(e) => setFormData({ ...formData, nationalCode: e.target.value })}
                  placeholder="کد ملی (اختیاری)"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">موبایل</label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="شماره موبایل"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">ایمیل</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ایمیل"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">سازمان</label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="نام سازمان/شرکت"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">دپارتمان</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="دپارتمان/بخش"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">سمت</label>
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="سمت شغلی"
                  className="text-right"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-right">سطح دسترسی</label>
                <Select
                  value={formData.accessLevel}
                  onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">استاندارد</SelectItem>
                    <SelectItem value="VIP">ویژه</SelectItem>
                    <SelectItem value="STAFF">کارمندی</SelectItem>
                    <SelectItem value="SECURITY">امنیتی</SelectItem>
                    <SelectItem value="MANAGEMENT">مدیریتی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-right">توضیحات</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md text-right"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="توضیحات اضافه..."
              />
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">خودروها</h3>
              <Button type="button" variant="outline" size="sm" onClick={addVehicle}>
                <AddIcon className="h-4 w-4 ml-2" />
                افزودن خودرو
              </Button>
            </div>
            
            {vehicles.map((vehicle, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">پلاک خودرو</label>
                    <Input
                      value={vehicle.plateNumber}
                      onChange={(e) => updateVehicle(index, 'plateNumber', e.target.value)}
                      placeholder="پلاک خودرو"
                      className="text-right"
                      required={index === 0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">نوع خودرو</label>
                    <Select
                      value={vehicle.vehicleType}
                      onValueChange={(value) => updateVehicle(index, 'vehicleType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAR">سواری</SelectItem>
                        <SelectItem value="MOTORCYCLE">موتورسیکلت</SelectItem>
                        <SelectItem value="TRUCK">کامیون</SelectItem>
                        <SelectItem value="BUS">اتوبوس</SelectItem>
                        <SelectItem value="VAN">وانت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-right">نام خودرو</label>
                    <Input
                      value={vehicle.vehicleName}
                      onChange={(e) => updateVehicle(index, 'vehicleName', e.target.value)}
                      placeholder="نام خودرو (اختیاری)"
                      className="text-right"
                    />
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id={`primary-${index}`}
                        checked={vehicle.isPrimary}
                        onChange={(e) => updateVehicle(index, 'isPrimary', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor={`primary-${index}`} className="text-sm">اصلی</label>
                    </div>
                    
                    {vehicles.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1 text-right">توضیحات خودرو</label>
                  <Input
                    value={vehicle.notes}
                    onChange={(e) => updateVehicle(index, 'notes', e.target.value)}
                    placeholder="توضیحات خودرو (اختیاری)"
                    className="text-right"
                  />
                </div>
              </Card>
            ))}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? "در حال ایجاد..." : "ایجاد شخص"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getAccessLevelLabel(level: string) {
  const levels = {
    STANDARD: "استاندارد",
    VIP: "ویژه",
    STAFF: "کارمندی",
    SECURITY: "امنیتی",
    MANAGEMENT: "مدیریتی"
  };
  return levels[level as keyof typeof levels] || level;
}

function getAccessLevelBadgeVariant(level: string) {
  switch (level) {
    case "VIP": return "default";
    case "MANAGEMENT": return "destructive";
    case "SECURITY": return "secondary";
    case "STAFF": return "outline";
    default: return "outline";
  }
}

function getVehicleTypeLabel(type: string) {
  const types = {
    CAR: "سواری",
    MOTORCYCLE: "موتورسیکلت",
    TRUCK: "کامیون",
    BUS: "اتوبوس",
    VAN: "وانت"
  };
  return types[type as keyof typeof types] || type;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

function PaginationControls({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange 
}: PaginationControlsProps) {
  // Generate page numbers directly
  const pageNumbers = React.useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50 rounded-b-lg">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">نمایش</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
        >
          <SelectTrigger className="w-16 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600">مورد در هر صفحه</span>
      </div>

      {/* Items info */}
      <div className="text-sm text-gray-600">
        نمایش {toPersianNumerals(startItem)} تا {toPersianNumerals(endItem)} از {toPersianNumerals(totalItems)} مورد
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => (
          <div key={index}>
            {page === '...' ? (
              <span className="h-8 px-2 flex items-center text-sm text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {toPersianNumerals(page as number)}
              </Button>
            )}
          </div>
        ))}

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPersons = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (accessLevelFilter !== "all") {
        params.append("accessLevel", accessLevelFilter);
      }

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (organizationFilter) {
        params.append("organization", organizationFilter);
      }

      const response = await fetch(`/api/persons?${params}`);
      if (!response.ok) throw new Error("خطا در دریافت اطلاعات اشخاص");

      const data = await response.json();
      setPersons(data.persons);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [currentPage, accessLevelFilter, statusFilter, searchTerm, organizationFilter, itemsPerPage]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTogglePersonStatus = async (personId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/persons/${personId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) throw new Error("خطا در تغییر وضعیت شخص");

      fetchPersons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت شخص");
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!confirm("آیا از حذف این شخص اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/persons/${personId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("خطا در حذف شخص");

      fetchPersons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف شخص");
    }
  };

  const handleSeedSampleData = async () => {
    if (!confirm("آیا از ایجاد داده‌های نمونه اطمینان دارید؟ این عمل داده‌های موجود را حذف می‌کند.")) return;

    try {
      const response = await fetch('/api/persons/seed', {
        method: 'POST'
      });

      if (!response.ok) throw new Error("خطا در ایجاد داده‌های نمونه");

      const data = await response.json();
      alert(`✅ ${data.message}`);
      fetchPersons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد داده‌های نمونه");
    }
  };

  const filteredPersons = persons.filter(person => {
    const matchesSearch = person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (person.nationalCode && person.nationalCode.includes(searchTerm)) ||
                         (person.mobile && person.mobile.includes(searchTerm)) ||
                         (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         person.vehicles.some(v => v.plateNumber.includes(searchTerm));
    const matchesAccessLevel = accessLevelFilter === "all" || person.accessLevel === accessLevelFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && person.isActive) ||
                         (statusFilter === "inactive" && !person.isActive);
    const matchesOrganization = !organizationFilter || 
                               (person.organization && person.organization.toLowerCase().includes(organizationFilter.toLowerCase()));
    
    return matchesSearch && matchesAccessLevel && matchesStatus && matchesOrganization;
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
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">مدیریت اشخاص</h1>
            <p className="text-gray-600 mt-1">
              {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreatePersonDialog onPersonCreated={fetchPersons} />
            <Button
              variant="outline"
              onClick={handleSeedSampleData}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              ایجاد داده نمونه
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل اشخاص</p>
                  <p className="text-2xl font-bold">{toPersianNumerals(persons.length)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">اشخاص فعال</p>
                  <p className="text-2xl font-bold text-green-600">
                    {toPersianNumerals(persons.filter(p => p.isActive).length)}
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
                  <p className="text-sm text-gray-600">سازمان‌ها</p>
                  <p className="text-2xl font-bold">
                    {toPersianNumerals(new Set(persons.filter(p => p.organization).map(p => p.organization)).size)}
                  </p>
                </div>
                <Building className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">خودروهای ثبت شده</p>
                  <p className="text-2xl font-bold">
                    {toPersianNumerals(persons.reduce((sum, p) => sum + p.vehicles.length, 0))}
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
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="جستجوی نام، کد ملی، موبایل یا پلاک..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-right"
                  />
                </div>
              </div>
              <Input
                placeholder="فیلتر سازمان..."
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="w-40 text-right"
              />
              <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سطوح</SelectItem>
                  <SelectItem value="STANDARD">استاندارد</SelectItem>
                  <SelectItem value="VIP">ویژه</SelectItem>
                  <SelectItem value="STAFF">کارمندی</SelectItem>
                  <SelectItem value="SECURITY">امنیتی</SelectItem>
                  <SelectItem value="MANAGEMENT">مدیریتی</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Persons Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>لیست اشخاص</CardTitle>
              {totalPages > 0 && (
                <div className="text-sm text-gray-600">
                  صفحه {toPersianNumerals(currentPage)} از {toPersianNumerals(totalPages)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-96">
              <Table dir="rtl">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام کامل</TableHead>
                    <TableHead className="text-right">کد ملی</TableHead>
                    <TableHead className="text-right">موبایل</TableHead>
                    <TableHead className="text-right">سازمان</TableHead>
                    <TableHead className="text-right">خودروها</TableHead>
                    <TableHead className="text-right">سطح دسترسی</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">ترددها</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersons.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div>{person.firstName} {person.lastName}</div>
                            {person.position && (
                              <div className="text-xs text-gray-500">{person.position}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">{person.nationalCode || "-"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {person.mobile || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <div>{person.organization || "-"}</div>
                            {person.department && (
                              <div className="text-xs text-gray-500">{person.department}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          {person.vehicles.slice(0, 2).map((vehicle, index) => (
                            <div key={vehicle.id} className="flex items-center gap-1 flex-row-reverse text-sm">
                              <Car className="h-3 w-3 text-gray-400" />
                              <span>{vehicle.plateNumber}</span>
                              {vehicle.isPrimary && (
                                <Badge variant="secondary" className="text-xs">اصلی</Badge>
                              )}
                            </div>
                          ))}
                          {person.vehicles.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{toPersianNumerals(person.vehicles.length - 2)} خودرو دیگر
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getAccessLevelBadgeVariant(person.accessLevel)}>
                          {getAccessLevelLabel(person.accessLevel)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={person.isActive ? "default" : "secondary"}>
                          {person.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          {toPersianNumerals(person.sessions.length)}
                          <div className="text-xs text-gray-500">
                            {person.sessions.filter(s => s.status === 'ACTIVE').length} فعال
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePersonStatus(person.id, person.isActive)}
                          >
                            {person.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePerson(person.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Enhanced Pagination */}
            {totalPages > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}