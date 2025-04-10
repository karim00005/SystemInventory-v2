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
import { Plus, Search, FileText, Printer, Filter, Package2, ArrowUpDown } from "lucide-react";

export default function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  
  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Mock products data for testing
  const mockProducts = [
    { id: 1, code: "P001", name: "بسكويت شاي", category: "مواد غذائية", quantity: 500, price: 10.5, cost: 8.0 },
    { id: 2, code: "P002", name: "شاي العروسة", category: "مواد غذائية", quantity: 300, price: 15.75, cost: 12.0 },
    { id: 3, code: "P003", name: "ارز مصري", category: "مواد غذائية", quantity: 200, price: 25.0, cost: 20.0 },
    { id: 4, code: "P004", name: "زيت عافية", category: "مواد غذائية", quantity: 150, price: 40.0, cost: 35.0 },
    { id: 5, code: "P005", name: "سكر", category: "مواد غذائية", quantity: 400, price: 18.0, cost: 15.0 },
  ];
  
  // Filter products based on search term
  const filteredProducts = mockProducts.filter(product =>
    product.name.includes(searchTerm) || 
    product.code.includes(searchTerm) ||
    product.category.includes(searchTerm)
  );
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-600">البضاعة والمخزون</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="default" className="bg-amber-500 hover:bg-amber-600">
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
                          <TableRow key={product.id} className="hover:bg-gray-50">
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
                              <Badge variant={product.quantity > 0 ? "default" : "destructive"} className="bg-green-100 text-green-800 hover:bg-green-100">
                                متوفر
                              </Badge>
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
    </div>
  );
}