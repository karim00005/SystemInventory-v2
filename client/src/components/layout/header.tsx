import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Plus, Settings, Menu } from "lucide-react";
import { useTab } from "@/hooks/use-tab";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  pageTitle: string;
}

export default function Header({ toggleSidebar, sidebarOpen, pageTitle }: HeaderProps) {
  const [location, navigate] = useLocation();
  const { user, companyName } = useAppContext();
  const { tabs, activeTab, addTab, removeTab, setActiveTab } = useTab();
  
  // Main navigation items
  const navItems = [
    { title: "البرنامج", path: "/" },
    { title: "الصفحة الرئيسية", path: "/" },
    { title: "الحسابات", path: "/accounts" },
    { title: "الخزينة", path: "/finance" },
    { title: "الفواتير", path: "/" },
    { title: "تقارير", path: "/" },
    { title: "مساعدة", path: "/" },
    { title: "خدمة العملاء", path: "/" },
    { title: "الشراء", path: "/" }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header with Logo and Navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo and Company Info */}
        <div className="flex items-center space-x-2 space-x-reverse">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {/* Green Logo */}
          <div className="bg-primary p-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          
          {/* App title with company info */}
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-lg font-bold text-gray-800">سهل لإدارة الأعمال</h1>
              <div className="bg-gray-200 rounded px-1 text-xs text-gray-600">نسخة تجريبية</div>
            </div>
            <div className="text-xs text-gray-600">
              الشركة: {companyName || "شركة الريادي لتوزيع المواد الغذائية"} || المستخدم: {user?.fullName || user?.username || "كريم كمال"}
            </div>
          </div>
        </div>
        
        {/* Main top navigation - hidden on mobile */}
        <nav className="hidden lg:flex">
          <ul className="flex space-x-4 space-x-reverse">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.path}
                  className={cn(
                    "px-3 py-2 text-sm font-medium hover:text-primary",
                    location === item.path && "text-primary"
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User options and settings */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex items-center px-2">
        <div className="flex overflow-x-auto py-1 border-b border-gray-200 w-full custom-scrollbar">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                navigate(tab.path);
              }}
              className={cn(
                "flex items-center px-4 py-2 text-gray-600 font-medium cursor-pointer hover:bg-gray-50 rounded-t-md",
                tab.id === activeTab && "text-primary font-medium border-b-2 border-primary -mb-px bg-gray-100 rounded-t-md"
              )}
            >
              <span>{tab.title}</span>
              <button 
                className="mr-2 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(tab.id);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {/* New Tab Button */}
          <div className="flex items-center mr-2">
            <button 
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm flex items-center"
              onClick={() => addTab(pageTitle, location)}
            >
              <Plus className="h-4 w-4 ml-1" />
              <span>جديد</span>
            </button>
          </div>
          
          {/* Start New Button */}
          <div className="mr-auto flex items-center">
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm">
              ابدأ من هنا
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
