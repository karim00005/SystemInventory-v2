import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, FolderOpen, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function BackupView() {
  const [backupPath, setBackupPath] = useState("D:\\SaHL-Backups\\");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Handle backup process
  const handleBackup = async () => {
    if (!backupPath.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء تحديد مسار لحفظ النسخة الاحتياطية",
        variant: "destructive",
      });
      return;
    }

    setIsBackingUp(true);
    
    try {
      // In a real implementation, this would call an API endpoint to create a backup
      // For simulation, we're just showing a success message after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "تم بنجاح",
        description: "تم حفظ النسخة الاحتياطية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عمل النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary">عمل نسخة احتياطية</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <p className="text-gray-600 mb-6">اختر مجلد (الغرض) لحفظ النسخ الاحتياطية. لا يمكن أن يكون على نفس "Hard Disk" جهازك خوفاً من الانهيار. الضغط لتصفح</p>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="flex-1 bg-gray-100 rounded-md p-2 ml-2">
                {backupPath}
              </div>
              <Button 
                variant="secondary" 
                className="p-2"
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
              <Button 
                variant="secondary" 
                className="p-2 mr-2"
                onClick={() => setBackupPath("")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center">
              <div className="flex-1 bg-gray-100 rounded-md p-2 ml-2"></div>
              <Button 
                variant="secondary" 
                className="p-2"
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="mb-8">
            <Button 
              className="w-full py-6 bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-base"
              onClick={handleBackup}
              disabled={isBackingUp}
            >
              <Database className="h-6 w-6 ml-2" />
              {isBackingUp ? "جاري حفظ النسخة الاحتياطية..." : "احفظ النسخة الاحتياطية"}
            </Button>
          </div>
          
          <h3 className="text-lg font-medium text-green-600 mb-4">كيف تحمي بياناتك الهامة من الفقد</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Mega_logo.svg/1200px-Mega_logo.svg.png" alt="MEGA" className="h-8 mx-auto mb-2" />
              <div className="text-xs text-gray-600">MEGA</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/1101px-Dropbox_Icon.svg.png" alt="Dropbox" className="h-8 mx-auto mb-2" />
              <div className="text-xs text-gray-600">Dropbox</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Google_Drive_logo.png/1200px-Google_Drive_logo.png" alt="Google Drive" className="h-8 mx-auto mb-2" />
              <div className="text-xs text-gray-600">Google Drive</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
