import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons
import { Printer, Download, RefreshCw } from "lucide-react";

interface AccountDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
}

export default function AccountDetailsDialog({ isOpen, onClose, account }: AccountDetailsProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [activeTab, setActiveTab] = useState("statement");
  
  // Fetch account statement data
  const { 
    data: statementData = {}, 
    isLoading: isStatementLoading,
    refetch: refetchStatement
  } = useQuery({
    queryKey: ['/api/accounts/statement', account?.id, startDate, endDate],
    queryFn: async () => {
      if (!account?.id) return null;
      return apiRequest(`/api/accounts/${account.id}/statement?startDate=${startDate}&endDate=${endDate}`, 'GET');
    },
    enabled: !!account?.id && isOpen,
  });

  // Fetch invoices by account id
  const { 
    data: invoices = [], 
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices
  } = useQuery({
    queryKey: ['/api/invoices', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest(`/api/invoices?accountId=${account.id}`, 'GET');
    },
    enabled: !!account?.id && isOpen && activeTab === "invoices",
  });

  // Fetch purchases by account id
  const { 
    data: purchases = [], 
    isLoading: isPurchasesLoading,
    refetch: refetchPurchases
  } = useQuery({
    queryKey: ['/api/purchases', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest(`/api/purchases?accountId=${account.id}`, 'GET');
    },
    enabled: !!account?.id && isOpen && activeTab === "purchases",
  });

  // Fetch transactions by account id
  const { 
    data: transactions = [], 
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/transactions', account?.id],
    queryFn: async () => {
      if (!account?.id) return [];
      return apiRequest(`/api/transactions?accountId=${account.id}`, 'GET');
    },
    enabled: !!account?.id && isOpen && activeTab === "transactions",
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch (e) {
      return dateString;
    }
  };

  // Get badge for transaction type
  const getTransactionTypeBadge = (type: string, isDebit?: boolean) => {
    switch (type) {
      case 'credit':
        return <Badge className="bg-green-100 text-green-800">قبض</Badge>;
      case 'debit':
        return <Badge className="bg-red-100 text-red-800">دفع</Badge>;
      case 'journal':
        return <Badge className="bg-gray-100 text-gray-800">{isDebit ? "مدين" : "دائن"}</Badge>;
      case 'invoice':
        return <Badge className="bg-blue-100 text-blue-800">فاتورة</Badge>;
      case 'purchase':
        return <Badge className="bg-purple-100 text-purple-800">مشتريات</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{type}</Badge>;
    }
  };

  // Get badge for invoice status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">مسودة</Badge>;
      case 'posted':
        return <Badge className="bg-green-100 text-green-800">مرحلة</Badge>;
      case 'voided':
        return <Badge className="bg-red-100 text-red-800">ملغاة</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Get account type as Arabic string
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'عميل';
      case 'supplier': return 'مورد';
      case 'expense': return 'مصروف';
      case 'income': return 'إيراد';
      case 'bank': return 'بنك';
      case 'cash': return 'صندوق';
      default: return type;
    }
  };

  // Handle date filter change
  const handleDateFilterChange = () => {
    refetchStatement();
    if (activeTab === "invoices") refetchInvoices();
    if (activeTab === "purchases") refetchPurchases();
    if (activeTab === "transactions") refetchTransactions();
  };

  // Print account statement
  const printAccountStatement = () => {
    if (!statementData || !statementData.account) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currencySymbol = "ج.م";
    const companyName = "شركة الريادي للمواد الغذائية";
    const companyAddress = "القاهرة، مصر";
    const companyPhone = "01234567890";
    
    // Create print content (simplified for this example)
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف حساب - ${statementData.account.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          .table th { background-color: #f2f2f2; }
          .green { color: green; }
          .red { color: red; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${companyName}</h2>
          <p>${companyAddress} - ${companyPhone}</p>
          <h3>كشف حساب: ${statementData.account.name} (${getAccountTypeLabel(statementData.account.type)})</h3>
          <p>الفترة من ${formatDate(statementData.periodStart)} إلى ${formatDate(statementData.periodEnd)}</p>
          <p>الرصيد الافتتاحي: ${statementData.startingBalance?.toFixed(2)} ${currencySymbol}</p>
          <p>الرصيد الختامي: 
            <span class="${statementData.endingBalance >= 0 ? 'green' : 'red'}">
              ${statementData.endingBalance?.toFixed(2)} ${currencySymbol}
            </span>
          </p>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المرجع</th>
              <th>البيان</th>
              <th>النوع</th>
              <th>مدين</th>
              <th>دائن</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${statementData.transactions?.map((t: any) => `
              <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.reference || '-'}</td>
                <td>${t.description || '-'}</td>
                <td>${t.type}</td>
                <td>${t.isDebit ? t.amount.toFixed(2) : '-'}</td>
                <td>${!t.isDebit ? t.amount.toFixed(2) : '-'}</td>
                <td class="${t.balance >= 0 ? 'green' : 'red'}">${t.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()">طباعة</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    };
  };

  // Function to export data as CSV
  const exportAsCSV = () => {
    // Implementation would go here
    alert("سيتم توفير هذه الخاصية قريباً");
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <span>{account.name}</span>
            <Badge className="ml-2">{getAccountTypeLabel(account.type)}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">الرصيد الحالي</p>
                <p className={`text-xl font-bold ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(account.currentBalance).toFixed(2)} ج.م
                  <span className="text-sm font-normal block">
                    {account.currentBalance < 0 ? "(مدين)" : "(دائن)"}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {statementData.totalDebits && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">إجمالي المدين</p>
                  <p className="text-xl font-bold text-red-600">
                    {statementData.totalDebits?.toFixed(2)} ج.م
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {statementData.totalCredits && (
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">إجمالي الدائن</p>
                  <p className="text-xl font-bold text-green-600">
                    {statementData.totalCredits?.toFixed(2)} ج.م
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Date Filter */}
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <label className="text-sm">من:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border rounded"
          />
          
          <label className="text-sm mr-2">إلى:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border rounded"
          />
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDateFilterChange}
            className="mr-2"
          >
            تطبيق
          </Button>
          
          <div className="flex-grow"></div>
          
          <Button size="sm" variant="outline" onClick={printAccountStatement}>
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
          
          <Button size="sm" variant="outline" onClick={exportAsCSV}>
            <Download className="h-4 w-4 ml-1" />
            تصدير
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs 
          defaultValue="statement" 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="statement">كشف حساب</TabsTrigger>
            <TabsTrigger value="transactions">المعاملات</TabsTrigger>
            <TabsTrigger value="invoices">فواتير المبيعات</TabsTrigger>
            <TabsTrigger value="purchases">فواتير المشتريات</TabsTrigger>
          </TabsList>
          
          {/* Account Statement Tab */}
          <TabsContent value="statement">
            {isStatementLoading ? (
              <div className="text-center py-10">جاري تحميل البيانات...</div>
            ) : statementData.transactions?.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead className="text-left">مدين</TableHead>
                      <TableHead className="text-left">دائن</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Starting balance row */}
                    <TableRow className="bg-slate-50">
                      <TableCell>{formatDate(statementData.periodStart)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="font-semibold">رصيد افتتاحي</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-left">-</TableCell>
                      <TableCell className="text-left">-</TableCell>
                      <TableCell className="text-left font-semibold">{statementData.startingBalance?.toFixed(2)} ج.م</TableCell>
                    </TableRow>
                    
                    {/* Transaction rows */}
                    {statementData.transactions.map((transaction: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.reference || '-'}</TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(transaction.type, transaction.isDebit)}
                        </TableCell>
                        <TableCell className="text-left">{transaction.isDebit ? transaction.amount.toFixed(2) : '-'} {transaction.isDebit ? 'ج.م' : ''}</TableCell>
                        <TableCell className="text-left">{!transaction.isDebit ? transaction.amount.toFixed(2) : '-'} {!transaction.isDebit ? 'ج.م' : ''}</TableCell>
                        <TableCell className={`text-left font-semibold ${transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.balance.toFixed(2)} ج.م
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Ending balance row */}
                    <TableRow className="bg-slate-50 font-bold">
                      <TableCell>{formatDate(statementData.periodEnd)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="font-semibold">الإجمالي</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-left">{statementData.totalDebits?.toFixed(2)} ج.م</TableCell>
                      <TableCell className="text-left">{statementData.totalCredits?.toFixed(2)} ج.م</TableCell>
                      <TableCell className={`text-left font-semibold ${statementData.endingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {statementData.endingBalance?.toFixed(2)} ج.م
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                لا توجد معاملات في هذه الفترة
              </div>
            )}
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            {isTransactionsLoading ? (
              <div className="text-center py-10">جاري تحميل البيانات...</div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>وسيلة الدفع</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{getTransactionTypeBadge(transaction.type, transaction.isDebit)}</TableCell>
                        <TableCell>{transaction.amount.toFixed(2)} ج.م</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell>{transaction.reference || '-'}</TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                لا توجد معاملات لهذا الحساب
              </div>
            )}
          </TabsContent>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices">
            {isInvoicesLoading ? (
              <div className="text-center py-10">جاري تحميل البيانات...</div>
            ) : invoices.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell>{invoice.warehouse?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{invoice.total.toFixed(2)} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                لا توجد فواتير مبيعات لهذا الحساب
              </div>
            )}
          </TabsContent>
          
          {/* Purchases Tab */}
          <TabsContent value="purchases">
            {isPurchasesLoading ? (
              <div className="text-center py-10">جاري تحميل البيانات...</div>
            ) : purchases.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المخزن</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase: any) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(purchase.date)}</TableCell>
                        <TableCell>{purchase.warehouse?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                        <TableCell>{purchase.total.toFixed(2)} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                لا توجد فواتير مشتريات لهذا الحساب
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 