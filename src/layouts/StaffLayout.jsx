import { LayoutDashboard, ShoppingBag, Package, MessageSquare, Newspaper } from 'lucide-react';
import OpsShell from '../components/admin/OpsShell';

export default function StaffLayout() {
  const navItems = [
    { path: '/staff', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/staff/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/staff/inventory', label: 'Inventory', icon: Package },
    { path: '/staff/chats', label: 'Support Desk', icon: MessageSquare },
    { path: '/staff/blog', label: 'Journal (Blog)', icon: Newspaper },
  ];

  return (
    <OpsShell
      groups={[{ title: 'Operations', items: navItems }]}
      portal="Staff portal"
      account={{ name: 'Operations Team', role: 'Terminal 01' }}
      syncHtmlDark
    />
  );
}
