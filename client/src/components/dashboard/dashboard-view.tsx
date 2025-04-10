import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import {
  Package,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  Clock,
  Upload,
  ShoppingCart,
  LayoutGrid,
  ArrowUpDown,
  Tag,
  Calculator,
  BookOpen,
  Settings,
  Database
} from "lucide-react";

export default function DashboardView() {
  const { companyName } = useAppContext();
  
  // Fetch statistics data
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  // Main navigation tiles
  const mainTiles = [
    { title: "البضاعة", icon: Package, path: "/inventory", color: "bg-primary" },
    { title: "الحسابات", icon: Users, path: "/accounts", color: "bg-primary" },
    { title: "الخزينة", icon: DollarSign, path: "/finance", color: "bg-primary" },
    { title: "الفواتير", icon: FileText, path: "/invoices", color: "bg-primary" },
    { title: "تقارير", icon: BarChart3, path: "/reports", color: "bg-primary" }
  ];
  
  // Report tiles
  const reportTiles = [
    { title: "تحليل المبيعات", icon: BarChart3, path: "/reports", color: "bg-blue-600" },
    { title: "الحركة اليومية", icon: Clock, path: "/reports", color: "bg-blue-600" },
    { title: "كشف الحسابات", icon: FileText, path: "/reports", color: "bg-blue-500" },
    { title: "استيراد بيانات", icon: Upload, path: "/import", color: "bg-blue-500" },
    { title: "جرد مخزن", icon: Package, path: "/inventory", color: "bg-primary" },
    { title: "مصاريف", icon: DollarSign, path: "/finance", color: "bg-red-500" },
    { title: "شراء", icon: ShoppingCart, path: "/invoices", color: "bg-red-500" },
    { title: "تسوية مخزن", icon: LayoutGrid, path: "/inventory", color: "bg-primary" },
    { title: "تحويل لمخزن", icon: ArrowUpDown, path: "/inventory", color: "bg-primary" },
    { title: "بيع", icon: Tag, path: "/invoices", color: "bg-primary" },
    { title: "حاسبة", icon: Calculator, path: "#", color: "bg-indigo-600" },
    { title: "عرض أسعار", icon: Tag, path: "/invoices", color: "bg-indigo-600" }
  ];

  return (
    <div className="min-h-full">
      <div className="flex flex-col md:flex-row">
        {/* Main Section with Tiles */}
        <div className="flex-1 p-4">
          {/* App Logo and Title */}
          <div className="flex items-center mb-6">
            <div className="bg-primary p-3 rounded-lg ml-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">سهل لإدارة الأعمال</h2>
              <p className="text-gray-600 text-sm">أسهل برنامج لإدارة المحلات والمخازن في العالم العربي</p>
            </div>
          </div>
          
          {/* Main Navigation Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {mainTiles.map((tile, index) => (
              <Link key={index} href={tile.path}>
                <div className={`${tile.color} rounded-lg p-4 text-white text-center cursor-pointer hover:opacity-90 transition duration-150 stat-card`}>
                  <tile.icon className="h-8 w-8 mx-auto mb-2" />
                  <span className="block font-medium">{tile.title}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Functional Area Title */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">تقارير</h3>
          
          {/* Secondary Navigation Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {reportTiles.map((tile, index) => (
              <Link key={index} href={tile.path}>
                <div className={`${tile.color} rounded-lg p-4 text-white text-center cursor-pointer hover:opacity-90 transition duration-150 stat-card`}>
                  <tile.icon className="h-8 w-8 mx-auto mb-2" />
                  <span className="block font-medium">{tile.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Right Sidebar Modules */}
        <div className="w-full md:w-72 bg-gradient-to-b from-green-50 to-green-100 p-4 border-r border-gray-200">
          {/* Quick Tools Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">أدوات سريعة</h3>
            <div className="space-y-2">
              <Link href="/settings">
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                  <div className="w-10 h-10 flex items-center justify-center ml-3 bg-blue-500 text-white rounded-lg">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">إعداد سهل</h4>
                    <p className="text-xs text-gray-500">ضبط إعدادات البرنامج</p>
                  </div>
                </div>
              </Link>
              
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                <div className="w-10 h-10 flex items-center justify-center ml-3 bg-blue-500 text-white rounded-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">تعلم</h4>
                  <p className="text-xs text-gray-500">دليل استخدام البرنامج</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                <div className="w-10 h-10 flex items-center justify-center ml-3 bg-amber-500 text-white rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">جدول المواعيد</h4>
                  <p className="text-xs text-gray-500">إدارة المواعيد والتذكيرات</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">إحصائيات سريعة</h3>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">المبيعات اليوم</span>
                <span className="text-primary font-bold">{stats?.todaySales ? `${stats.todaySales} ر.س` : "0.00 ر.س"}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">عدد الفواتير</span>
                <span className="text-primary font-bold">{stats?.invoiceCount || "0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">الربح الصافي</span>
                <span className="text-green-600 font-bold">{stats?.netProfit ? `${stats.netProfit} ر.س` : "0.00 ر.س"}</span>
              </div>
            </div>
          </div>
          
          {/* Backup Reminder */}
          <div>
            <Link href="/backup">
              <div className="bg-white rounded-lg shadow-sm p-4 border-r-4 border-amber-500 hover:bg-gray-50 cursor-pointer">
                <h4 className="font-bold text-gray-800 mb-2">نسخة احتياطية</h4>
                <p className="text-sm text-gray-600 mb-3">يجب عمل نسخة احتياطية بشكل دوري لضمان سلامة بياناتك</p>
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Database className="h-4 w-4 ml-2" />
                  عمل نسخة الآن
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
