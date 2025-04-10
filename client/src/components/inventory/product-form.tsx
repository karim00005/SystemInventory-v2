import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema } from "@shared/schema";

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
import { useToast } from "@/hooks/use-toast";

// Extend the schema for validation
const formSchema = insertProductSchema.extend({
  name: z.string().min(2, { message: "يجب أن يكون اسم المنتج على الأقل حرفين" }),
  code: z.string().min(2, { message: "يجب أن يكون الكود على الأقل حرفين" }),
  costPrice: z.number().min(0, { message: "يجب ألا تقل التكلفة عن 0" }),
  sellPrice1: z.number().min(0, { message: "يجب ألا يقل سعر البيع عن 0" }),
});

// Get the form type from the zod schema
type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: any; // Optional product to edit
}

export default function ProductForm({ isOpen, onClose, productToEdit }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Use react-hook-form with zod validation
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      barcode: "",
      categoryId: undefined,
      costPrice: 0,
      sellPrice1: 0,
      sellPrice2: 0,
      sellPrice3: 0,
      sellPrice4: 0,
      unit: "piece",
      description: "",
      minStock: 0,
      isActive: true,
    },
  });

  // Update form values when editing a product
  useEffect(() => {
    if (productToEdit) {
      form.reset({
        name: productToEdit.name,
        code: productToEdit.code,
        barcode: productToEdit.barcode || "",
        categoryId: productToEdit.categoryId,
        costPrice: productToEdit.costPrice,
        sellPrice1: productToEdit.sellPrice1,
        sellPrice2: productToEdit.sellPrice2 || 0,
        sellPrice3: productToEdit.sellPrice3 || 0,
        sellPrice4: productToEdit.sellPrice4 || 0,
        unit: productToEdit.unit || "piece",
        description: productToEdit.description || "",
        minStock: productToEdit.minStock || 0,
        isActive: productToEdit.isActive,
      });
    }
  }, [productToEdit, form]);

  // Create/Update product mutation
  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      if (productToEdit) {
        return apiRequest(`/api/products/${productToEdit.id}`, "PATCH", values);
      } else {
        return apiRequest("/api/products", "POST", values);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      
      // Show success toast
      toast({
        title: productToEdit ? "تم تحديث المنتج" : "تم إضافة المنتج",
        description: productToEdit ? "تم تحديث بيانات المنتج بنجاح" : "تم إضافة المنتج بنجاح",
      });
      
      // Close the dialog
      onClose();
    },
    onError: (error) => {
      console.error("Error saving product:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المنتج. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{productToEdit ? "تعديل منتج" : "إضافة منتج جديد"}</DialogTitle>
          <DialogDescription>
            {productToEdit 
              ? "قم بتعديل بيانات المنتج ثم اضغط على حفظ" 
              : "ادخل بيانات المنتج الجديد ثم اضغط على حفظ"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المنتج</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل اسم المنتج" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كود المنتج</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل كود المنتج" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Barcode */}
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الباركود</FormLabel>
                    <FormControl>
                      <Input placeholder="ادخل رقم الباركود (اختياري)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفئة</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وحدة القياس</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر وحدة القياس" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="piece">قطعة</SelectItem>
                        <SelectItem value="kg">كيلو جرام</SelectItem>
                        <SelectItem value="liter">لتر</SelectItem>
                        <SelectItem value="meter">متر</SelectItem>
                        <SelectItem value="box">علبة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Min Stock */}
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الحد الأدنى للمخزون</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Price */}
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر التكلفة</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sell Price 1 */}
              <FormField
                control={form.control}
                name="sellPrice1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع 1</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="وصف المنتج (اختياري)" 
                        className="h-20" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-6">
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
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}