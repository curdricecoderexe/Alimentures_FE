import { Phone, Mail, MapPin, Copy, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { cityLine, fullAddress, customerName } from '../../lib/customerInfo';

/** Indian mobile → 91XXXXXXXXXX for wa.me links, or null. */
const waNumber = (raw) => {
  const d = String(raw || '').replace(/\D/g, '');
  const ten = d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? `91${ten}` : null;
};

const copy = async (text, what) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error('Could not copy');
  }
};

const Row = ({ icon: Icon, children, action }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-4 w-4 mt-0.5 text-gray-400 dark:text-gray-500 shrink-0" />
    <div className="min-w-0 flex-1 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{children}</div>
    {action}
  </div>
);

const iconBtn = 'shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#E83D6E] hover:bg-gray-50 dark:hover:bg-white/5';

/**
 * Everything staff need to contact and ship to the customer: name, phone
 * (call / WhatsApp), email and the full address with a copy button.
 */
export default function CustomerContact({ order }) {
  const ci = order?.customerInfo || {};
  const wa = waNumber(ci.phone);
  const address = fullAddress(ci);
  const label = [customerName(order), ci.phone, address].filter(Boolean).join('\n');

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-[#24162E] border border-gray-100 dark:border-white/10 rounded-2xl space-y-3">
      <Row icon={User}
        action={<button type="button" className={iconBtn} title="Copy name, phone and address" onClick={() => copy(label, 'Shipping label')}><Copy className="h-3.5 w-3.5" /></button>}>
        {customerName(order)}
      </Row>
      {ci.phone && (
        <Row icon={Phone}
          action={wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={iconBtn} title="Chat on WhatsApp">
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}>
          <a href={`tel:${ci.phone}`} className="hover:text-[#E83D6E]">{ci.phone}</a>
        </Row>
      )}
      {ci.email && (
        <Row icon={Mail}>
          <a href={`mailto:${ci.email}`} className="hover:text-[#E83D6E]">{ci.email}</a>
        </Row>
      )}
      <Row icon={MapPin}
        action={address && <button type="button" className={iconBtn} title="Copy address" onClick={() => copy(address, 'Address')}><Copy className="h-3.5 w-3.5" /></button>}>
        {ci.address ? (
          <>
            <span className="block leading-snug">{ci.address}</span>
            <span className="block text-gray-500 dark:text-gray-400 font-medium mt-0.5">{cityLine(ci)}</span>
          </>
        ) : <span className="text-gray-400">No address on this order</span>}
      </Row>
    </div>
  );
}
