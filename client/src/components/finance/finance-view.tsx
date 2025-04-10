import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Trash, 
  Share, 
  Printer, 
  Plus, 
  Save
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface FinanceFormData {
  accountId: number;
  amount: number;
  type: string;
  reference: string;
  date: string;
  time: string;
  paymentMethod: string;
  bankId?: number;
  notes?: string;
  documentType?: string;
  issuePrint: boolean;
  closeAfterSave: boolean;
  createNew: boolean;
}

export default function FinanceView() {
  const [transactionType, setTransactionType] = useState<'receipt' | 'payment'>('receipt');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize form
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FinanceFormData>({
    defaultValues: {
      amount: 0,
      type: transactionType === 'receipt' ? 'credit' : 'debit',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      paymentMethod: 'cash',
      issuePrint: false,
      closeAfterSave: true,
      createNew: false,
    }
  });
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: FinanceFormData) => {
      // Combine date and time
      const combinedDate = new Date(`${data.date}T${data.time}`);
      
      // Prepare transaction data
      const transactionData = {
        accountId: data.accountId,
        amount: data.amount,
        type: transactionType === 'receipt' ? 'credit' : 'debit',
        reference: data.reference,
        date: combinedDate.toISOString(),
        paymentMethod: data.paymentMethod,
        bankId: data.bankId,
        notes: data.notes,
        documentType: 'manual_transaction',
      };
      
      const response = await apiRequest('POST', '/api/transactions', transactionData);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم ${transactionType === 'receipt' ? 'إنشاء سند قبض' : 'إنشاء سند صرف'} بنجاح`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      
      const shouldClose = watch('closeAfterSave');
      const shouldCreateNew = watch('createNew');
      
      if (shouldCreateNew) {
        // Reset form but keep some fields
        reset({
          amount: 0,
          type: transactionType === 'receipt' ? 'credit' : 'debit',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          paymentMethod: watch('paymentMethod'),
          bankId: watch('bankId'),
          issuePrint: watch('issuePrint'),
          closeAfterSave: watch('closeAfterSave'),
          createNew: watch('createNew'),
        });
      } else if (shouldClose) {
        // In a real app, this would close the form or navigate away
        console.log("Would close form");
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || `فشل ${transactionType === 'receipt' ? 'إنشاء سند قبض' : 'إنشاء سند صرف'}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: FinanceFormData) => {
    createTransactionMutation.mutate(data);
  };
  
  // Switch between receipt and payment
  const switchTransactionType = (type: 'receipt' | 'payment') => {
    setTransactionType(type);
    setValue('type', type === 'receipt' ? 'credit' : 'debit');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">المعاملات المالية</h2>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button 
            variant={transactionType === 'payment' ? 'default' : 'outline'} 
            className="gap-1"
            onClick={() => switchTransactionType('payment')}
          >
            <Plus className="h-5 w-5 ml-1" />
            صرف جديد
          </Button>
          <Button 
            variant={transactionType === 'receipt' ? 'default' : 'outline'} 
            className="gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => switchTransactionType('receipt')}
          >
            <Plus className="h-5 w-5 ml-1" />
            قبض جديد
          </Button>
        </div>
      </div>
      
      {/* Finance Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Amount */}
              <div>
                <Label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
                  المبلغ
                </Label>
                <Input 
                  id="amount"
                  type="number"
                  step="0.01"
                  className="bg-gray-50"
                  {...register('amount', { required: true, min: 0.01 })}
                />
                {errors.amount && <span className="text-red-500 text-xs">الرجاء إدخال مبلغ صحيح</span>}
              </div>
              
              {/* Account */}
              <div>
                <Label htmlFor="accountId" className="block text-gray-700 text-sm font-bold mb-2">
                  الحساب
                </Label>
                <Select onValueChange={(value) => setValue('accountId', parseInt(value))}>
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="اختر الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ورثة هناء</SelectItem>
                    <SelectItem value="2">بنك مصر</SelectItem>
                    <SelectItem value="3">الصندوق</SelectItem>
                  </SelectContent>
                </Select>
                {errors.accountId && <span className="text-red-500 text-xs">الرجاء اختيار حساب</span>}
              </div>
              
              {/* Type */}
              <div>
                <Label htmlFor="documentType" className="block text-gray-700 text-sm font-bold mb-2">
                  بند {transactionType === 'receipt' ? 'الإيراد' : 'المصروف'}
                </Label>
                <Select onValueChange={(value) => setValue('documentType', value)}>
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services">خدمات، دفعات، صيانة، إلخ</SelectItem>
                    <SelectItem value="utilities">فواتير كهرباء، مياه، إلخ</SelectItem>
                    <SelectItem value="salaries">رواتب</SelectItem>
                    <SelectItem value="rent">إيجارات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Bank/Cash */}
              <div>
                <Label htmlFor="paymentMethod" className="block text-gray-700 text-sm font-bold mb-2">
                  الخزينة
                </Label>
                <Select onValueChange={(value) => setValue('paymentMethod', value)}>
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="اختر الخزينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">الصندوق</SelectItem>
                    <SelectItem value="bank">بنك مصر</SelectItem>
                  </SelectContent>
                </Select>
                {watch('paymentMethod') === 'bank' && (
                  <Select 
                    onValueChange={(value) => setValue('bankId', parseInt(value))}
                    className="mt-2"
                  >
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue placeholder="اختر البنك" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">بنك مصر</SelectItem>
                      <SelectItem value="5">البنك الاهلي</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Reference */}
              <div>
                <Label htmlFor="reference" className="block text-gray-700 text-sm font-bold mb-2">
                  المرجع
                </Label>
                <Input 
                  id="reference"
                  className="bg-gray-50"
                  placeholder="رقم الإيصال أو المرجع"
                  {...register('reference')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Date/Time */}
              <div>
                <Label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">
                  التاريخ / الوقت
                </Label>
                <div className="flex space-x-2 space-x-reverse">
                  <Input 
                    id="date"
                    type="date"
                    className="bg-gray-50 w-1/2"
                    {...register('date', { required: true })}
                  />
                  <Input 
                    id="time"
                    type="time"
                    className="bg-gray-50 w-1/2"
                    {...register('time', { required: true })}
                  />
                </div>
                {(errors.date || errors.time) && (
                  <span className="text-red-500 text-xs">الرجاء إدخال التاريخ والوقت</span>
                )}
              </div>
              
              {/* Transaction Number */}
              <div>
                <Label htmlFor="transactionNumber" className="block text-gray-700 text-sm font-bold mb-2">
                  رقم الحركة
                </Label>
                <Input 
                  id="transactionNumber"
                  className="bg-gray-50"
                  value="1523"
                  readOnly
                />
              </div>
            </div>
            
            <div className="mb-6">
              {/* Notes */}
              <Label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
                ملاحظات
              </Label>
              <Textarea 
                id="notes"
                className="bg-gray-50"
                rows={3}
                {...register('notes')}
              />
            </div>
            
            <div className="flex justify-between items-center space-x-2 space-x-reverse pt-4 border-t border-gray-200">
              <div className="flex space-x-4 space-x-reverse">
                <div className="flex items-center">
                  <Checkbox 
                    id="issuePrint" 
                    {...register('issuePrint')}
                  />
                  <Label htmlFor="issuePrint" className="mr-2 text-gray-700">
                    طباعة
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="closeAfterSave" 
                    {...register('closeAfterSave')}
                    defaultChecked
                  />
                  <Label htmlFor="closeAfterSave" className="mr-2 text-gray-700">
                    إغلاق
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="createNew" 
                    {...register('createNew')}
                  />
                  <Label htmlFor="createNew" className="mr-2 text-gray-700">
                    جديد
                  </Label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className={`px-6 py-3 ${transactionType === 'receipt' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                disabled={createTransactionMutation.isPending}
              >
                {transactionType === 'receipt' ? 'قبض' : 'صرف'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <Button 
          variant="outline" 
          className="gap-1"
        >
          <Trash className="h-5 w-5 ml-1" />
          حذف
        </Button>
        <Button 
          variant="outline" 
          className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
        >
          <Share className="h-5 w-5 ml-1" />
          مشاركة
        </Button>
        <Button 
          variant="outline" 
          className="gap-1"
        >
          <Printer className="h-5 w-5 ml-1" />
          طباعة (F4)
        </Button>
        <Button 
          variant="outline" 
          className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
        >
          <Plus className="h-5 w-5 ml-1" />
          جديد (F10)
        </Button>
        <Button 
          className="gap-1"
        >
          <Save className="h-5 w-5 ml-1" />
          حفظ (F9)
        </Button>
      </div>
    </div>
  );
}
