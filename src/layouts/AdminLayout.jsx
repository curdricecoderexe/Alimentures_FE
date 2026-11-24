import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Star, MessageSquare,
  Image as ImageIcon, Share2, Leaf, Cookie, Tag, MapPin, Boxes, Palette, Layers,
  BookOpen, Contact, Mail, Newspaper, Gift, Info,
} from 'lucide-react';
import OpsShell from '../components/admin/OpsShell';
import SEO from '../components/SEO';

export default function AdminLayout() {
  const navGroups = [
    {
      title: 'Overview',
      items: [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/admin/cookies-analytics', label: 'Cookies & Events', icon: Cookie },
      ]
    },
    {
      title: 'Storefront',
      items: [
        { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/categories', label: 'Categories', icon: Layers },
        { path: '/admin/catalogue', label: 'Catalogue', icon: BookOpen },
        { path: '/admin/super-grains', label: 'Super Grains', icon: Leaf },
        { path: '/admin/hampers', label: 'Gift Hampers', icon: Gift },
        { path: '/admin/coupon-codes', label: 'Coupons', icon: Tag },
        { path: '/admin/pincode-delivery', label: 'PIN Code Delivery', icon: MapPin },
        { path: '/admin/shipping-boxes', label: 'Shipping & Boxes', icon: Boxes },
      ]
    },
    {
      title: 'Community & Content',
      items: [
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/leads', label: 'Leads', icon: Contact },
        { path: '/admin/subscribers', label: 'Subscribers', icon: Mail },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
        { path: '/admin/chats', label: 'Chats', icon: MessageSquare },
        { path: '/admin/about-page', label: 'About Page', icon: Info },
        { path: '/admin/blog', label: 'Journal (Blog)', icon: Newspaper },
        { path: '/admin/hero-slides', label: 'Hero Banners', icon: ImageIcon },
        { path: '/admin/appearance', label: 'Templates', icon: Palette },
      ]
    },
    {
      title: 'Site Settings',
      items: [
        { path: '/admin/social-links', label: 'Social Links', icon: Share2 },
      ]
    }
  ];

  return (
    <>
      <SEO title="Admin Dashboard" noindex={true} />
      <OpsShell groups={navGroups} portal="Management hub" syncHtmlDark />
    </>
  );
}
