import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, BarChart, LineChart, PieChart, Calendar, FileText, Download, Printer, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState("sales");

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
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">التقارير</h2>
      </div>
      
      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="sales">
            <BarChart className="h-4 w-4 ml-1" />
            تحليل المبيعات
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Grid className="h-4 w-4 ml-1" />
            تقارير المخزون
          </TabsTrigger>
          <TabsTrigger value="financial">
            <FileText className="h-4 w-4 ml-1" />
            التقارير المالية
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          {datePickerComponent}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">المبيعات الشهرية</CardTitle>
                <CardDescription>إجمالي المبيعات خلال 6 أشهر</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="المبيعات" fill="#4ade80" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">المبيعات حسب الفئة</CardTitle>
                <CardDescription>نسبة مساهمة كل فئة في المبيعات</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">أفضل 5 منتجات مبيعاً</CardTitle>
                <CardDescription>المنتجات الأكثر مبيعاً حسب القيمة</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={productData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="المبيعات" fill="#22c55e" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">اتجاه المبيعات</CardTitle>
                <CardDescription>اتجاه المبيعات خلال الفترة المحددة</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={salesData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="المبيعات" stroke="#22c55e" activeDot={{ r: 8 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          {datePickerComponent}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مخزون الأصناف</CardTitle>
                <CardDescription>حالة المخزون الحالية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">تقارير المخزون - قيد التطوير</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">الأصناف الأكثر مبيعاً</CardTitle>
                <CardDescription>الأصناف الأكثر دورانا</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">تقارير المخزون - قيد التطوير</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
          {datePickerComponent}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">ملخص الإيرادات والمصروفات</CardTitle>
                <CardDescription>مقارنة الإيرادات والمصروفات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">التقارير المالية - قيد التطوير</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">حسابات العملاء والموردين</CardTitle>
                <CardDescription>مستحقات العملاء والموردين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">التقارير المالية - قيد التطوير</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}