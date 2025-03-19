import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth";
import AdvertiserSignup from "@/pages/advertiser-signup";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/advertiser-signup" component={AdvertiserSignup} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}