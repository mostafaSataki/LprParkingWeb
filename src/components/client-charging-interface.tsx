"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, PlusCircle, Search, Receipt } from "lucide-react";

interface ChargingTransaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'CHARGE' | 'DEDUCTION' | 'REFUND' | 'ADJUSTMENT';
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  operatorName: string;
}

interface CreditAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  monthlyLimit: number;
  creditLimit: number;
  warningThreshold: number;
  isActive: boolean;
  lastChargedAt: string | null;
  nextChargeDate: string | null;
  autoCharge: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientChargingInterfaceProps {
  accounts: CreditAccount[];
  onChargeAccount: (accountId: string, amount: number, description: string) => Promise<void>;
  onBulkCharge: (accountIds: string[], amount: number, description: string) => Promise<void>;
  isLoading?: boolean;
}

export function ClientChargingInterface({ 
  accounts, 
  onChargeAccount, 
  onBulkCharge, 
  isLoading = false 
}: ClientChargingInterfaceProps) {
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null);
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDescription, setChargeDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkDescription, setBulkDescription] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");

  const filteredAccounts = accounts.filter(account =>
    account.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR", {
      style: "currency",
      currency: "IRR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const getBalanceStatus = (balance: number, threshold: number) => {
    if (balance <= 0) return { color: "destructive", text: "موجودی صفر" };
    if (balance <= threshold * 0.5) return { color: "destructive", text: "موجودی بحرانی" };
    if (balance <= threshold) return { color: "warning", text: "موجودی کم" };
    return { color: "success", text: "موجودی کافی" };
  };

  const handleIndividualCharge = async () => {
    if (!selectedAccount || !chargeAmount) return;

    try {
      await onChargeAccount(
        selectedAccount.id,
        Number(chargeAmount),
        chargeDescription || "شارژ دستی حساب"
      );
      setChargeAmount("");
      setChargeDescription("");
      setShowChargeDialog(false);
    } catch (error) {
      console.error("Error charging account:", error);
    }
  };

  const handleBulkCharge = async () => {
    if (selectedAccounts.length === 0 || !bulkAmount) return;

    try {
      await onBulkCharge(
        selectedAccounts,
        Number(bulkAmount),
        bulkDescription || "شارژ گروهی حساب‌ها"
      );
      setBulkAmount("");
      setBulkDescription("");
      setSelectedAccounts([]);
      setShowBulkDialog(false);
    } catch (error) {
      console.error("Error bulk charging accounts:", error);
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const selectAllAccounts = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(account => account.id));
    }
  };

  const getQuickChargeAmounts = () => {
    return [50000, 100000, 200000, 500000, 1000000];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">شارژ حساب‌های اعتباری</h1>
          <p className="text-muted-foreground">مدیریت شارژ حساب‌های اعتباری مشتریان</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="ml-2 h-4 w-4" />
                شارژ گروهی
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>شارژ گروهی حساب‌ها</DialogTitle>
                <DialogDescription>
                  انتخاب چندین حساب برای شارژ همزمان
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2">
                  <div className="flex items-center space-x-2 p-2 border-b">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectedAccounts.length === filteredAccounts.length}
                      onChange={selectAllAccounts}
                    />
                    <Label htmlFor="selectAll" className="font-medium">
                      انتخاب همه ({filteredAccounts.length} حساب)
                    </Label>
                  </div>
                  {filteredAccounts.map((account) => (
                    <div key={account.id} className="flex items-center space-x-2 p-2">
                      <input
                        type="checkbox"
                        id={`account-${account.id}`}
                        checked={selectedAccounts.includes(account.id)}
                        onChange={() => toggleAccountSelection(account.id)}
                      />
                      <Label htmlFor={`account-${account.id}`} className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{account.userName}</span>
                          <Badge variant="outline">
                            {formatCurrency(account.balance)}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulkAmount">مبلغ شارژ (تومان)</Label>
                    <Input
                      id="bulkAmount"
                      type="number"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      placeholder="مبلغ را وارد کنید"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulkDescription">توضیحات</Label>
                    <Input
                      id="bulkDescription"
                      value={bulkDescription}
                      onChange={(e) => setBulkDescription(e.target.value)}
                      placeholder="توضیحات شارژ"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                    انصراف
                  </Button>
                  <Button 
                    onClick={handleBulkCharge}
                    disabled={selectedAccounts.length === 0 || !bulkAmount || isLoading}
                  >
                    شارژ {selectedAccounts.length} حساب
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تعداد کل حساب‌ها</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مجموع موجودی</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(accounts.reduce((sum, account) => sum + account.balance, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">حساب‌های فعال</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(account => account.isActive).length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">شارژ خودکار</p>
                <p className="text-2xl font-bold">
                  {accounts.filter(account => account.autoCharge).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">شارژ فردی</TabsTrigger>
          <TabsTrigger value="bulk">شارژ گروهی</TabsTrigger>
          <TabsTrigger value="suggestions">پیشنهادات شارژ</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accounts List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="ml-2 h-5 w-5" />
                  حساب‌های اعتباری
                </CardTitle>
                <CardDescription>
                  انتخاب حساب برای شارژ
                </CardDescription>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی مشتری..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAccounts.map((account) => {
                    const status = getBalanceStatus(account.balance, account.warningThreshold);
                    return (
                      <Card
                        key={account.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAccount?.id === account.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedAccount(account)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{account.userName}</div>
                            <Badge variant={status.color as any}>{status.text}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {account.userEmail}
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>موجودی:</span>
                            <span className="font-medium">{formatCurrency(account.balance)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>شارژ بعدی:</span>
                            <span>{formatDate(account.nextChargeDate)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Charge Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>شارژ حساب</CardTitle>
                <CardDescription>
                  {selectedAccount 
                    ? `شارژ حساب ${selectedAccount.userName}`
                    : 'یک حساب را برای شارژ انتخاب کنید'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAccount ? (
                  <div className="space-y-6">
                    {/* Account Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{formatCurrency(selectedAccount.balance)}</div>
                          <div className="text-xs text-muted-foreground">موجودی فعلی</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{formatCurrency(selectedAccount.monthlyLimit)}</div>
                          <div className="text-xs text-muted-foreground">محدودیت ماهانه</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{formatCurrency(selectedAccount.creditLimit)}</div>
                          <div className="text-xs text-muted-foreground">سقف اعتبار</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{formatCurrency(selectedAccount.warningThreshold)}</div>
                          <div className="text-xs text-muted-foreground">آستانه هشدار</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Charge */}
                    <div>
                      <Label className="text-sm font-medium">شارژ سریع</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getQuickChargeAmounts().map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setChargeAmount(amount.toString())}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Charge Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="chargeAmount">مبلغ شارژ (تومان) *</Label>
                        <Input
                          id="chargeAmount"
                          type="number"
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(e.target.value)}
                          placeholder="مبلغ را وارد کنید"
                        />
                      </div>
                      <div>
                        <Label htmlFor="chargeDescription">توضیحات</Label>
                        <Input
                          id="chargeDescription"
                          value={chargeDescription}
                          onChange={(e) => setChargeDescription(e.target.value)}
                          placeholder="توضیحات شارژ"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setSelectedAccount(null)}>
                        انصراف
                      </Button>
                      <Button 
                        onClick={handleIndividualCharge}
                        disabled={!chargeAmount || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                            در حال شارژ...
                          </>
                        ) : (
                          <>
                            <DollarSign className="ml-2 h-4 w-4" />
                            شارژ حساب
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Warning */}
                    {selectedAccount.balance <= selectedAccount.warningThreshold && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          موجودی این حساب کم است ({formatCurrency(selectedAccount.balance)}). 
                          پیشنهاد می‌شود حداقل {formatCurrency(selectedAccount.warningThreshold * 2)} تومان شارژ شود.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">لطفاً یک حساب را از لیست سمت راست انتخاب کنید</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>شارژ گروهی حساب‌ها</CardTitle>
              <CardDescription>
                شارز همزمان چندین حساب اعتباری
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">برای شارژ گروهی روی دکمه بالا کلیک کنید</p>
                <Button onClick={() => setShowBulkDialog(true)}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  شروع شارژ گروهی
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>پیشنهادات شارژ</CardTitle>
              <CardDescription>
                پیشنهادات هوشمند برای شارژ حساب‌ها بر اساس الگوی استفاده
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts
                  .filter(account => account.balance <= account.warningThreshold)
                  .slice(0, 6)
                  .map((account) => {
                    const suggestedAmount = Math.max(
                      account.warningThreshold * 2,
                      account.monthlyLimit - account.balance
                    );
                    
                    return (
                      <Card key={account.id} className="border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{account.userName}</div>
                            <Badge variant="warning">نیاز به شارژ</Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            موجودی فعلی: {formatCurrency(account.balance)}
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">پیشنهاد شارژ:</span>
                              <span className="text-green-600 font-bold">
                                {" "}{formatCurrency(suggestedAmount)}
                              </span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setSelectedAccount(account);
                                setChargeAmount(suggestedAmount.toString());
                                setActiveTab("individual");
                              }}
                            >
                              شارژ حساب
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}