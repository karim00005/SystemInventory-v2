import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Icons
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  Pencil,
  Trash,
  RefreshCw,
  DollarSign,
} from "lucide-react";

// Form handling
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Transaction type schema for form validation
const transactionFormSchema = z.object({
  type: z.string().min(1, { message: "نوع المعاملة مطلوب" }),
  accountId: z.number({ required_error: "الحساب مطلوب" }),
  amount: z.number().min(0.01, { message: "المبلغ يجب أن يكون أكبر من 0" }),
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
  paymentMethod: z.string().min(1, { message: "طريقة الدفع مطلوبة" }),
  notes: z.string().optional(),
  reference: z.string().optional(),
  isDebit: z.boolean().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface Transaction {
  id: number;
  type: string;
  accountId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  notes?: string;
  reference?: string;
  createdAt: string;
  isDebit?: boolean;
  account?: {
    name: string;
  };
}

export default function FinanceView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState("all");
  const [accountFilter, setAccountFilter] = useState<number | null>(null);
  
  // Financial report states
  const [reportType, setReportType] = useState("income");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));

  // Fetch transactions
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      return apiRequest('/api/transactions', 'GET');
    }
  });

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      return apiRequest('/api/accounts', 'GET');
    }
  });
  
  // Fetch financial report data
  const { 
    data: reportData = {}, 
    isLoading: isReportLoading,
    isError: isReportError,
    refetch: refetchReport 
  } = useQuery({
    queryKey: ['/api/finance/reports', reportType, startDate, endDate],
    queryFn: async () => {
      return apiRequest(`/api/finance/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`, 'GET');
    }
  });

  // Filter transactions based on search term, type, and account
  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = 
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm);
    
    let matchesType = false;
    if (transactionType === 'all') {
      matchesType = true;
    } else if (transactionType === 'credit' && transaction.type === 'credit') {
      matchesType = true;
    } else if (transactionType === 'debit' && transaction.type === 'debit') {
      matchesType = true;
    } else if (transactionType === 'journal' && transaction.type === 'journal') {
      matchesType = true;
    } else if (transactionType === 'journal_debit' && transaction.type === 'journal' && transaction.isDebit) {
      matchesType = true;
    } else if (transactionType === 'journal_credit' && transaction.type === 'journal' && !transaction.isDebit) {
      matchesType = true;
    }
    
    const matchesAccount = !accountFilter || transaction.accountId === accountFilter;
    
    return matchesSearch && matchesType && matchesAccount;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "yyyy-MM-dd", { locale: ar });
    } catch (e) {
      return dateString;
    }
  };

  // Get transaction type badge
  const getTransactionTypeBadge = (type: string, isDebit?: boolean) => {
    if (type === "credit") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">قبض</Badge>;
    } else if (type === "debit") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">دفع</Badge>;
    } else if (type === "journal") {
      if (isDebit) {
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">مدين</Badge>;
      } else {
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">دائن</Badge>;
      }
    } else {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{type}</Badge>;
    }
  };

  // Get account name by ID
  const getAccountName = (accountId: number) => {
    const account = accounts.find((a: any) => a.id === accountId);
    return account ? account.name : "";
  };

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "نقدي";
      case "bank": return "بنك";
      case "check": return "شيك";
      case "card": return "بطاقة ائتمان";
      default: return method;
    }
  };

  // Handle opening form to create a new transaction
  const handleCreateTransaction = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  // Handle opening form to edit an existing transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المعاملة؟')) {
      return;
    }
    
    try {
      await apiRequest(`/api/transactions/${id}`, "DELETE");
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المعاملة المالية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المعاملة المالية",
        variant: "destructive",
      });
    }
  };

  // Handle applying date filters for reports
  const handleApplyDateFilter = () => {
    refetchReport();
    toast({
      title: "تم تحديث التقرير",
      description: `تم تحديث التقرير للفترة من ${startDate} إلى ${endDate}`,
    });
  };

  // Transaction Form component
  function TransactionForm({ isOpen, onClose, transaction }: { 
    isOpen: boolean; 
    onClose: () => void; 
    transaction: Transaction | null 
  }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [showDebitCredit, setShowDebitCredit] = useState(false);
    
    const form = useForm<TransactionFormValues>({
      resolver: zodResolver(transactionFormSchema),
      defaultValues: {
        type: transaction?.type || "credit",
        accountId: transaction?.accountId || (accounts[0]?.id || 0),
        amount: transaction?.amount || 0,
        date: transaction?.date ? new Date(transaction.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        paymentMethod: transaction?.paymentMethod || "bank",
        notes: transaction?.notes || "",
        reference: transaction?.reference || "",
        isDebit: transaction?.isDebit !== undefined ? transaction.isDebit : true, // Default to debit (مدين)
      },
    });
    
    // Find account details when accountId changes
    useEffect(() => {
      const accountId = form.watch('accountId');
      const foundAccount = accounts.find((a: any) => a.id === accountId);
      setSelectedAccount(foundAccount);
    }, [form.watch('accountId'), accounts]);
    
    // Show/hide debit/credit field based on transaction type
    useEffect(() => {
      const type = form.watch('type');
      setShowDebitCredit(type === 'journal');
    }, [form.watch('type')]);
    
    // Fill amount to match account balance
    const fillAccountBalance = () => {
      if (selectedAccount && selectedAccount.currentBalance) {
        // Use absolute value for the form, but preserve sign for debit/credit suggestion
        const balance = Math.abs(selectedAccount.currentBalance);
        form.setValue('amount', balance);
        
        // Suggest transaction type based on balance direction
        if (selectedAccount.currentBalance < 0) {
          form.setValue('type', 'credit'); // Customer owes money, so they're paying (credit)
        } else if (selectedAccount.currentBalance > 0) {
          form.setValue('type', 'debit'); // We owe customer money, so we're paying (debit)
        }
      }
    };
    
    const onSubmit = async (data: TransactionFormValues) => {
      setIsSubmitting(true);
      try {
        if (transaction) {
          // Update existing transaction
          await apiRequest(`/api/transactions/${transaction.id}`, "PATCH", data);
          toast({
            title: "تم التحديث بنجاح",
            description: "تم تحديث المعاملة المالية بنجاح",
          });
        } else {
          // Create new transaction
          await apiRequest("/api/transactions", "POST", data);
          toast({
            title: "تم الإنشاء بنجاح",
            description: "تم إنشاء المعاملة المالية بنجاح",
          });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        onClose();
      } catch (error) {
        console.error("Error saving transaction:", error);
        toast({
          title: "خطأ في الحفظ",
          description: "حدث خطأ أثناء حفظ المعاملة المالية",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[350px] max-h-[90vh] overflow-y-auto p-3">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-sm">
              {transaction ? "تعديل معاملة" : "معاملة جديدة"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">نوع المعاملة</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit">قبض</SelectItem>
                          <SelectItem value="debit">دفع</SelectItem>
                          <SelectItem value="journal">قيد محاسبي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">المبلغ</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 text-xs"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Show Debit/Credit field only for journal entries */}
              {showDebitCredit && (
                <FormField
                  control={form.control}
                  name="isDebit"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">نوع القيد المحاسبي</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "debit")}
                        defaultValue={field.value ? "debit" : "credit"}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="اختر نوع القيد" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="debit">مدين</SelectItem>
                          <SelectItem value="credit">دائن</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px]">
                        مدين (زيادة في الأصول/المصروفات) | دائن (زيادة في الخصوم/الإيرادات)
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="text-xs">الحساب</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="اختر الحساب" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAccount && selectedAccount.currentBalance !== undefined && (
                      <div className="mt-1 text-[10px] flex items-center justify-between">
                        <span className={selectedAccount.currentBalance < 0 ? "text-red-500" : "text-green-500"}>
                          {Math.abs(selectedAccount.currentBalance).toFixed(2)} ج.م 
                          {selectedAccount.currentBalance < 0 ? " (مدين)" : " (دائن)"}
                        </span>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={fillAccountBalance}
                          className="h-5 py-0 px-2 text-[10px]"
                        >
                          استخدام
                        </Button>
                      </div>
                    )}
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">التاريخ</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-7 text-xs" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-0">
                      <FormLabel className="text-xs">وسيلة الدفع</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">بنك</SelectItem>
                          <SelectItem value="cash">نقدي</SelectItem>
                          <SelectItem value="check">شيك</SelectItem>
                          <SelectItem value="card">بطاقة</SelectItem>
                          <SelectItem value="transfer">تحويل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="text-xs">المرجع</FormLabel>
                    <FormControl>
                      <Input className="h-7 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="text-xs">ملاحظات</FormLabel>
                    <FormControl>
                      <Input className="h-7 text-xs" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-1 flex justify-end space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-6 text-xs px-2">
                  إلغاء
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="h-6 text-xs px-2">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      حفظ...
                    </span>
                  ) : transaction ? "تحديث" : "حفظ"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Main component rendering
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">المعاملات المالية</h2>
        <Button 
          onClick={handleCreateTransaction}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="ml-2 h-5 w-5" />
          إنشاء معاملة جديدة
        </Button>
      </div>
      
      <Tabs defaultValue="transactions">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
          <TabsTrigger value="reports">تقارير مالية</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative min-w-[250px]">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    placeholder="بحث..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="نوع المعاملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="credit">قبض</SelectItem>
                    <SelectItem value="debit">دفع</SelectItem>
                    <SelectItem value="journal">قيود محاسبية</SelectItem>
                    <SelectItem value="journal_debit">قيود مدينة</SelectItem>
                    <SelectItem value="journal_credit">قيود دائنة</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={accountFilter?.toString() || "all"}
                  onValueChange={(value) => setAccountFilter(value !== "all" ? parseInt(value) : null)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحسابات</SelectItem>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex-grow"></div>
                
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تحديث
                </Button>
                
                <Button variant="outline" size="sm">
                  <Printer className="ml-2 h-4 w-4" />
                  طباعة
                </Button>
                
                <Button variant="outline" size="sm">
                  <Download className="ml-2 h-4 w-4" />
                  تصدير
                </Button>
              </div>
              
              {/* Transactions Table */}
              {isLoading ? (
                <div className="text-center py-20">جاري تحميل البيانات...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  لا توجد معاملات مالية للعرض
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">رقم المعاملة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الحساب</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead>الملاحظات</TableHead>
                        <TableHead className="w-[120px] text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: Transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{getAccountName(transaction.accountId)}</TableCell>
                          <TableCell className="font-semibold">
                            {transaction.amount.toFixed(2)} ج.م
                          </TableCell>
                          <TableCell>{getTransactionTypeBadge(transaction.type, transaction.isDebit)}</TableCell>
                          <TableCell>{getPaymentMethodLabel(transaction.paymentMethod)}</TableCell>
                          <TableCell>
                            {transaction.notes}
                            {transaction.reference && (
                              <div className="text-xs text-gray-500">
                                {transaction.reference}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-2 space-x-reverse">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="نوع التقرير" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">قائمة الدخل</SelectItem>
                    <SelectItem value="balance">الميزانية العمومية</SelectItem>
                    <SelectItem value="cashflow">التدفقات النقدية</SelectItem>
                    <SelectItem value="accounts">كشف حساب</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    className="w-[150px]" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                  <span>إلى</span>
                  <Input 
                    type="date" 
                    className="w-[150px]" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDateFilter}>
                    <Calendar className="ml-2 h-4 w-4" />
                    تطبيق
                  </Button>
                </div>
                
                <div className="flex-grow"></div>
                
                <Button variant="outline" size="sm">
                  <Download className="ml-2 h-4 w-4" />
                  تصدير PDF
                </Button>
                
                <Button variant="outline" size="sm">
                  <Printer className="ml-2 h-4 w-4" />
                  طباعة
                </Button>
              </div>
              
              {isReportLoading ? (
                <div className="text-center py-20">جاري تحميل البيانات...</div>
              ) : isReportError ? (
                <div className="text-center py-20 text-red-500">
                  حدث خطأ أثناء تحميل التقرير. يرجى المحاولة مرة أخرى.
                </div>
              ) : reportType === 'income' ? (
                <>
                  {/* Income Statement */}
                  <div className="border rounded-md p-4 mb-4">
                    <h3 className="text-lg font-bold mb-4 text-center">قائمة الدخل</h3>
                    <h4 className="text-sm text-gray-500 mb-4 text-center">
                      للفترة من {new Date(reportData.periodStart).toLocaleDateString('ar-EG')} إلى {new Date(reportData.periodEnd).toLocaleDateString('ar-EG')}
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Revenue Section */}
                      <div>
                        <h5 className="font-bold mb-2">الإيرادات</h5>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>إيرادات المبيعات</TableCell>
                              <TableCell className="text-left">{reportData.revenue?.sales?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>إيرادات أخرى</TableCell>
                              <TableCell className="text-left">{reportData.revenue?.other?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                              <TableCell>إجمالي الإيرادات</TableCell>
                              <TableCell className="text-left">{reportData.revenue?.total?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Expenses Section */}
                      <div>
                        <h5 className="font-bold mb-2">المصروفات</h5>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>تكلفة البضاعة المباعة</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.cogs?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>رواتب الموظفين</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.salaries?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>إيجار</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.rent?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>مرافق</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.utilities?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>مصروفات أخرى</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.other?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                            <TableRow className="font-bold">
                              <TableCell>إجمالي المصروفات</TableCell>
                              <TableCell className="text-left">{reportData.expenses?.total?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Net Income */}
                      <div className="border-t pt-2">
                        <Table>
                          <TableBody>
                            <TableRow className="font-bold text-lg">
                              <TableCell>صافي الربح</TableCell>
                              <TableCell className="text-left">{reportData.netIncome?.toFixed(2)} ج.م</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">إجمالي الإيرادات</p>
                          <p className="text-2xl font-bold text-green-600">{reportData.revenue?.total?.toFixed(2)} ج.م</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">إجمالي المصروفات</p>
                          <p className="text-2xl font-bold text-red-600">{reportData.expenses?.total?.toFixed(2)} ج.م</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">صافي الربح</p>
                          <p className="text-2xl font-bold text-blue-600">{reportData.netIncome?.toFixed(2)} ج.م</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : reportType === 'balance' ? (
                <div className="border rounded-md p-4 mb-4">
                  <h3 className="text-lg font-bold mb-4 text-center">الميزانية العمومية</h3>
                  <h4 className="text-sm text-gray-500 mb-4 text-center">
                    كما في {new Date(reportData.asOf).toLocaleDateString('ar-EG')}
                  </h4>
                  
                  {/* Balance Sheet details would go here */}
                  <div className="text-center py-4">
                    تم إظهار قائمة الدخل كمثال. يمكن توسيع هذا القسم لعرض الميزانية العمومية بناءً على البيانات المستلمة.
                  </div>
                </div>
              ) : reportType === 'cashflow' ? (
                <div className="border rounded-md p-4 mb-4">
                  <h3 className="text-lg font-bold mb-4 text-center">قائمة التدفقات النقدية</h3>
                  <h4 className="text-sm text-gray-500 mb-4 text-center">
                    للفترة من {new Date(reportData.periodStart).toLocaleDateString('ar-EG')} إلى {new Date(reportData.periodEnd).toLocaleDateString('ar-EG')}
                  </h4>
                  
                  {/* Cash Flow details would go here */}
                  <div className="text-center py-4">
                    تم إظهار قائمة الدخل كمثال. يمكن توسيع هذا القسم لعرض التدفقات النقدية بناءً على البيانات المستلمة.
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-4 mb-4">
                  <h3 className="text-lg font-bold mb-4 text-center">كشف حساب</h3>
                  <h4 className="text-sm text-gray-500 mb-4 text-center">
                    {reportData.account?.name} - للفترة من {new Date(reportData.periodStart).toLocaleDateString('ar-EG')} إلى {new Date(reportData.periodEnd).toLocaleDateString('ar-EG')}
                  </h4>
                  
                  {/* Account Statement details would go here */}
                  <div className="text-center py-4">
                    تم إظهار قائمة الدخل كمثال. يمكن توسيع هذا القسم لعرض كشف الحساب بناءً على البيانات المستلمة.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Render transaction form if open */}
      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          transaction={transactionToEdit}
        />
      )}
    </div>
  );
}
