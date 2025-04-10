import { Switch, Route, useLocation } from "wouter";
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
import Login from "@/pages/login";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAppContext } from "./context/app-context";

function App() {
  const { setUser, setAuthenticated, authenticated } = useAppContext();
  const [, navigate] = useLocation();

  const { data: authData, isLoading } = useQuery({ 
    queryKey: ['/api/auth/status'],
    refetchOnWindowFocus: true,
    retry: 1,
    refetchInterval: 2000,
    onSuccess: (data) => {
      if (data?.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
      } else {
        setAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authenticated');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
  });

  if (isLoading) {
    return null;
  }

  if (!authenticated) {
    return (
      <>
        <Switch>
          <Route path="/login" component={Login} />
          <Route component={Login} />
        </Switch>
        <Toaster />
      </>
    );
  }

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