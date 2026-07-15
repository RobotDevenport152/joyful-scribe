import React, { Suspense } from "react";
import '@/i18n';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicLayout from "@/components/layout/PublicLayout";
import Index from "./pages/Index";

// Lazy-load everything except the home page for fast initial load
const Shop = React.lazy(() => import("./pages/Shop"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const OrderSuccess = React.lazy(() => import("./pages/OrderSuccess"));
const Traceability = React.lazy(() => import("./pages/Traceability"));
const Verify = React.lazy(() => import("./pages/Verify"));
const Contact = React.lazy(() => import("./pages/Contact"));
const GrowersInfo = React.lazy(() => import("./pages/GrowersInfo"));
const ApplyGrower = React.lazy(() => import("./pages/ApplyGrower"));
const Wholesale = React.lazy(() => import("./pages/Wholesale"));
const ChinaLanding = React.lazy(() => import("./pages/ChinaLanding"));
const Compare = React.lazy(() => import("./pages/Compare"));
const Returns = React.lazy(() => import("./pages/Returns"));
const Lookbook = React.lazy(() => import("./pages/Lookbook"));
const Culture = React.lazy(() => import("./pages/Culture"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const WeChatCallback = React.lazy(() => import("./pages/WeChatCallback"));
const MyOrders = React.lazy(() => import("./pages/MyOrders"));
const GrowerBatches = React.lazy(() => import("./pages/GrowerBatches"));
const GrowerCredits = React.lazy(() => import("./pages/GrowerCredits"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Admin routes — loaded separately so they never bloat the customer bundle
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = React.lazy(() => import("./pages/admin/AdminOrders"));
const AdminProducts = React.lazy(() => import("./pages/admin/AdminProducts"));
const AdminGrowers = React.lazy(() => import("./pages/admin/AdminGrowers"));
const AdminFiberBatches = React.lazy(() => import("./pages/admin/AdminFiberBatches"));
const AdminPromos = React.lazy(() => import("./pages/admin/AdminPromos"));
const AdminCertificates = React.lazy(() => import("./pages/admin/AdminCertificates"));
const AdminReviews = React.lazy(() => import("./pages/admin/AdminReviews"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Admin routes — isolated layout, role-gated */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="growers" element={<AdminGrowers />} />
                <Route path="fiber-batches" element={<AdminFiberBatches />} />
                <Route path="certificates" element={<AdminCertificates />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="promos" element={<AdminPromos />} />
              </Route>

              {/* Public + auth-required routes — share Navbar/CartDrawer shell */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/traceability" element={<Traceability />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/verify/:code" element={<Verify />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/growers-info" element={<GrowersInfo />} />
                <Route path="/wholesale" element={<Wholesale />} />
                <Route path="/china" element={<ChinaLanding />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/lookbook" element={<Lookbook />} />
                <Route path="/culture" element={<Culture />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/wechat/callback" element={<WeChatCallback />} />

                {/* Auth-required routes — still get Navbar/CartDrawer shell */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/apply-grower"
                  element={
                    <ProtectedRoute>
                      <ApplyGrower />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grower/batches"
                  element={
                    <ProtectedRoute requiredRole="grower">
                      <GrowerBatches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/grower/credits"
                  element={
                    <ProtectedRoute requiredRole="grower">
                      <GrowerCredits />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
