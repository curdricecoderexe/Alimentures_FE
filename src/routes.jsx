/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppSkeleton from './components/skeletons/AppSkeleton';
import { reportClientError } from './lib/reportError';

// Shown when a route throws (render error, lazy-chunk load failure, etc.)
function RouteError() {
  const error = useRouteError();
  console.error('Route error:', error);
  reportClientError(error instanceof Error ? error : new Error(String(error)), { kind: 'route.error' });
  if (typeof window !== 'undefined' && window.Sentry?.captureException) {
    window.Sentry.captureException(error);
  }
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '16px', padding: '24px', textAlign: 'center',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', background: '#FAF8F5', color: '#1a1a1a',
    }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>This page failed to load</h1>
      <p style={{ maxWidth: '400px', color: '#666', margin: 0 }}>
        Please try again. If a new version was just deployed, a refresh will pick it up.
      </p>
      <button
        onClick={() => window.location.assign('/')}
        style={{
          marginTop: '4px', padding: '12px 26px', borderRadius: '999px', border: 'none',
          background: '#C41E6B', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
        }}
      >
        Back to home
      </button>
    </div>
  );
}

// Helper to wrap lazy components
const Loadable = (Component) => (props) => (
  <Suspense fallback={<AppSkeleton />}>
    <Component {...props} />
  </Suspense>
);

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';
import DeliveryLayout from './layouts/DeliveryLayout';

// Pages
const Login = Loadable(lazy(() => import('./pages/Login')));
const Register = Loadable(lazy(() => import('./pages/Register')));
const ForgotPassword = Loadable(lazy(() => import('./pages/ForgotPassword')));
const ResetPassword = Loadable(lazy(() => import('./pages/ResetPassword')));
const NotFound = Loadable(lazy(() => import('./pages/NotFound')));

// Customer Pages
const CustomerHome = Loadable(lazy(() => import('./pages/customer/Home')));
const Shop = Loadable(lazy(() => import('./pages/customer/Shop')));
const Cart = Loadable(lazy(() => import('./pages/customer/Cart')));
const Checkout = Loadable(lazy(() => import('./pages/customer/Checkout')));
const OrderTracking = Loadable(lazy(() => import('./pages/customer/OrderTracking')));
const ProductDetails = Loadable(lazy(() => import('./pages/customer/ProductDetails')));
const Wishlist = Loadable(lazy(() => import('./pages/customer/Wishlist')));
const MyAddresses = Loadable(lazy(() => import('./pages/customer/MyAddresses')));

// Staff Pages
const StaffDashboard = Loadable(lazy(() => import('./pages/staff/Dashboard')));
const StaffOrders = Loadable(lazy(() => import('./pages/staff/Orders')));
const StaffInventory = Loadable(lazy(() => import('./pages/staff/Inventory')));
const StaffChats = Loadable(lazy(() => import('./pages/staff/Chats')));

// Admin Pages
const AdminDashboard = Loadable(lazy(() => import('./pages/admin/Dashboard')));
const AdminProducts = Loadable(lazy(() => import('./pages/admin/Products')));
const AdminSuperGrains = Loadable(lazy(() => import('./pages/admin/SuperGrains')));
const AdminOrders = Loadable(lazy(() => import('./pages/admin/Orders')));
const AdminUsers = Loadable(lazy(() => import('./pages/admin/Users')));
const AdminAnalytics = Loadable(lazy(() => import('./pages/admin/Analytics')));
const AdminReviews = Loadable(lazy(() => import('./pages/admin/Reviews')));
const AdminChats = Loadable(lazy(() => import('./pages/admin/Chats')));
const AdminHeroSlides = Loadable(lazy(() => import('./pages/admin/HeroSlides')));
const AdminCookiesAnalytics = Loadable(lazy(() => import('./pages/admin/CookiesAnalytics')));
const AdminCouponCodes = Loadable(lazy(() => import('./pages/admin/CouponCodes')));

// Delivery Pages
const DeliveryDashboard = Loadable(lazy(() => import('./pages/delivery/Dashboard')));
const DeliveryOrders = Loadable(lazy(() => import('./pages/delivery/Orders')));

export const router = createBrowserRouter([
  { path: '*', element: <NotFound />, errorElement: <RouteError /> },
  {
    path: "/login",
    element: <Login />,
    errorElement: <RouteError />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <RouteError />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    errorElement: <RouteError />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
    errorElement: <RouteError />,
  },
  // Customer Routes
  {
    path: "/",
    element: <CustomerLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <CustomerHome /> },
      { path: "shop", element: <Shop /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <ProtectedRoute allowedRoles={['customer', 'admin']}><Checkout /></ProtectedRoute> },
      { path: "orders", element: <ProtectedRoute allowedRoles={['customer', 'admin']}><OrderTracking /></ProtectedRoute> },
      { path: "product/:id", element: <ProductDetails /> },
      { path: "wishlist", element: <Wishlist /> },
    ],
  },
  // Staff Routes
  {
    path: "/staff",
    element: <ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <StaffDashboard /> },
      { path: "orders", element: <StaffOrders /> },
      { path: "inventory", element: <StaffInventory /> },
      { path: "chats", element: <StaffChats /> },
    ],
  },
  // Admin Routes
  {
    path: "/admin",
    element: <ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "products", element: <AdminProducts /> },
      { path: "super-grains", element: <AdminSuperGrains /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "users", element: <AdminUsers /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "chats", element: <AdminChats /> },
      { path: "hero-slides", element: <AdminHeroSlides /> },
      { path: 'cookies-analytics', element: <AdminCookiesAnalytics /> },
      { path: 'coupon-codes', element: <AdminCouponCodes /> },
    ],
  },
  // Delivery Routes
  {
    path: "/delivery",
    element: <ProtectedRoute allowedRoles={['delivery']}><DeliveryLayout /></ProtectedRoute>,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DeliveryDashboard /> },
      { path: "orders", element: <DeliveryOrders /> },
    ],
  },
]);