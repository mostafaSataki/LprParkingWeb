"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Power,
  Wifi,
  WifiOff,
  DoorOpen,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  Activity,
  Filter,
  X
} from "lucide-react";
import { formatPersianDate, toPersianNumerals } from "@/lib/persian-date";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth-guard";

interface Gate {
  id: string;
  name: string;
  type: "ENTRY" | "EXIT" | "BOTH";
  isActive: boolean;
  description?: string;
  notes?: string;
  locations: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CreateGateDialogProps {
  onGateCreated: () => void;
  locations: Array<{ id: string; name: string }>;
}

interface EditGateDialogProps {
  gate: Gate;
  onGateUpdated: () => void;
  locations: Array<{ id: string; name: string }>;
}

function CreateGateDialog({ onGateCreated, locations }: CreateGateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    notes: "",
    locationIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData({ 
        name: "", 
        type: "", 
        description: "", 
        notes: "",
        locationIds: [] 
      });
      setIsOpen(false);
      onGateCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ایجاد درب");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        locationIds: [...prev.locationIds, locationId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locationIds: prev.locationIds.filter(id => id !== locationId)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          درب جدید
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ایجاد درب جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">نام درب</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: درب ورودی اصلی"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">نوع درب</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRY">ورودی</SelectItem>
                <SelectItem value="EXIT">خروجی</SelectItem>
                <SelectItem value="BOTH">دو طرفه</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">توضیحات (اختیاری)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات مربوط به درب"
            />
          </div>

          <div>
            <Label>پارکینگ‌ها</Label>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location.id}`}
                    checked={formData.locationIds.includes(location.id)}
                    onCheckedChange={(checked) => 
                      handleLocationToggle(location.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`location-${location.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {location.name}
                  </Label>
                </div>
              ))}
            </div>
            {formData.locationIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">حداقل یک پارکینگ باید انتخاب شود</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">یادداشت‌ها (اختیاری)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="یادداشت‌های داخلی"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || formData.locationIds.length === 0} 
              className="flex-1"
            >
              {loading ? "در حال ایجاد..." : "ایجاد درب"}
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

function EditGateDialog({ gate, onGateUpdated, locations }: EditGateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: gate.name,
    type: gate.type,
    description: gate.description || "",
    notes: gate.notes || "",
    locationIds: gate.locations.map(loc => loc.id)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsOpen(false);
      onGateUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ویرایش درب");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        locationIds: [...prev.locationIds, locationId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locationIds: prev.locationIds.filter(id => id !== locationId)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ویرایش درب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">نام درب</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: درب ورودی اصلی"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">نوع درب</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRY">ورودی</SelectItem>
                <SelectItem value="EXIT">خروجی</SelectItem>
                <SelectItem value="BOTH">دو طرفه</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">توضیحات (اختیاری)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات مربوط به درب"
            />
          </div>

          <div>
            <Label>پارکینگ‌ها</Label>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-location-${location.id}`}
                    checked={formData.locationIds.includes(location.id)}
                    onCheckedChange={(checked) => 
                      handleLocationToggle(location.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`edit-location-${location.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {location.name}
                  </Label>
                </div>
              ))}
            </div>
            {formData.locationIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">حداقل یک پارکینگ باید انتخاب شود</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">یادداشت‌ها (اختیاری)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="یادداشت‌های داخلی"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || formData.locationIds.length === 0} 
              className="flex-1"
            >
              {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
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

function getStatusBadgeVariant(isActive: boolean) {
  return isActive ? "default" : "secondary";
}

function getStatusLabel(isActive: boolean) {
  return isActive ? "فعال" : "غیرفعال";
}

export default function GatesManagementPage() {
  const { user } = useAuth();
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Mock locations
  const locations = [
    { id: "1", name: "پارکینگ مرکزی" },
    { id: "2", name: "پارکینگ غرب" },
    { id: "3", name: "پارکینگ شرق" },
    { id: "4", name: "پارکینگ شمال" },
    { id: "5", name: "پارکینگ جنوب" }
  ];

  // Generate mock gates
  const generateMockGates = (): Gate[] => [
    {
      id: "1",
      name: "درب ورودی اصلی",
      type: "ENTRY",
      isActive: true,
      description: "درب اصلی ورود به مجموعه",
      notes: "درب پرتردد",
      locations: [
        { id: "1", name: "پارکینگ مرکزی" },
        { id: "2", name: "پارکینگ غرب" }
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "درب خروجی اصلی",
      type: "EXIT",
      isActive: true,
      description: "درب اصلی خروج از مجموعه",
      notes: "",
      locations: [
        { id: "1", name: "پارکینگ مرکزی" }
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "درب ورودی غرب",
      type: "ENTRY",
      isActive: true,
      description: "درب ورودی بخش غرب",
      notes: "نیاز به تعمیر دارد",
      locations: [
        { id: "2", name: "پارکینگ غرب" }
      ],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "4",
      name: "درب خروجی شرق",
      type: "EXIT",
      isActive: false,
      description: "درب خروجی بخش شرق",
      notes: "موقتاً غیرفعال",
      locations: [
        { id: "3", name: "پارکینگ شرق" },
        { id: "4", name: "پارکینگ شمال" }
      ],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "5",
      name: "درب خدماتی",
      type: "BOTH",
      isActive: true,
      description: "درب مخصوص خدمات و اضطراری",
      notes: "دسترسی محدود",
      locations: [
        { id: "1", name: "پارکینگ مرکزی" },
        { id: "3", name: "پارکینگ شرق" },
        { id: "5", name: "پارکینگ جنوب" }
      ],
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setGates(generateMockGates());
      setLoading(false);
    }, 1000);
  }, []);

  const handleToggleGate = async (gateId: string, isActive: boolean) => {
    try {
      setGates(prev => prev.map(gate => 
        gate.id === gateId 
          ? { ...gate, isActive: !isActive }
          : gate
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت درب");
    }
  };

  const handleEditGate = (gate: Gate) => {
    // This will be handled by the EditGateDialog component
    console.log("Edit gate:", gate.name);
  };

  const handleGateUpdated = () => {
    // Refresh the gates list after edit
    console.log("Gate updated, refreshing list...");
    // In a real app, you would fetch the updated data from API
  };

  // Enhanced filtering and search
  const filteredGates = gates.filter(gate => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        gate.name.toLowerCase().includes(term) ||
        gate.description?.toLowerCase().includes(term) ||
        gate.locations.some(loc => loc.name.toLowerCase().includes(term));
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== "ALL" && gate.type !== filterType) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== "ALL") {
      const status = filterStatus === "ACTIVE";
      if (gate.isActive !== status) return false;
    }
    
    return true;
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
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">مدیریت درب‌ها</h1>
              <p className="text-gray-600 mt-1">
                {formatPersianDate(new Date(), "dddd، DD MMMM YYYY")}
              </p>
            </div>
            <CreateGateDialog onGateCreated={() => {}} locations={locations} />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">کل درب‌ها</p>
                    <p className="text-2xl font-bold">{toPersianNumerals(gates.length)}</p>
                  </div>
                  <DoorOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">فعال</p>
                    <p className="text-2xl font-bold text-green-600">
                      {toPersianNumerals(gates.filter(g => g.isActive).length)}
                    </p>
                  </div>
                  <Power className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">غیرفعال</p>
                    <p className="text-2xl font-bold text-red-600">
                      {toPersianNumerals(gates.filter(g => !g.isActive).length)}
                    </p>
                  </div>
                  <WifiOff className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">درب‌های ورودی</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {toPersianNumerals(gates.filter(g => g.type === "ENTRY").length)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                جستجو و فیلتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس نام، توضیحات یا پارکینگ"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع درب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه انواع</SelectItem>
                    <SelectItem value="ENTRY">ورودی</SelectItem>
                    <SelectItem value="EXIT">خروجی</SelectItem>
                    <SelectItem value="BOTH">دو طرفه</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="ACTIVE">فعال</SelectItem>
                    <SelectItem value="INACTIVE">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("ALL");
                    setFilterStatus("ALL");
                  }}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  بازنشانی
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gates Table */}
          <Card>
            <CardHeader>
              <CardTitle>لیست درب‌ها</CardTitle>
              <p className="text-sm text-gray-600">
                نمایش {toPersianNumerals(filteredGates.length)} درب از {toPersianNumerals(gates.length)} درب
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام درب</TableHead>
                      <TableHead className="text-right">پارکینگ‌ها</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGates.map((gate) => (
                      <TableRow key={gate.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DoorOpen className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{gate.name}</div>
                              {gate.description && (
                                <div className="text-xs text-gray-500">{gate.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {gate.locations.map((location) => (
                              <Badge 
                                key={location.id} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                <MapPin className="h-2 w-2 ml-1" />
                                {location.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(gate.isActive)}>
                            {getStatusLabel(gate.isActive)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleGate(gate.id, gate.isActive)}
                            >
                              {gate.isActive ? (
                                <Power className="h-3 w-3" />
                              ) : (
                                <WifiOff className="h-3 w-3" />
                              )}
                            </Button>
                            <EditGateDialog 
                              gate={gate} 
                              onGateUpdated={handleGateUpdated}
                              locations={locations}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {filteredGates.length === 0 && (
                <div className="text-center py-8">
                  <DoorOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">دربی با فیلترهای انتخاب شده یافت نشد</p>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}