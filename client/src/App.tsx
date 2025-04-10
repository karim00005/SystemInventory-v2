import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "./components/layout/main-layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Finance from "@/pages/finance";
import Settings from "@/pages/settings";
import Backup from "@/pages/backup";
import Restore from "@/pages/restore";
import Import from "@/pages/import";
import Inventory from "@/pages/inventory";
import Invoices from "@/pages/invoices";
import Reports from "@/pages/reports";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppContext } from "./context/app-context";

function App() {
  // Check auth status on load
  const { setUser, setAuthenticated } = useAppContext();
  
  const { data: authData } = useQuery({ 
    queryKey: ['/api/auth/status'],
  });

  useEffect(() => {
    if (authData) {
      setAuthenticated(authData.authenticated || false);
      setUser(authData.user || null);
    }
  }, [authData, setAuthenticated, setUser]);

  return (
    <>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/finance" component={Finance} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/reports" component={Reports} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/settings" component={Settings} />
          <Route path="/backup" component={Backup} />
          <Route path="/restore" component={Restore} />
          <Route path="/import" component={Import} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
      <Toaster />
    </>
  );
}

export default App;
