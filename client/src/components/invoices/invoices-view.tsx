import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  FileText, 
  Filter, 
  Calendar, 
  ArrowDown, 
  Download, 
  Printer, 
  ShoppingCart,
  Tag,
  FileUp,
  Eye,
  Pencil,
  Trash,
  RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InvoiceForm from "./invoice-form";
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  FilterIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesView() {
  const [activeTab, setActiveTab] = useState('sales');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
  const queryClient = useQueryClient();
  
  // Fetch settings to check if purchases view is combined
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      return apiRequest('/api/settings', 'GET');
    }
  });

  // Check if purchases should be shown in this view
  const combinePurchaseViews = settings?.combinePurchaseViews !== false;
  
  // Fetch invoices data
  const { data: invoicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/invoices?type=${activeTab}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleNewInvoice = () => {
    if (activeTab === 'sales') {
      navigate('/invoices/new');
    } else {
      navigate('/purchases/new');
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  const handleDeleteInvoice = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      
      // Refresh the data
      refetch();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const filteredInvoices = invoicesData
    ? invoicesData.filter((invoice: any) => {
        const matchesSearch = searchQuery === '' || 
          (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (invoice.account?.name && invoice.account.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];
  
  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status) {
      case 'draft':
        variant = "outline";
        break;
      case 'posted':
        variant = "secondary";
        break;
      case 'paid':
        variant = "default";
        break;
      case 'partially_paid':
        variant = "secondary";
        break;
      case 'cancelled':
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return (
      <Badge variant={variant} className="mx-auto">
        {status === 'posted' ? 'جاري' : 
         status === 'draft' ? 'مسودة' : 
         status === 'paid' ? 'مدفوع' :
         status === 'partially_paid' ? 'مدفوع جزئياً' :
         status === 'cancelled' ? 'ملغي' : status}
      </Badge>
    );
  };
  
  // Get a translation for the tab name
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'sales':
        return 'فواتير المبيعات';
      case 'purchases':
        return 'فواتير المشتريات';
      case 'returns':
        return 'المرتجعات';
      case 'quotes':
        return 'عروض الأسعار';
      default:
        return tab;
    }
  };
  
  // Get a proper account column name based on the tab
  const getAccountColumnName = () => {
    return activeTab === 'sales' ? 'العميل' : 'المورد';
  };
  
  // Content for each tab
  function InvoiceTabContent() {
  return (
      <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="relative w-72">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="بحث في الفواتير..."
                      className="pl-4 pr-10"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    />
                  </div>
                  
                <Select 
                  value={statusFilter} 
                  onValueChange={handleFilterChange}
                >
                    <SelectTrigger className="w-36">
                    <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="posted">جاري</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Calendar className="h-4 w-4 ml-1" />
                    <span>التاريخ</span>
                      <ChevronDownIcon className="mr-2 h-4 w-4" />
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>اليوم</DropdownMenuItem>
                    <DropdownMenuItem>هذا الأسبوع</DropdownMenuItem>
                    <DropdownMenuItem>هذا الشهر</DropdownMenuItem>
                    <DropdownMenuItem>هذا العام</DropdownMenuItem>
                    <DropdownMenuItem>الكل</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 ml-1" />
                  <span>تحديث</span>
                </Button>
                  <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 ml-1" />
                  <span>طباعة</span>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ml-1" />
                  <span>تصدير</span>
                  </Button>
                </div>
              </div>
              
            <div className="m-0 pt-4">
                <div className="rounded-md border">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">{getAccountColumnName()}</TableHead>
                      <TableHead className="text-right">إجمالي المنتجات</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">خيارات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          جاري التحميل...
                          </TableCell>
                        </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-red-500">
                          حدث خطأ أثناء تحميل البيانات. الرجاء المحاولة مرة أخرى.
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            لا توجد فواتير للعرض
                          </TableCell>
                        </TableRow>
                      ) : (
                      filteredInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                          <TableCell>{invoice.account?.name || "-"}</TableCell>
                          <TableCell className="text-center">{invoice.details?.length || 0}</TableCell>
                          <TableCell>{formatCurrency(invoice.total)}</TableCell>
                          <TableCell className="text-center">{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell>
                            <div className="flex space-x-1 space-x-reverse">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                onClick={() => navigate(`/invoices/${invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-amber-600 hover:text-amber-900 hover:bg-amber-50"
                                onClick={() => {
                                  setInvoiceToEdit(invoice);
                                  setIsInvoiceFormOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                              >
                                <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">{getTabTitle(activeTab)}</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="default" 
            className="bg-green-500 hover:bg-green-600"
            onClick={handleNewInvoice}
          >
            <Plus className="h-5 w-5 ml-1" />
            فاتورة جديدة
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="sales">فواتير المبيعات</TabsTrigger>
            {combinePurchaseViews && <TabsTrigger value="purchases">فواتير المشتريات</TabsTrigger>}
            <TabsTrigger value="returns">المرتجعات</TabsTrigger>
            <TabsTrigger value="quotes">عروض الأسعار</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="mt-6">
            <InvoiceTabContent />
              </TabsContent>
              
          {combinePurchaseViews && (
            <TabsContent value="purchases" className="mt-6">
              <InvoiceTabContent />
            </TabsContent>
          )}
          
          <TabsContent value="returns" className="mt-6">
            <InvoiceTabContent />
              </TabsContent>
              
          <TabsContent value="quotes" className="mt-6">
            <InvoiceTabContent />
              </TabsContent>
        </Tabs>
      </div>
      
      {/* Invoice Form */}
      {isInvoiceFormOpen && (
        <InvoiceForm
          isOpen={isInvoiceFormOpen}
          onClose={() => setIsInvoiceFormOpen(false)}
          invoiceToEdit={invoiceToEdit}
          invoiceType={activeTab === "purchases" ? "purchase" : "sales"}
        />
      )}
    </div>
  );
}