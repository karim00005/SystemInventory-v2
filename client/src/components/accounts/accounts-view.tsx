import { useState } from "react";
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
  Upload 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import AccountForm from "./account-form";

export default function AccountsView() {
  const [accountType, setAccountType] = useState<string | undefined>(undefined);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accounts data
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/accounts', accountType],
    queryFn: async ({ queryKey }) => {
      const url = accountType 
        ? `/api/accounts?type=${accountType}` 
        : `/api/accounts`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل تحميل بيانات الحسابات');
      return res.json();
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await apiRequest('DELETE', `/api/accounts/${id}`);
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
        description: error.message || "حدث خطأ أثناء حذف الحسابات",
        variant: "destructive",
      });
    }
  });

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
    },
    {
      id: "type",
      header: "طبيعة الحساب",
      accessorKey: "type",
      cell: (info: any) => {
        const types: Record<string, { label: string, className: string }> = {
          customer: { label: "عميل", className: "bg-green-100 text-green-800" },
          supplier: { label: "مورد", className: "bg-blue-100 text-blue-800" },
          expense: { label: "مصروف", className: "bg-red-100 text-red-800" },
          income: { label: "إيراد", className: "bg-purple-100 text-purple-800" },
          bank: { label: "بنك", className: "bg-yellow-100 text-yellow-800" },
          cash: { label: "صندوق", className: "bg-gray-100 text-gray-800" },
        };
        
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
      cell: (info: any) => {
        const balance = info.row.original.currentBalance;
        return balance > 0 ? formatCurrency(balance) : "0";
      }
    },
    {
      id: "credit",
      header: "الرصيد الحالي (له - دائن)",
      accessorKey: "currentBalance",
      cell: (info: any) => {
        const balance = info.row.original.currentBalance;
        return balance < 0 ? formatCurrency(Math.abs(balance)) : "0";
      }
    },
    {
      id: "actions",
      header: "العمليات",
      accessorKey: "id",
      cell: (info: any) => (
        <div className="flex space-x-1 space-x-reverse">
          <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50">
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
      )
    }
  ];

  // Calculate totals
  const totals = accounts.reduce((acc, account) => {
    if (account.currentBalance > 0) {
      acc.debit += account.currentBalance;
    } else {
      acc.credit += Math.abs(account.currentBalance);
    }
    return acc;
  }, { debit: 0, credit: 0, count: accounts.length });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">الحسابات</h2>
      
      {/* Search and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        {/* Left Controls */}
        <div className="space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            className="gap-1" 
            onClick={() => refetch()}
          >
            <RefreshCw className="h-5 w-5 ml-1" />
            تحديث
          </Button>
          <Button 
            className="gap-1"
            onClick={() => {
              setAccountToEdit(null);
              setIsAccountFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5 ml-1" />
            جديد
          </Button>
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <select 
            className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={accountType || ""}
            onChange={(e) => setAccountType(e.target.value || undefined)}
          >
            <option value="">جميع الحسابات</option>
            <option value="customer">العملاء</option>
            <option value="supplier">الموردين</option>
            <option value="expense">المصروفات</option>
            <option value="income">الإيرادات</option>
            <option value="bank">البنوك</option>
            <option value="cash">الصناديق</option>
          </select>
        </div>
      </div>
      
      {/* Accounts Table */}
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
      />
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-2 space-x-reverse mt-4">
        <Button 
          variant="outline" 
          className="gap-1"
        >
          <Download className="h-5 w-5 ml-1" />
          تصدير
        </Button>
        <Button 
          variant="destructive" 
          className="gap-1"
          disabled={!accounts.length}
        >
          <Trash className="h-5 w-5 ml-1" />
          حذف
        </Button>
        <Button 
          variant="outline" 
          className="gap-1"
        >
          <Upload className="h-5 w-5 ml-1" />
          استيراد
        </Button>
      </div>

      {/* Account Form Dialog */}
      <AccountForm 
        isOpen={isAccountFormOpen} 
        onClose={() => setIsAccountFormOpen(false)} 
        accountToEdit={accountToEdit} 
        defaultType={accountType}
      />
    </div>
  );
}
