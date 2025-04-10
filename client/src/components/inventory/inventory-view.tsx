import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Printer, Filter, Package2, ArrowUpDown, RefreshCw, Pencil } from "lucide-react";
import ProductForm from "./product-form";

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  
  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch inventory data
  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/inventory'],
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Process data to combine product and inventory information
  const productsWithInventory = products.map(product => {
    const inventory = inventoryData.find(inv => inv.productId === product.id) || {};
    const category = categories.find(cat => cat.id === product.categoryId) || {};
    
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      category: category.name || 'بدون فئة',
      quantity: inventory.quantity || 0,
      price: product.sellPrice1 || 0,
      cost: product.costPrice || 0,
      isActive: product.isActive
    };
  });
  
  // Filter products based on search term
  const filteredProducts = productsWithInventory.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isLoading = productsLoading || inventoryLoading || categoriesLoading;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">البضاعة والمخزون</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="default" 
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => {
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}
          >
            <Plus className="h-5 w-5 ml-1" />
            إضافة صنف
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
            <TabsTrigger 
              value="products"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              الأصناف
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              الفئات
            </TabsTrigger>
            <TabsTrigger 
              value="warehouses"
              className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              المخازن
            </TabsTrigger>
          </TabsList>
          
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="بحث عن المنتجات..."
                    className="pl-4 pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 ml-1" />
                    تصفية
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 ml-1" />
                    تصدير
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 ml-1" />
                    طباعة
                  </Button>
                </div>
              </div>
              
              <TabsContent value="products" className="m-0">
                <div className="rounded-md border">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">الكود</TableHead>
                        <TableHead className="text-right">الصنف</TableHead>
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center">
                            الكمية
                            <ArrowUpDown className="mr-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center">
                            سعر البيع
                            <ArrowUpDown className="mr-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center">
                            التكلفة
                            <ArrowUpDown className="mr-1 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                            <Package2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            لا توجد منتجات للعرض
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product, index) => (
                          <TableRow key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            setProductToEdit(products.find(p => p.id === product.id));
                            setIsProductFormOpen(true);
                          }}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{product.code}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <span className={product.quantity > 200 ? "text-green-600" : "text-red-500"}>
                                {product.quantity}
                              </span>
                            </TableCell>
                            <TableCell>{product.price.toFixed(2)}</TableCell>
                            <TableCell>{product.cost.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1 space-x-reverse">
                                <Badge variant={product.quantity > 0 ? "default" : "destructive"} className="bg-green-100 text-green-800 hover:bg-green-100">
                                  متوفر
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProductToEdit(products.find(p => p.id === product.id));
                                    setIsProductFormOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="categories" className="m-0">
                <div className="min-h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">فئات المنتجات - قيد التطوير</p>
                </div>
              </TabsContent>
              
              <TabsContent value="warehouses" className="m-0">
                <div className="min-h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">المخازن - قيد التطوير</p>
                </div>
              </TabsContent>
            </div>
          </CardContent>
        </Tabs>
      </Card>
      
      {/* Product Form Dialog */}
      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        productToEdit={productToEdit} 
      />
    </div>
  );
}