/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppSkeleton from './components/skeletons/AppSkeleton';
import OpsPageSkeleton from './components/skeletons/OpsPageSkeleton';
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
          background: '#B0128F', color: '#fff', fontWeight: 700, fontSize: '0.8rem',
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
// Admin / Staff: a theme-aware fallback that sits inside the portal shell, so
// switching pages never flashes the light storefront skeleton in dark mode.
const LoadableOps = (Component, { standalone = false } = {}) => (props) => (
  <Suspense fallback={<OpsPageSkeleton standalone={standalone} />}>
    <Component {...props} />
  </Suspense>
);

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
// Staff/admin shells are lazy so storefront visitors never download them.
const StaffLayout = LoadableOps(lazy(() => import('./layouts/StaffLayout')), { standalone: true });
const AdminLayout = LoadableOps(lazy(() => import('./layouts/AdminLayout')), { standalone: true });

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
const Policy = Loadable(lazy(() => import('./pages/customer/Policy')));
const About = Loadable(lazy(() => import('./pages/customer/About')));
const WhyChooseUs = Loadable(lazy(() => import('./pages/customer/WhyChooseUs')));
const LocationCity = Loadable(lazy(() => import('./pages/customer/LocationCity')));
const Hampers = Loadable(lazy(() => import('./pages/customer/Hampers')));
const Blog = Loadable(lazy(() => import('./pages/customer/Blog')));
const BlogPost = Loadable(lazy(() => import('./pages/customer/BlogPost')));

// Staff Pages
const StaffDashboard = LoadableOps(lazy(() => import('./pages/staff/Dashboard')));
const StaffOrders = LoadableOps(lazy(() => import('./pages/staff/Orders')));
const StaffInventory = LoadableOps(lazy(() => import('./pages/staff/Inventory')));
const StaffChats = LoadableOps(lazy(() => import('./pages/staff/Chats')));

// Admin Pages
const AdminDashboard = LoadableOps(lazy(() => import('./pages/admin/Dashboard')));
const AdminProducts = LoadableOps(lazy(() => import('./pages/admin/Products')));
const AdminSuperGrains = LoadableOps(lazy(() => import('./pages/admin/SuperGrains')));
const BlogPostsManager = LoadableOps(lazy(() => import('./pages/admin/BlogPosts')));
const AdminHampers = LoadableOps(lazy(() => import('./pages/admin/Hampers')));
const AdminAboutPage = LoadableOps(lazy(() => import('./pages/admin/AboutPage')));
const AdminOrders = LoadableOps(lazy(() => import('./pages/admin/Orders')));
const AdminUsers = LoadableOps(lazy(() => import('./pages/admin/Users')));
const AdminAnalytics = LoadableOps(lazy(() => import('./pages/admin/Analytics')));
const AdminReviews = LoadableOps(lazy(() => import('./pages/admin/Reviews')));
const AdminChats = LoadableOps(lazy(() => import('./pages/admin/Chats')));
const AdminHeroSlides = LoadableOps(lazy(() => import('./pages/admin/HeroSlides')));
const AdminCookiesAnalytics = LoadableOps(lazy(() => import('./pages/admin/CookiesAnalytics')));
const AdminCouponCodes = LoadableOps(lazy(() => import('./pages/admin/CouponCodes')));
const AdminPincodeDelivery = LoadableOps(lazy(() => import('./pages/admin/PincodeDelivery')));
const AdminShippingBoxes = LoadableOps(lazy(() => import('./pages/admin/ShippingBoxes')));
const AdminAppearance = LoadableOps(lazy(() => import('./pages/admin/Appearance')));
const AdminCategories = LoadableOps(lazy(() => import('./pages/admin/Categories')));
const AdminCatalogue = LoadableOps(lazy(() => import('./pages/admin/Catalogue')));
const AdminLeads = LoadableOps(lazy(() => import('./pages/admin/Leads')));
const AdminSubscribers = LoadableOps(lazy(() => import('./pages/admin/Subscribers')));
const AdminSocialLinks = LoadableOps(lazy(() => import('./pages/admin/SocialLinks')));

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
      { path: "about", element: <About /> },
      { path: "our-story", element: <Navigate to="/about#story" replace /> },
      { path: "why-choose-us", element: <WhyChooseUs /> },
      { path: "hampers", element: <Hampers /> },
      { path: "blog", element: <Blog /> },
      { path: "blog/:slug", element: <BlogPost /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <ProtectedRoute allowedRoles={['customer', 'admin']}><Checkout /></ProtectedRoute> },
      { path: "orders", element: <ProtectedRoute allowedRoles={['customer', 'admin']}><OrderTracking /></ProtectedRoute> },
      // Canonical product URL is /products/<slug>; /product/<id> is the legacy
      // form — ProductDetails replaces either with the canonical URL once loaded.
      { path: "products/:id", element: <ProductDetails /> },
      { path: "product/:id", element: <ProductDetails /> },
      { path: "categories/:categorySlug", element: <Shop /> },
      { path: "locations", element: <LocationCity /> },
      { path: "locations/:city", element: <LocationCity /> },
      { path: "wishlist", element: <Wishlist /> },
      { path: "addresses", element: <ProtectedRoute allowedRoles={['customer', 'admin']}><MyAddresses /></ProtectedRoute> },
      { path: "policies", element: <Policy /> },
      { path: "policies/:slug", element: <Policy /> },
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
      { path: "blog", element: <BlogPostsManager /> },
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
      { path: "categories", element: <AdminCategories /> },
      { path: "catalogue", element: <AdminCatalogue /> },
      { path: "leads", element: <AdminLeads /> },
      { path: "subscribers", element: <AdminSubscribers /> },
      { path: "super-grains", element: <AdminSuperGrains /> },
      { path: "hampers", element: <AdminHampers /> },
      { path: "about-page", element: <AdminAboutPage /> },
      { path: "blog", element: <BlogPostsManager /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "users", element: <AdminUsers /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "chats", element: <AdminChats /> },
      { path: "hero-slides", element: <AdminHeroSlides /> },
      { path: "appearance", element: <AdminAppearance /> },
      { path: "social-links", element: <AdminSocialLinks /> },
      { path: 'cookies-analytics', element: <AdminCookiesAnalytics /> },
      { path: 'coupon-codes', element: <AdminCouponCodes /> },
      { path: 'pincode-delivery', element: <AdminPincodeDelivery /> },
      { path: 'shipping-boxes', element: <AdminShippingBoxes /> },
    ],
  },
]);