import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { 
  Eye, 
  Pencil, 
  Trash, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload,
  FileDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import AccountForm from "./account-form";
import AccountDetailsDialog from "./account-details";
import { exportAccountsToExcel, getExcelTemplate, importFromExcel, ExcelAccount } from "@/lib/excel-utils";
import { Input } from "@/components/ui/input";

// Define a type for the cell info object
interface CellInfo {
  row: {
    original: any;
  }
}

// Define a type for account objects
interface Account {
  id: number;
  name: string;
  type: string;
  category?: string;
  currentBalance: number;
}

export default function AccountsView() {
  const [accountType, setAccountType] = useState<string | undefined>(undefined);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch accounts data
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/accounts', accountType],
    queryFn: async ({ queryKey }) => {
      try {
        const url = accountType 
          ? `/api/accounts?type=${accountType}` 
          : `/api/accounts`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`فشل تحميل بيانات الحسابات: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('تنسيق البيانات غير صحيح');
        }
        return data;
      } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 30000 // Cache for 30 seconds
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await apiRequest(`/api/accounts/${id}`, 'DELETE');
      }
      return ids;
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الحسابات المحددة بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الحسابات",
        variant: "destructive",
      });
    }
  });

  const handleViewAccount = (account: any) => {
    setSelectedAccount(account);
    setIsAccountDetailsOpen(true);
  };

  // Handle Excel import
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const accounts = await importFromExcel<ExcelAccount>(file);
      
      // Create accounts one by one
      for (const account of accounts) {
        await apiRequest('/api/accounts', 'POST', {
          code: account.الكود,
          name: account.الاسم,
          type: account.النوع === 'عميل' ? 'customer' : 'supplier',
          address: account.العنوان,
          phone: account.الهاتف,
          openingBalance: account['الرصيد الافتتاحي'],
          notes: account.ملاحظات
        });
      }
      
      toast({
        title: "تم الاستيراد بنجاح",
        description: `تم استيراد ${accounts.length} حساب`,
      });
      
      // Refresh accounts list
      refetch();
      
    } catch (error) {
      console.error('Error importing accounts:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء استيراد الحسابات. يرجى التحقق من تنسيق الملف.",
        variant: "destructive",
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Excel export
  const handleExportExcel = () => {
    if (!accounts) return;
    exportAccountsToExcel(accounts);
  };
  
  // Handle template download
  const handleDownloadTemplate = () => {
    getExcelTemplate('accounts');
  };

  // Table columns
  const columns = [
    {
      id: "id",
      header: "رقم الحساب",
      accessorKey: "id",
    },
    {
      id: "name",
      header: "اسم الحساب",
      accessorKey: "name",
      cell: (info: CellInfo) => {
        if (!info.row?.original) {
          return "-";
        }
        
        return (
          <span 
            className="cursor-pointer text-primary hover:text-primary/80 hover:underline"
            onClick={() => handleViewAccount(info.row.original)}
          >
            {info.row.original.name}
          </span>
        );
      }
    },
    {
      id: "type",
      header: "طبيعة الحساب",
      accessorKey: "type",
      cell: (info: CellInfo) => {
        const types: Record<string, { label: string, className: string }> = {
          customer: { label: "عميل", className: "bg-green-100 text-green-800" },
          supplier: { label: "مورد", className: "bg-blue-100 text-blue-800" },
          expense: { label: "مصروف", className: "bg-red-100 text-red-800" },
          income: { label: "إيراد", className: "bg-purple-100 text-purple-800" },
          bank: { label: "بنك", className: "bg-yellow-100 text-yellow-800" },
          cash: { label: "صندوق", className: "bg-gray-100 text-gray-800" },
        };
        
        // Check if info.row.original exists before accessing its properties
        if (!info.row?.original) {
          return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">-</span>;
        }
        
        const accountType = info.row.original.type;
        const typeInfo = types[accountType] || { label: accountType, className: "bg-gray-100 text-gray-800" };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeInfo.className}`}>
            {typeInfo.label}
          </span>
        );
      }
    },
    {
      id: "category",
      header: "التصنيف",
      accessorKey: "category",
    },
    {
      id: "debit",
      header: "الرصيد الحالي (عليه - مدين)",
      accessorKey: "currentBalance",
      cell: (info: CellInfo) => {
        // Check if info.row.original exists
        if (!info.row?.original) {
          return "0";
        }
        
        const balance = info.row.original.currentBalance;
        return balance > 0 ? formatCurrency(balance) : "0";
      }
    },
    {
      id: "credit",
      header: "الرصيد الحالي (له - دائن)",
      accessorKey: "currentBalance",
      cell: (info: CellInfo) => {
        // Check if info.row.original exists
        if (!info.row?.original) {
          return "0";
        }
        
        const balance = info.row.original.currentBalance;
        return balance < 0 ? formatCurrency(Math.abs(balance)) : "0";
      }
    },
    {
      id: "actions",
      header: "العمليات",
      accessorKey: "id",
      cell: (info: CellInfo) => {
        // Check if info.row.original exists
        if (!info.row?.original) {
          return null;
        }
        
        return (
          <div className="flex space-x-1 space-x-reverse">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
              onClick={() => handleViewAccount(info.row.original)}
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
              onClick={() => {
                setAccountToEdit(info.row.original);
                setIsAccountFormOpen(true);
              }}
            >
              <Pencil className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-600 hover:text-red-900 hover:bg-red-50"
              onClick={() => deleteAccountMutation.mutate([info.row.original.id])}
            >
              <Trash className="h-5 w-5" />
            </Button>
          </div>
        );
      }
    }
  ];

  // Calculate totals
  const totals = accounts.reduce((acc: { debit: number; credit: number; count: number }, account: Account) => {
    if (account.currentBalance > 0) {
      acc.debit += account.currentBalance;
    } else {
      acc.credit += Math.abs(account.currentBalance);
    }
    return acc;
  }, { debit: 0, credit: 0, count: accounts.length });

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">الحسابات</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          {/* Excel Operations */}
          <div className="flex items-center space-x-2 space-x-reverse ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="flex items-center"
            >
              <FileDown className="h-4 w-4 ml-1" />
              <span>تحميل القالب</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 ml-1" />
              <span>استيراد من Excel</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center"
            >
              <Download className="h-4 w-4 ml-1" />
              <span>تصدير إلى Excel</span>
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
            />
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ml-1" />
            <span>تحديث</span>
          </Button>

          <Button 
            variant="default" 
            className="bg-green-500 hover:bg-green-600"
            onClick={() => {
              setAccountToEdit(null);
              setIsAccountFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5 ml-1" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="بحث في الحسابات..."
                className="pl-4 pr-10"
              />
            </div>
          </div>

          <DataTable
            data={accounts}
            columns={columns}
            searchable={true}
            selectable={true}
            isLoading={isLoading}
            actions={{
              onRefresh: () => refetch(),
              onDelete: (ids) => deleteAccountMutation.mutate(ids),
              onAdd: () => {}, // Placeholder for add action
              onExport: () => {}, // Placeholder for export action
            }}
            totals={{
              debit: totals.debit,
              credit: totals.credit,
              count: totals.count
            }}
            emptyMessage="لا توجد حسابات للعرض"
          />
        </div>
      </div>

      {/* Account Form Dialog */}
      <AccountForm 
        isOpen={isAccountFormOpen} 
        onClose={() => setIsAccountFormOpen(false)} 
        accountToEdit={accountToEdit} 
        defaultType={accountType}
      />

      {/* Account Details Dialog */}
      {selectedAccount && (
        <AccountDetailsDialog
          isOpen={isAccountDetailsOpen}
          onClose={() => setIsAccountDetailsOpen(false)}
          account={selectedAccount}
        />
      )}
    </div>
  );
}
