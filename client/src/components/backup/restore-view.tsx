import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, FolderOpen, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function RestoreView() {
  const [backupPath, setBackupPath] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreData, setRestoreData] = useState(true);
  const [restoreTemplates, setRestoreTemplates] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Handle restore process
  const handleRestore = async () => {
    if (!backupPath.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء تحديد مسار النسخة الاحتياطية",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("تحذير: استرجاع نسخة احتياطية سيحذف جميع البيانات الحالية. هل أنت متأكد من الاستمرار؟")) {
      return;
    }

    setIsRestoring(true);
    
    try {
      // In a real implementation, this would call an API endpoint to restore
      // For simulation, we're just showing a success message after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "تم بنجاح",
        description: "تم استرجاع النسخة الاحتياطية بنجاح",
      });
      
      // In a real app, we would redirect to the login page or dashboard after restore
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استرجاع النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">استرجاع نسخة احتياطية</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="bg-red-100 border-r-4 border-red-500 p-3 mb-6">
            <p className="text-red-800">تحذير هام - استرجاع نسخة احتياطية يقوم بحذف جميع البيانات الحالية واستبدالها</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">لتعرف مكان النسخة الاحتياطية التي ترغب في استرجاعها. اضغط للتصفح</label>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-100 rounded-md p-2 ml-2">
                {backupPath}
              </div>
              <Button 
                variant="secondary" 
                className="p-2"
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="mb-6 space-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="restoreData" 
                checked={restoreData}
                onCheckedChange={(checked) => setRestoreData(checked as boolean)}
              />
              <Label htmlFor="restoreData" className="mr-2 text-gray-700">
                استرجاع البيانات
              </Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="restoreTemplates" 
                checked={restoreTemplates}
                onCheckedChange={(checked) => setRestoreTemplates(checked as boolean)}
              />
              <Label htmlFor="restoreTemplates" className="mr-2 text-gray-700">
                استرجاع نماذج الطباعة
              </Label>
            </div>
          </div>
          
          <div className="mb-8">
            <Button 
              className="w-full py-6 bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-base"
              onClick={handleRestore}
              disabled={isRestoring || !restoreData && !restoreTemplates}
            >
              <Database className="h-6 w-6 ml-2" />
              {isRestoring ? "جاري استرجاع النسخة الاحتياطية..." : "استرجع النسخة الاحتياطية"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
