'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
  ResponsiveForm,
  ResponsiveFormSection,
  ResponsiveFormGrid,
  ResponsiveFormField,
  ResponsiveFormActions,
  FormInput,
  FormSelect,
  FormTextarea
} from '@/components/ui/responsive-dialog'
import { CreditCard, Plus, Search, Edit, Trash2, Eye, Download, RefreshCw } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    credits: number
  }
}

interface CreditAccount {
  id: string
  userId: string
  balance: number
  monthlyLimit: number
  creditLimit: number
  warningThreshold: number
  isActive: boolean
  autoCharge: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface Vehicle {
  id: string
  plateNumber: string
  vehicleType: string
  ownerName: string
  ownerPhone: string
  isAllowed: boolean
  isBlacklisted: boolean
  createdAt: string
}

interface CreditTransaction {
  id: string
  accountId: string
  amount: number
  type: string
  description: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

export default function CreditAccountsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null)
  const [chargeAmount, setChargeAmount] = useState('')
  const [chargeDescription, setChargeDescription] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    initialBalance: '0',
    monthlyLimit: '0',
    creditLimit: '0',
    warningThreshold: '10000',
    autoCharge: true,
    monthlyChargeAmount: '100000',
    chargeDayOfMonth: '1',
    plateNumbers: [''],
    vehicleTypes: ['CAR'],
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    enableInAppNotifications: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [customersRes, accountsRes, vehiclesRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/credit-accounts'),
        fetch('/api/vehicles')
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.customers || [])
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        setCreditAccounts(accountsData.accounts || [])
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        setVehicles(vehiclesData.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/credit-accounts/create-with-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          initialBalance: parseFloat(formData.initialBalance),
          monthlyLimit: parseFloat(formData.monthlyLimit),
          creditLimit: parseFloat(formData.creditLimit),
          warningThreshold: parseFloat(formData.warningThreshold),
          monthlyChargeAmount: parseFloat(formData.monthlyChargeAmount),
          chargeDayOfMonth: parseInt(formData.chargeDayOfMonth),
          plateNumbers: formData.plateNumbers.filter(p => p.trim() !== ''),
          vehicleTypes: formData.vehicleTypes
        }),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setFormData({
          name: '',
          email: '',
          phone: '',
          nationalId: '',
          address: '',
          initialBalance: '0',
          monthlyLimit: '0',
          creditLimit: '0',
          warningThreshold: '10000',
          autoCharge: true,
          monthlyChargeAmount: '100000',
          chargeDayOfMonth: '1',
          plateNumbers: [''],
          vehicleTypes: ['CAR'],
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          enableInAppNotifications: true
        })
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'خطا در ایجاد حساب')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      alert('خطا در ایجاد حساب')
    }
  }

  const handleChargeAccount = async () => {
    if (!selectedAccount || !chargeAmount) return

    try {
      const response = await fetch('/api/credit-accounts/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          amount: parseFloat(chargeAmount),
          description: chargeDescription || 'شارژ دستی'
        }),
      })

      if (response.ok) {
        setIsChargeDialogOpen(false)
        setChargeAmount('')
        setChargeDescription('')
        setSelectedAccount(null)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'خطا در شارژ حساب')
      }
    } catch (error) {
      console.error('Error charging account:', error)
      alert('خطا در شارژ حساب')
    }
  }

  const addPlateNumber = () => {
    setFormData(prev => ({
      ...prev,
      plateNumbers: [...prev.plateNumbers, ''],
      vehicleTypes: [...prev.vehicleTypes, 'CAR']
    }))
  }

  const removePlateNumber = (index: number) => {
    if (formData.plateNumbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        plateNumbers: prev.plateNumbers.filter((_, i) => i !== index),
        vehicleTypes: prev.vehicleTypes.filter((_, i) => i !== index)
      }))
    }
  }

  const updatePlateNumber = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      plateNumbers: prev.plateNumbers.map((plate, i) => i === index ? value : plate)
    }))
  }

  const updateVehicleType = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.map((type, i) => i === index ? value : type)
    }))
  }

  const filteredAccounts = creditAccounts.filter(account =>
    account.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getAccountStatus = (account: CreditAccount) => {
    if (!account.isActive) return { variant: 'destructive' as const, text: 'غیرفعال' }
    if (account.balance <= account.warningThreshold) return { variant: 'secondary' as const, text: 'هشدار' }
    return { variant: 'default' as const, text: 'فعال' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">مدیریت حساب‌های اعتباری</h1>
          <div className="flex gap-2">
            <ResponsiveDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <ResponsiveDialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  ایجاد حساب جدید
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>ایجاد حساب اعتباری جدید</ResponsiveDialogTitle>
                </ResponsiveDialogHeader>
                <ResponsiveForm onSubmit={handleCreateAccount}>
                  <ResponsiveFormGrid>
                    {/* Left Column - Customer Info */}
                    <ResponsiveFormSection title="اطلاعات مشتری" className="col-span-1">
                      <FormInput
                        label="نام کامل"
                        value={formData.name}
                        onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                        required
                      />
                      <FormInput
                        label="ایمیل"
                        type="email"
                        value={formData.email}
                        onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                        required
                      />
                      <FormInput
                        label="شماره تلفن"
                        value={formData.phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                        required
                      />
                      <FormInput
                        label="کد ملی"
                        value={formData.nationalId}
                        onChange={(value) => setFormData(prev => ({ ...prev, nationalId: value }))}
                      />
                      <FormTextarea
                        label="آدرس"
                        value={formData.address}
                        onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                        rows={3}
                        fullWidth
                      />
                    </ResponsiveFormSection>

                    {/* Right Column - Account Info */}
                    <ResponsiveFormSection title="اطلاعات حساب اعتباری" className="col-span-1">
                      <FormInput
                        label="موجودی اولیه"
                        type="number"
                        value={formData.initialBalance}
                        onChange={(value) => setFormData(prev => ({ ...prev, initialBalance: value }))}
                      />
                      <FormInput
                        label="محدودیت ماهانه"
                        type="number"
                        value={formData.monthlyLimit}
                        onChange={(value) => setFormData(prev => ({ ...prev, monthlyLimit: value }))}
                      />
                      <FormInput
                        label="سقف اعتبار"
                        type="number"
                        value={formData.creditLimit}
                        onChange={(value) => setFormData(prev => ({ ...prev, creditLimit: value }))}
                      />
                      <FormInput
                        label="آستانه هشدار"
                        type="number"
                        value={formData.warningThreshold}
                        onChange={(value) => setFormData(prev => ({ ...prev, warningThreshold: value }))}
                      />
                    </ResponsiveFormSection>
                  </ResponsiveFormGrid>

                  {/* Vehicles Section - Full Width */}
                  <ResponsiveFormSection title="خودروها">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.plateNumbers.map((plate, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <Input
                                placeholder="پلاک خودرو"
                                value={plate}
                                onChange={(e) => updatePlateNumber(index, e.target.value)}
                                required
                              />
                            </div>
                            <Select value={formData.vehicleTypes[index]} onValueChange={(value) => updateVehicleType(index, value)}>
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CAR">خودرو</SelectItem>
                                <SelectItem value="MOTORCYCLE">موتور</SelectItem>
                                <SelectItem value="TRUCK">کامیون</SelectItem>
                                <SelectItem value="BUS">اتوبوس</SelectItem>
                                <SelectItem value="VAN">وانت</SelectItem>
                              </SelectContent>
                            </Select>
                            {formData.plateNumbers.length > 1 && (
                              <Button type="button" variant="outline" size="sm" onClick={() => removePlateNumber(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" onClick={addPlateNumber}>
                        <Plus className="ml-2 h-4 w-4" />
                        افزودن خودرو
                      </Button>
                    </div>
                  </ResponsiveFormSection>

                  <ResponsiveFormActions align="between">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      انصراف
                    </Button>
                    <Button type="submit" className="px-8">
                      ایجاد حساب
                    </Button>
                  </ResponsiveFormActions>
                </ResponsiveForm>
              </ResponsiveDialogContent>
            </ResponsiveDialog>

            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="ml-2 h-4 w-4" />
              به‌روزرسانی
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="جستجو بر اساس نام یا ایمیل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => {
            const status = getAccountStatus(account)
            return (
              <Card key={account.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="ml-2 h-5 w-5" />
                      {account.user.name}
                    </div>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{account.user.email}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">موجودی:</span>
                      <span className="font-semibold">{formatCurrency(account.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">محدودیت ماهانه:</span>
                      <span className="font-semibold">{formatCurrency(account.monthlyLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">سقف اعتبار:</span>
                      <span className="font-semibold">{formatCurrency(account.creditLimit)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAccount(account)
                        setIsChargeDialogOpen(true)
                      }}
                    >
                      شارژ
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ حساب اعتباری یافت نشد</h3>
            <p className="text-gray-500 mb-4">برای شروع، یک حساب اعتباری جدید ایجاد کنید</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  ایجاد حساب جدید
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>

      {/* Charge Dialog */}
      <ResponsiveDialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>شارژ حساب اعتباری</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {selectedAccount && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">اطلاعات حساب</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">نام مشتری:</span>
                      <span className="font-medium">{selectedAccount.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ایمیل:</span>
                      <span className="font-medium">{selectedAccount.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">موجودی فعلی:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(selectedAccount.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">محدودیت ماهانه:</span>
                      <span className="font-medium">{formatCurrency(selectedAccount.monthlyLimit)}</span>
                    </div>
                  </div>
                </div>

                {/* Charge Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">اطلاعات شارژ</h3>
                  <FormInput
                    label="مبلغ شارژ"
                    type="number"
                    value={chargeAmount}
                    onChange={(value) => setChargeAmount(value)}
                    placeholder="مبلغ را وارد کنید"
                    required
                    className="text-lg"
                  />
                  <FormTextarea
                    label="توضیحات"
                    value={chargeDescription}
                    onChange={(value) => setChargeDescription(value)}
                    placeholder="توضیحات شارژ (اختیاری)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  پس از شارژ، موجودی جدید: {formatCurrency(selectedAccount.balance + (parseFloat(chargeAmount) || 0))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsChargeDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button onClick={handleChargeAccount} disabled={!chargeAmount} className="px-8">
                    شارژ حساب
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}