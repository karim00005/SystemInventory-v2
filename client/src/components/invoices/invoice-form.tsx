import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getFullApiUrl } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash, Plus, Calculator } from "lucide-react";

// Define schema for form validation
const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "رقم الفاتورة مطلوب" }),
  accountId: z.number({ required_error: "اختيار العميل مطلوب" }),
  warehouseId: z.number({ required_error: "اختيار المخزن مطلوب" }),
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
  dueDate: z.string().optional(),
  status: z.string().default("paid"),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  discountAmount: z.number().min(0, { message: "مبلغ الخصم يجب أن يكون 0 أو أكبر" }).default(0),
  taxRate: z.number().min(0, { message: "نسبة الضريبة يجب أن تكون 0 أو أكبر" }).default(0),
});

// Define item schema
const invoiceItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(0.01, { message: "الكمية يجب أن تكون أكبر من 0" }),
  unitPrice: z.number().min(0, { message: "السعر يجب أن يكون 0 أو أكبر" }),
  discount: z.number().min(0, { message: "الخصم يجب أن يكون 0 أو أكبر" }).default(0),
  tax: z.number().min(0, { message: "الضريبة يجب أن تكون 0 أو أكبر" }).default(0),
  total: z.number().min(0, { message: "الإجمالي يجب أن يكون 0 أو أكبر" }),
});

// Define the form values type
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
type InvoiceItem = z.infer<typeof invoiceItemSchema>;

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: any; // Optional invoice to edit
  invoiceType?: string; // sales, purchase, etc.
}

// Add this type definition for products at the top of the file, near other type definitions
interface Product {
  id: number;
  name: string;
  sellPrice1?: number;
  costPrice?: number;
  [key: string]: any; // Allow other properties
}

// Add this interface for warehouses
interface Warehouse {
  id: number;
  name: string;
  isDefault?: boolean;
  [key: string]: any; // Allow other properties
}

export default function InvoiceForm({ isOpen, onClose, invoiceToEdit, invoiceType = "sales" }: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemTax, setItemTax] = useState(0);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  });
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch customers/suppliers for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ['/api/accounts', invoiceType === 'sales' ? 'customer' : 'supplier'],
    queryFn: async () => {
      const type = invoiceType === 'sales' ? 'customer' : 'supplier';
      return apiRequest(`/api/accounts?type=${type}`, "GET");
    }
  });

  // Fetch warehouses for dropdown
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
    queryFn: () => apiRequest('/api/warehouses', 'GET'),
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products', 'GET'),
  });

  // Use react-hook-form with zod validation
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `${invoiceType === 'sales' ? 'INV' : 'PUR'}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().substring(0, 10),
      dueDate: new Date().toISOString().substring(0, 10), // Set dueDate to today by default
      status: "posted", // default status: posted for both sales and purchases to affect inventory
      discountAmount: 0,
      taxRate: 0,
    },
  });

  // Set default warehouse when warehouses are loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !form.getValues('warehouseId')) {
      // Find default warehouse or use the first one
      const defaultWarehouse = warehouses.find(w => w.isDefault) || warehouses[0];
      if (defaultWarehouse) {
        form.setValue('warehouseId', defaultWarehouse.id);
      }
    }
  }, [warehouses, form]);

  // Filter accounts based on search term
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (!accountSearchTerm.trim()) {
        setFilteredAccounts(accounts);
      } else {
        const filtered = accounts.filter((account: any) => 
          account.name.toLowerCase().includes(accountSearchTerm.toLowerCase())
        );
        setFilteredAccounts(filtered);
      }
    } else {
      setFilteredAccounts([]);
    }
  }, [accounts, accountSearchTerm]);

  // Filter products based on search term
  useEffect(() => {
    if (products && products.length > 0) {
      if (!productSearchTerm.trim()) {
        setFilteredProducts(products);
      } else {
        const filtered = products.filter((product: Product) => 
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
      }
    } else {
      setFilteredProducts([]);
    }
  }, [products, productSearchTerm]);

  // Calculate totals whenever items change or discountAmount/taxRate changes
  useEffect(() => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const itemsDiscount = invoiceItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const invoiceDiscount = form.watch('discountAmount') || 0;
    const totalDiscount = itemsDiscount + invoiceDiscount;
    
    const itemsTax = invoiceItems.reduce((sum, item) => sum + (item.tax || 0), 0);
    const invoiceTaxRate = form.watch('taxRate') || 0;
    const invoiceTaxAmount = ((subtotal - totalDiscount) * invoiceTaxRate) / 100;
    const totalTax = itemsTax + invoiceTaxAmount;
    
    const total = subtotal - totalDiscount + totalTax;

    setTotals({
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total,
    });
  }, [invoiceItems, form.watch('discountAmount'), form.watch('taxRate')]);

  // Update form values when editing an invoice
  useEffect(() => {
    if (invoiceToEdit) {
      form.reset({
        invoiceNumber: invoiceToEdit.invoiceNumber,
        accountId: invoiceToEdit.accountId,
        warehouseId: invoiceToEdit.warehouseId,
        date: invoiceToEdit.date ? new Date(invoiceToEdit.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        dueDate: invoiceToEdit.dueDate ? new Date(invoiceToEdit.dueDate).toISOString().substring(0, 10) : undefined,
        status: invoiceToEdit.status || "paid",
        notes: invoiceToEdit.notes || "",
        paymentTerms: invoiceToEdit.paymentTerms || "",
        discountAmount: invoiceToEdit.discountAmount || 0,
        taxRate: invoiceToEdit.taxRate || 0,
      });

      if (invoiceToEdit.details) {
        setInvoiceItems(invoiceToEdit.details);
      }
      
      // Set account search term if account exists
      if (invoiceToEdit.accountId) {
        const account = accounts.find((a: any) => a.id === invoiceToEdit.accountId);
        if (account) {
          setAccountSearchTerm(account.name);
        }
      }
    }
  }, [invoiceToEdit, form, accounts]);

  // Add item to invoice
  const addItem = () => {
    if (!selectedProduct) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار منتج",
        variant: "destructive",
      });
      return;
    }

    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;

    const itemSubtotal = quantity * unitPrice;
    const total = itemSubtotal - itemDiscount + itemTax;
    
    const newItem: InvoiceItem = {
      productId: selectedProduct,
      quantity,
      unitPrice,
      discount: itemDiscount,
      tax: itemTax,
      total,
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setItemDiscount(0);
    setItemTax(0);
  };

  // Remove item from invoice
  const removeItem = (index: number) => {
    const updatedItems = [...invoiceItems];
    updatedItems.splice(index, 1);
    setInvoiceItems(updatedItems);
  };

  // Create/Update invoice mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = invoiceToEdit ? `/api/invoices/${invoiceToEdit.id}` : '/api/invoices';
      console.log(`Making ${invoiceToEdit ? 'PATCH' : 'POST'} request to ${endpoint}`, JSON.stringify(data).slice(0, 200) + '...');
      
      try {
        // Create a fresh copy of the data
        const requestData = {
          invoice: {
            ...data.invoice,
            // Keep date as string in YYYY-MM-DD format
            date: data.invoice.date,
            dueDate: data.invoice.dueDate,
            // Ensure numeric values
            accountId: Number(data.invoice.accountId),
            warehouseId: Number(data.invoice.warehouseId),
            discountAmount: Number(data.invoice.discountAmount || 0),
            taxRate: Number(data.invoice.taxRate || 0),
            subtotal: Number(data.invoice.subtotal),
            discount: Number(data.invoice.discount || 0),
            tax: Number(data.invoice.tax || 0),
            total: Number(data.invoice.total)
          },
          details: data.details.map(item => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
            tax: Number(item.tax || 0),
            total: Number(item.total)
          }))
        };

        console.log("SIMPLIFIED DATA BEING SENT:", JSON.stringify(requestData, null, 2));

        const response = await fetch(endpoint, {
          method: invoiceToEdit ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include',
        });

        // Log the entire response for debugging
        console.log('Response status:', response.status);
        
        // Get response text first for debugging
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (!response.ok) {
          console.error('API Error Response:', responseText);
          // Try to parse error message if possible
          let errorMessage = `Error: ${response.status} ${response.statusText || 'Unknown error'}`;
          try {
            const errorData = JSON.parse(responseText);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            // If parsing fails, use the original error
          }
          throw new Error(errorMessage);
        }

        // Parse the responseText as JSON if not empty
        if (responseText) {
          return JSON.parse(responseText);
        } else {
          return { success: true };
        }
      } catch (err) {
        console.error('Network or parsing error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      // Show success toast
      toast({
        title: invoiceToEdit ? "تم تحديث الفاتورة" : "تم إنشاء الفاتورة",
        description: invoiceToEdit ? "تم تحديث بيانات الفاتورة بنجاح" : "تم إنشاء الفاتورة بنجاح",
      });
      
      // Close the dialog
      onClose();
    },
    onError: (error: Error) => {
      console.error("Error saving invoice:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ الفاتورة. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  // Delete invoice function
  const deleteInvoice = async () => {
    if (!invoiceToEdit || !invoiceToEdit.id) return;
    
    if (!window.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/invoices/${invoiceToEdit.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error("Delete error response:", text);
        throw new Error(`Error deleting invoice: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: "تم حذف الفاتورة",
        description: "تم حذف الفاتورة بنجاح",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      onClose();
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "خطأ في حذف الفاتورة",
        description: error.message || "حدث خطأ أثناء حذف الفاتورة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get errors setter from form
  const { formState: { errors }, setError } = form;

  // Helper function to generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = invoiceType === 'sales' ? 'INV' : 'PUR';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };

  // Form submission handler
  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    if (invoiceItems.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة منتج واحد على الأقل",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Validate quantities
    const invalidItems = invoiceItems.filter(item => !item.quantity || item.quantity <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "خطأ في الكميات",
        description: "يجب أن تكون جميع الكميات أكبر من صفر",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Always use "posted" status to ensure inventory is affected
    const invoiceStatus = "posted";
    
    // Additional validation for 'posted' status in both sales and purchases
    // Check if account is selected
    if (!values.accountId) {
      toast({
        title: "خطأ في البيانات",
        description: `يجب اختيار ${invoiceType === "sales" ? "العميل" : "المورد"} لترحيل الفاتورة`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Check if warehouse is selected
    if (!values.warehouseId) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب اختيار المخزن لترحيل الفاتورة",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Confirm inventory impact for both sales and purchases if it's a new invoice
    if (!invoiceToEdit) {
      const action = invoiceType === 'sales' ? 'نقص' : 'زيادة';
      const confirmed = window.confirm(
        `سيؤدي ترحيل الفاتورة إلى ${action} المخزون وتسجيل معاملة مالية. هل أنت متأكد من رغبتك في ترحيل الفاتورة؟`
      );
      
      if (!confirmed) {
        // User cancelled, keep the form open
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      // Prepare the invoice data with totals and ensure status is "posted"
      const invoiceData = {
        ...values,
        invoiceNumber: values.invoiceNumber || generateInvoiceNumber(),
        date: values.date || new Date().toISOString().split('T')[0],
        accountId: Number(values.accountId),
        warehouseId: Number(values.warehouseId),
        taxRate: Number(values.taxRate || 0),
        discountAmount: Number(values.discountAmount || 0),
        status: invoiceStatus, // Always use "posted" status
        // Include totals calculated from items
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total
      };
      
      // Prepare details with proper number conversions
      const details = invoiceItems.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
        total: Number(item.total)
      }));
      
      // Format data to match the API expectation
      const requestData = {
        invoice: invoiceData,
        details: details
      };
      
      let result;
      
      if (invoiceToEdit) {
        // Update existing invoice
        result = await mutation.mutateAsync(requestData);
      } else {
        // Create new invoice
        result = await mutation.mutateAsync(requestData);
      }
      
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
        
        // Show a more detailed toast message based on status
        const statusMessage = values.status === 'posted' 
          ? ' وتم تحديث المخزون والسجلات المالية' 
          : '';
          
        toast({
          title: invoiceToEdit ? "تم تحديث الفاتورة" : "تم إنشاء الفاتورة",
          description: `تم ${invoiceToEdit ? 'تحديث' : 'إنشاء'} الفاتورة بنجاح${statusMessage}.`,
        });
        
        onClose();
      }
    } catch (error) {
      console.error('Invoice submission error:', error);
      
      // Provide more detailed error messages
      let errorMessage = "حدث خطأ أثناء حفظ الفاتورة. الرجاء المحاولة مرة أخرى.";
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('inventory')) {
          errorMessage = "حدث خطأ أثناء تحديث المخزون. تأكد من توفر الكميات المناسبة.";
        } else if (error.message.includes('account')) {
          errorMessage = "حدث خطأ في معالجة بيانات الحساب. تأكد من اختيار الحساب الصحيح.";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "يبدو أن رقم الفاتورة مستخدم بالفعل. الرجاء استخدام رقم آخر.";
        }
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle product selection and update unit price
  const handleProductChange = (productId: string) => {
    const id = parseInt(productId);
    setSelectedProduct(id);
    
    const product = products.find((p: any) => p.id === id);
    if (product) {
      setUnitPrice(product.sellPrice1 || 0);
    }
  };

  // Get product name by ID
  const getProductName = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    return product ? product.name : "";
  };

  // Calculate total for an item when quantity or price changes
  const calculateItemTotal = (quantity: number, price: number) => {
    return quantity * price;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {invoiceToEdit 
              ? "تعديل فاتورة" 
              : invoiceType === "sales" 
                ? "إنشاء فاتورة مبيعات جديدة" 
                : "إنشاء فاتورة مشتريات جديدة"
            }
          </DialogTitle>
          <DialogDescription>
            {invoiceToEdit 
              ? "قم بتعديل بيانات الفاتورة والمنتجات ثم اضغط على حفظ" 
              : "أدخل بيانات الفاتورة والمنتجات ثم اضغط على حفظ"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice Number */}
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الفاتورة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الفاتورة</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الاستحقاق</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || form.watch('date')}
                        onChange={(e) => {
                          field.onChange(e.target.value || form.watch('date'));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount Amount */}
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ الخصم</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax Rate */}
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نسبة الضريبة (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.01" 
                        {...field} 
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Customer/Supplier with Search */}
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{invoiceType === "sales" ? "العميل" : "المورد"}</FormLabel>
                    <div className="relative">
                      <Input
                        placeholder={`ابحث عن ${invoiceType === "sales" ? "العميل" : "المورد"}...`}
                        value={accountSearchTerm}
                        onChange={(e) => setAccountSearchTerm(e.target.value)}
                        className="mb-1"
                      />
                      {accountSearchTerm.length > 0 && (
                        <div className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 w-full overflow-y-auto">
                          {filteredAccounts.length > 0 ? (
                            filteredAccounts.map((account: any) => (
                              <div
                                key={account.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  field.onChange(account.id);
                                  setAccountSearchTerm(account.name);
                                }}
                              >
                                {account.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-gray-500">لا توجد نتائج</div>
                          )}
                        </div>
                      )}
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          const selectedAccount = accounts.find((a: any) => a.id === parseInt(value));
                          if (selectedAccount) {
                            setAccountSearchTerm(selectedAccount.name);
                          }
                        }}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={invoiceType === "sales" ? "اختر العميل" : "اختر المورد"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredAccounts.map((account: any) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warehouse */}
              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المخزن</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المخزن" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Selection */}
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-3">إضافة منتجات</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                <div className="md:col-span-5">
                  <Select onValueChange={handleProductChange} value={selectedProduct?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر منتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="الكمية"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="السعر"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    readOnly
                    value={calculateItemTotal(quantity, unitPrice)}
                    className="bg-gray-100"
                  />
                </div>

                <div className="md:col-span-1">
                  <Button
                    type="button"
                    className="w-full h-full"
                    onClick={addItem}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead className="text-center">الكمية</TableHead>
                      <TableHead className="text-center">السعر</TableHead>
                      <TableHead className="text-center">الإجمالي</TableHead>
                      <TableHead className="w-[70px] text-center">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          لا توجد منتجات في الفاتورة. الرجاء إضافة منتجات.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{getProductName(item.productId)}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-medium">{totals.subtotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">الخصم:</span>
                    <span className="font-medium">{totals.discount.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">الضريبة:</span>
                    <span className="font-medium">{totals.tax.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>الإجمالي:</span>
                    <span>{totals.total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {invoiceToEdit && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={deleteInvoice}
                  disabled={isSubmitting}
                >
                  حذف الفاتورة
                </Button>
              )}
              <div className="flex space-x-2 space-x-reverse">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : (
                    invoiceToEdit ? "تحديث الفاتورة" : "حفظ الفاتورة"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 