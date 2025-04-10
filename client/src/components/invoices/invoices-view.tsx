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
import { useQuery } from "@tanstack/react-query";
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
  FileUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function InvoicesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("sales");
  
  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  // Mock invoices data
  const mockSalesInvoices = [
    { id: 1, number: "INV-0001", date: "2025-04-05", customer: "محمد أحمد", total: 1250.00, status: "مدفوع", items: 5 },
    { id: 2, number: "INV-0002", date: "2025-04-06", customer: "شركة الأهرام للتجارة", total: 3450.75, status: "غير مدفوع", items: 8 },
    { id: 3, number: "INV-0003", date: "2025-04-07", customer: "سوبر ماركت المدينة", total: 1875.25, status: "مدفوع جزئياً", items: 12 },
    { id: 4, number: "INV-0004", date: "2025-04-08", customer: "محلات عابدين", total: 950.50, status: "مدفوع", items: 3 },
    { id: 5, number: "INV-0005", date: "2025-04-09", customer: "أحمد خالد", total: 2300.00, status: "غير مدفوع", items: 7 },
  ];
  
  const mockPurchaseInvoices = [
    { id: 1, number: "PUR-0001", date: "2025-04-02", supplier: "شركة النور للتوزيع", total: 5250.00, status: "مدفوع", items: 15 },
    { id: 2, number: "PUR-0002", date: "2025-04-04", supplier: "شركة الإيمان للتجارة", total: 4320.25, status: "غير مدفوع", items: 9 },
    { id: 3, number: "PUR-0003", date: "2025-04-05", supplier: "مؤسسة الخير للتوريدات", total: 1960.00, status: "مدفوع جزئياً", items: 6 },
  ];
  
  // Filter invoices based on search term
  const filteredSalesInvoices = mockSalesInvoices.filter(invoice =>
    invoice.number.includes(searchTerm) || 
    invoice.customer.includes(searchTerm)
  );
  
  const filteredPurchaseInvoices = mockPurchaseInvoices.filter(invoice =>
    invoice.number.includes(searchTerm) || 
    invoice.supplier.includes(searchTerm)
  );
  
  const getStatusBadge = (status: string) => {
    let color = "";
    switch (status) {
      case "مدفوع":
        color = "bg-green-100 text-green-800";
        break;
      case "غير مدفوع":
        color = "bg-red-100 text-red-800";
        break;
      case "مدفوع جزئياً":
        color = "bg-amber-100 text-amber-800";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
    }
    return <Badge className={color + " hover:bg-opacity-80"}>{status}</Badge>;
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">الفواتير</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="default" className="bg-green-500 hover:bg-green-600">
            <Plus className="h-5 w-5 ml-1" />
            فاتورة جديدة
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger 
              value="sales"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <Tag className="h-4 w-4 ml-1" />
              فواتير المبيعات
            </TabsTrigger>
            <TabsTrigger 
              value="purchases"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <ShoppingCart className="h-4 w-4 ml-1" />
              فواتير المشتريات
            </TabsTrigger>
            <TabsTrigger 
              value="returns"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <ArrowDown className="h-4 w-4 ml-1" />
              المرتجعات
            </TabsTrigger>
            <TabsTrigger 
              value="quotations"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <FileUp className="h-4 w-4 ml-1" />
              عروض الأسعار
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="relative w-72">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="بحث في الفواتير..."
                      className="pl-4 pr-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="حالة الفاتورة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="unpaid">غير مدفوع</SelectItem>
                      <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="flex items-center">
                    <Calendar className="h-4 w-4 ml-1" />
                    <span>التاريخ</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 ml-1" />
                    تصفية
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 ml-1" />
                    تصدير
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 ml-1" />
                    طباعة
                  </Button>
                </div>
              </div>
              
              <TabsContent value="sales" className="m-0 pt-4">
                <div className="rounded-md border">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">عدد الأصناف</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">خيارات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSalesInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            لا توجد فواتير للعرض
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSalesInvoices.map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{invoice.number}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>{invoice.customer}</TableCell>
                            <TableCell>{invoice.items}</TableCell>
                            <TableCell className="font-semibold">{invoice.total.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="purchases" className="m-0 pt-4">
                <div className="rounded-md border">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الفاتورة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المورد</TableHead>
                        <TableHead className="text-right">عدد الأصناف</TableHead>
                        <TableHead className="text-right">الإجمالي</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">خيارات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchaseInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            لا توجد فواتير للعرض
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPurchaseInvoices.map((invoice) => (
                          <TableRow key={invoice.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{invoice.number}</TableCell>
                            <TableCell>{invoice.date}</TableCell>
                            <TableCell>{invoice.supplier}</TableCell>
                            <TableCell>{invoice.items}</TableCell>
                            <TableCell className="font-semibold">{invoice.total.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="returns" className="m-0 pt-4">
                <div className="min-h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">المرتجعات - قيد التطوير</p>
                </div>
              </TabsContent>
              
              <TabsContent value="quotations" className="m-0 pt-4">
                <div className="min-h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">عروض الأسعار - قيد التطوير</p>
                </div>
              </TabsContent>
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}