import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Store, Heart, ShoppingCart, User, Package, MapPin, LogIn, UserPlus, LogOut } from 'lucide-react';
import Dock from './Dock/Dock';
import { useCart } from '../context/CartContext';
import { logout } from '../lib/api';

// Routes where the dock would sit on top of a page's own primary action.
const HIDDEN_ON = ['/checkout'];

const glyph = (Icon) => <Icon size="1em" strokeWidth={2} />;

// Any open modal: Radix dialogs (portalled to <body>) and in-page sheets marked aria-modal.
// Page modals live inside <main class="z-10">, so no z-index can lift them above the
// dock. Instead the dock steps aside while one is open.
const MODAL_SELECTOR = '[aria-modal="true"], [role="dialog"][data-state="open"], [role="alertdialog"]';

function useModalOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      setOpen(!!document.querySelector(MODAL_SELECTOR));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal', 'data-state', 'role'],
    });
    check();
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return open;
}

/**
 * Mobile / tablet bottom navigation (hidden at lg and up, where the header nav takes over).
 * Only the essentials: Home, Shop, Wishlist, Cart, Account.
 * Long-press (or right-click) Account for Orders / Addresses / Sign out.
 */
export default function MobileDock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cart, wishlist } = useCart();
  const modalOpen = useModalOpen();

  if (HIDDEN_ON.includes(pathname)) return null;

  const signedIn = !!localStorage.getItem('token');
  const isShop = pathname === '/shop' || pathname.startsWith('/categories/') || pathname.startsWith('/product');
  const isAccount = ['/orders', '/addresses', '/login', '/register'].includes(pathname);

  const item = ({ current, ...rest }) => ({
    ...rest,
    active: current,
    current,
    className: current ? 'dock-item--current' : undefined,
  });

  const items = [
    item({ icon: glyph(Home), label: 'Home', current: pathname === '/', onClick: () => navigate('/') }),
    item({ icon: glyph(Store), label: 'Shop', current: isShop, onClick: () => navigate('/shop') }),
    item({
      icon: glyph(Heart),
      label: 'Wishlist',
      current: pathname === '/wishlist',
      badge: wishlist.length > 0 ? wishlist.length : undefined,
      onClick: () => navigate('/wishlist'),
    }),
    item({
      icon: glyph(ShoppingCart),
      label: 'Cart',
      current: pathname === '/cart',
      badge: cart.length > 0 ? cart.length : undefined,
      onClick: () => navigate('/cart'),
    }),
    item({
      icon: glyph(User),
      label: signedIn ? 'Account' : 'Sign In',
      current: isAccount,
      onClick: () => navigate(signedIn ? '/orders' : '/login'),
      menu: signedIn
        ? [
            { label: 'My Orders', icon: glyph(Package), onClick: () => navigate('/orders') },
            { label: 'My Addresses', icon: glyph(MapPin), onClick: () => navigate('/addresses') },
            { separator: true },
            { label: 'Sign Out', icon: glyph(LogOut), onClick: () => logout() },
          ]
        : [
            { label: 'Sign In', icon: glyph(LogIn), onClick: () => navigate('/login') },
            { label: 'Create Account', icon: glyph(UserPlus), onClick: () => navigate('/register') },
          ],
    }),
  ];

  return (
    <nav
      aria-label="Primary"
      aria-hidden={modalOpen || undefined}
      inert={modalOpen || undefined}
      className={`lg:hidden fixed inset-x-0 z-[90] h-24 pointer-events-none transition-[opacity,transform] duration-300 ease-soft ${
        modalOpen ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'
      }`}
      style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Dock
        items={items}
        theme="brand"
        baseItemSize={46}
        magnification={58}
        distance={120}
        panelHeight={60}
        gap={10}
        roundness={0.55}
        accentColor="#A50D5A"
        badgeColor="#C21A75"
        style={{ pointerEvents: modalOpen ? 'none' : 'auto' }}
      />
    </nav>
  );
}
