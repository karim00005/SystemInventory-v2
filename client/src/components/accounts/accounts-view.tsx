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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface DataTableProps {
  data: any[];
  columns: any[];
  isLoading?: boolean;
}

export default function AccountsView() {
  const [accountType, setAccountType] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
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
          
        const headers = {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        };

        const res = await fetch(url, {
          headers,
          cache: 'no-store',
          credentials: 'include'
        });

        if (!res.ok) {
          throw new Error(`فشل تحميل بيانات الحسابات: ${res.status} ${res.statusText}`);
        }

        // Clone the response before reading
        const resClone = res.clone();
        
        // Read as text first
        const text = await res.text();
        if (!text) {
          return [];
        }

        // Try to parse as JSON
        try {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) {
            console.error('Unexpected response format:', data);
            throw new Error('تنسيق البيانات غير صحيح');
          }
          return data;
        } catch (e) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('خطأ في تحليل البيانات');
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0, // Disable caching
    refetchOnMount: true,
    refetchOnWindowFocus: true
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
        
        const account = info.row.original;
        const balance = account.currentBalance;
        
        // للعملاء: الرصيد الموجب هو مدين (عليه)
        // للموردين: الرصيد السالب هو مدين (عليه)
        if (account.type === 'customer') {
          return balance > 0 ? formatCurrency(balance) : "0";
        } else if (account.type === 'supplier') {
          return balance < 0 ? formatCurrency(Math.abs(balance)) : "0";
        } else {
          return balance > 0 ? formatCurrency(balance) : "0";
        }
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
        
        const account = info.row.original;
        const balance = account.currentBalance;
        
        // للعملاء: الرصيد السالب هو دائن (له)
        // للموردين: الرصيد الموجب هو دائن (له)
        if (account.type === 'customer') {
          return balance < 0 ? formatCurrency(Math.abs(balance)) : "0";
        } else if (account.type === 'supplier') {
          return balance > 0 ? formatCurrency(balance) : "0";
        } else {
          return balance < 0 ? formatCurrency(Math.abs(balance)) : "0";
        }
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

  // Filter accounts based on search query and type
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchQuery === "" || 
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toString().includes(searchQuery);
    
    const matchesType = accountType === "all" || !accountType || account.type === accountType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">الحسابات</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAccountFormOpen(true)}
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة حساب
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
          >
            <FileDown className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4 ml-2" />
            تحميل القالب
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 ml-2" />
            استيراد
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الحساب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={accountType || "all"}
          onValueChange={(value) => setAccountType(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="نوع الحساب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="customer">عميل</SelectItem>
            <SelectItem value="supplier">مورد</SelectItem>
            <SelectItem value="cash">نقدي</SelectItem>
            <SelectItem value="bank">بنك</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredAccounts}
        isLoading={isLoading}
        totals={totals}
        showActions={true}
      />

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
