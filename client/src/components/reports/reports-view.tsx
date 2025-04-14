import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, BarChart, LineChart, PieChart, Calendar, FileText, Download, Printer, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowDownToLine,
  FileSpreadsheet
} from "lucide-react";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function ReportsView() {
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [isError, setIsError] = useState(false);

  // Fetch report data
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ['/api/reports', reportType, startDate, endDate],
    queryFn: async () => {
      try {
        setIsError(false);
        const res = await fetch(`/api/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`);
        if (!res.ok) throw new Error('Failed to fetch report');
        return await res.json();
      } catch (error) {
        console.error("Error fetching report:", error);
        setIsError(true);
        return [];
      }
    },
  });

  const exportReport = () => {
    // In a real implementation, we would generate and download a CSV/Excel file
    // For demonstration purposes, we'll just alert
    alert("تم تصدير التقرير بنجاح!");
  };

  const printReport = () => {
    window.print();
  };

  // Sample data for charts
  const salesData = [
    { name: "Jan", value: 25000 },
    { name: "Feb", value: 32000 },
    { name: "Mar", value: 28000 },
    { name: "Apr", value: 35000 },
    { name: "May", value: 40000 },
    { name: "Jun", value: 38000 },
  ];

  const categoryData = [
    { name: "مواد غذائية", value: 55 },
    { name: "منظفات", value: 20 },
    { name: "أدوات منزلية", value: 15 },
    { name: "إلكترونيات", value: 10 },
  ];

  const productData = [
    { name: "بسكويت شاي", value: 2500 },
    { name: "شاي العروسة", value: 1800 },
    { name: "ارز مصري", value: 3500 },
    { name: "زيت عافية", value: 2200 },
    { name: "سكر", value: 3000 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const datePickerComponent = (
    <div className="w-full flex justify-end">
      <div className="flex items-center space-x-2 space-x-reverse mb-4">
        <Select defaultValue="month">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">أسبوع</SelectItem>
            <SelectItem value="month">شهر</SelectItem>
            <SelectItem value="quarter">ربع سنة</SelectItem>
            <SelectItem value="year">سنة</SelectItem>
            <SelectItem value="custom">مخصص</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline">
          <Calendar className="h-4 w-4 ml-1" />
          <span>التاريخ</span>
        </Button>
        
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">التقارير</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={exportReport}
          >
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            تصدير إكسل
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={printReport}
          >
            <Download className="h-4 w-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="sales" onValueChange={setReportType}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">تقرير المبيعات</TabsTrigger>
          <TabsTrigger value="purchases">تقرير المشتريات</TabsTrigger>
          <TabsTrigger value="inventory">تقرير المخزون</TabsTrigger>
          <TabsTrigger value="customers">تقرير العملاء</TabsTrigger>
          <TabsTrigger value="suppliers">تقرير الموردين</TabsTrigger>
        </TabsList>
        
            <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="start-date">تاريخ البداية</Label>
                <div className="flex mt-1">
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="end-date">تاريخ النهاية</Label>
                <div className="flex mt-1">
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                </div>
              <div className="flex items-end">
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  عرض التقرير
                </Button>
                </div>
          </div>

            <TabsContent value="sales" className="mt-0">
              <h3 className="text-lg font-medium mb-4">تقرير المبيعات</h3>
              <ReportTable
                headers={['رقم الفاتورة', 'التاريخ', 'العميل', 'الإجمالي', 'الحالة']}
                data={reportData}
                isLoading={isLoading}
                emptyMessage="لا توجد مبيعات في الفترة المحددة"
                keyField="invoiceNumber"
                columns={['invoiceNumber', 'date', 'accountName', 'total', 'status']}
                formatters={{
                  date: (value) => new Date(value).toLocaleDateString('ar-EG'),
                  total: (value) => `${value.toFixed(2)} ج.م`,
                  status: (value) => getStatusLabel(value)
                }}
                isError={isError}
              />
        </TabsContent>
        
            <TabsContent value="purchases" className="mt-0">
              <h3 className="text-lg font-medium mb-4">تقرير المشتريات</h3>
              <ReportTable
                headers={['رقم الفاتورة', 'التاريخ', 'المورد', 'الإجمالي', 'الحالة']}
                data={reportData}
                isLoading={isLoading}
                emptyMessage="لا توجد مشتريات في الفترة المحددة"
                keyField="invoiceNumber"
                columns={['invoiceNumber', 'date', 'accountName', 'total', 'status']}
                formatters={{
                  date: (value) => new Date(value).toLocaleDateString('ar-EG'),
                  total: (value) => `${value.toFixed(2)} ج.م`,
                  status: (value) => getStatusLabel(value)
                }}
                isError={isError}
              />
            </TabsContent>

            <TabsContent value="inventory" className="mt-0">
              <h3 className="text-lg font-medium mb-4">تقرير المخزون</h3>
              <ReportTable
                headers={['المنتج', 'الكمية', 'سعر الشراء', 'سعر البيع', 'القيمة الإجمالية']}
                data={reportData}
                isLoading={isLoading}
                emptyMessage="لا توجد بيانات مخزون متاحة"
                keyField="id"
                columns={['name', 'quantity', 'costPrice', 'sellPrice1', 'totalValue']}
                formatters={{
                  costPrice: (value) => `${value.toFixed(2)} ج.م`,
                  sellPrice1: (value) => `${value.toFixed(2)} ج.م`,
                  totalValue: (value) => `${value.toFixed(2)} ج.م`
                }}
                isError={isError}
              />
            </TabsContent>

            <TabsContent value="customers" className="mt-0">
              <h3 className="text-lg font-medium mb-4">تقرير العملاء</h3>
              <ReportTable
                headers={['العميل', 'عدد الفواتير', 'إجمالي المبيعات', 'آخر معاملة']}
                data={reportData}
                isLoading={isLoading}
                emptyMessage="لا توجد بيانات عملاء متاحة"
                keyField="id"
                columns={['name', 'invoiceCount', 'totalSales', 'lastTransaction']}
                formatters={{
                  totalSales: (value) => `${value.toFixed(2)} ج.م`,
                  lastTransaction: (value) => value ? new Date(value).toLocaleDateString('ar-EG') : "-"
                }}
                isError={isError}
              />
        </TabsContent>
        
            <TabsContent value="suppliers" className="mt-0">
              <h3 className="text-lg font-medium mb-4">تقرير الموردين</h3>
              <ReportTable
                headers={['المورد', 'عدد الفواتير', 'إجمالي المشتريات', 'آخر معاملة']}
                data={reportData}
                isLoading={isLoading}
                emptyMessage="لا توجد بيانات موردين متاحة"
                keyField="id"
                columns={['name', 'invoiceCount', 'totalPurchases', 'lastTransaction']}
                formatters={{
                  totalPurchases: (value) => `${value.toFixed(2)} ج.م`,
                  lastTransaction: (value) => value ? new Date(value).toLocaleDateString('ar-EG') : "-"
                }}
                isError={isError}
              />
            </TabsContent>
              </CardContent>
            </Card>
      </Tabs>
    </div>
  );
}

// Helper component for rendering report tables
function ReportTable({ 
  headers, 
  data, 
  isLoading, 
  emptyMessage, 
  keyField,
  columns,
  formatters = {},
  isError = false
}: { 
  headers: string[], 
  data: any[], 
  isLoading: boolean, 
  emptyMessage: string,
  keyField: string,
  columns: string[],
  formatters?: {[key: string]: (value: any) => any},
  isError?: boolean
}) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحميل البيانات...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى لاحقاً.</div>;
  }

  if (!data.length) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index} className={index > 0 ? "text-center" : ""}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row[keyField]}>
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={colIndex > 0 ? "text-center" : ""}>
                  {formatters[column] ? formatters[column](row[column]) : row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper function for status labels
function getStatusLabel(status: string) {
  switch (status) {
    case 'draft':
      return <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs">مسودة</span>;
    case 'posted':
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">مرحلة</span>;
    case 'paid':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">مدفوعة</span>;
    case 'partially_paid':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">مدفوعة جزئياً</span>;
    case 'cancelled':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">ملغاة</span>;
    default:
      return status;
  }
}