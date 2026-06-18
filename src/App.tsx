import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { KeyGate } from "@/components/key-gate";
import Home from "@/pages/home";
import Transactions from "@/pages/transactions";
import Redeem from "@/pages/redeem";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { WalletProvider } from "@/hooks/use-wallet-context";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route>
        <KeyGate>
          <Layout>
            <Switch>
              <Route path="/"             component={Home}         />
              <Route path="/transactions" component={Transactions} />
              <Route path="/redeem"       component={Redeem}       />
              <Route                      component={NotFound}     />
            </Switch>
          </Layout>
        </KeyGate>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
            <SonnerToaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                },
              }}
            />
          </TooltipProvider>
        </QueryClientProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
