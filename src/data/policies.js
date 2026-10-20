// Single source of truth for all legal / policy content.
// Rendered as standalone pages by src/pages/customer/Policy.jsx and
// linked from the footer in src/layouts/CustomerLayout.jsx.

const SUPPORT_EMAIL = 'alimentureindustries@gmail.com';
const SUPPORT_LINE = `our customer support team at ${SUPPORT_EMAIL}`;

export const POLICIES = [
  {
    slug: 'privacy-policy',
    key: 'privacy',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    updated: 'October 2026',
    summary: 'What information we collect when you use Alimenture, and how it is used and protected.',
    intro:
      'Alimenture Industries Private Limited ("Alimenture", "we", "us") respects your privacy. This policy explains what information we collect when you use our website or place an order, and how that information is used and protected.',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'When you create an account, place an order, or contact us, we may collect information necessary to process and deliver your order, including:',
        items: [
          'Name and contact details (phone number, email address)',
          'Billing and delivery addresses',
          'Order and purchase history',
          'Payment-related transaction information (handled by our payment provider)',
          'Communications you send to our support team',
        ],
      },
      {
        heading: 'How We Use Your Information',
        body: 'Your information is used only for legitimate business purposes, including to:',
        items: [
          'Process, fulfil, and deliver your orders',
          'Provide customer support and respond to your queries',
          'Process cancellations, returns, and refunds',
          'Send important updates about your orders and account',
          'Improve our products, website, and services',
          'Maintain security and prevent fraud or misuse',
        ],
      },
      {
        heading: 'Payment Information',
        body: 'Payments are processed through PCI-DSS compliant third-party payment gateways. Sensitive payment credentials such as full card details are handled directly by the payment provider and are not stored on Alimenture servers.',
      },
      {
        heading: 'Cookies & Analytics',
        body: 'Our website uses cookies and analytics tools to remember your preferences, keep you signed in, and understand how the site is used so we can improve it. You can manage non-essential cookies through the consent banner or your browser settings.',
      },
      {
        heading: 'Data Sharing & Third-Party Services',
        body: 'We do not sell or rent your personal data. We share information only with service providers who help us operate, and only as much as they need to provide their service, or where the law requires it. These providers are:',
        items: [
          'Payment processors (Razorpay), to process your payment',
          'Our logistics partner, Shiprocket (Bigfoot Retail Solutions Private Limited), and the courier company it assigns. They receive your name, phone number, email address, delivery address, and order contents to ship, deliver, and track your order, and they may send you shipment updates by SMS, email, or WhatsApp',
          'Communication and analytics providers that help us send order emails and improve the website',
        ],
      },
      {
        heading: 'Data Security & Retention',
        body: 'We apply reasonable technical and organisational measures to protect your information against unauthorised access, alteration, or disclosure. Order and transaction records are retained for as long as needed to meet legal, accounting, and operational requirements.',
      },
      {
        heading: 'Your Choices',
        body: 'You may request access to, correction of, or deletion of your personal information, and you may opt out of marketing communications at any time by contacting us. Certain records may be retained where the law requires it.',
      },
      {
        heading: 'Contact Us',
        body: `For any questions about this Privacy Policy or your personal information, please contact ${SUPPORT_LINE}.`,
      },
    ],
  },
  {
    slug: 'terms-of-service',
    key: 'terms',
    name: 'Terms of Service',
    title: 'Terms of Service',
    updated: 'October 2026',
    summary: 'The terms that govern your use of the Alimenture website and your purchases.',
    intro:
      'These Terms of Service govern your use of the Alimenture website and your purchase of products through it. By accessing the website or placing an order, you agree to these terms.',
    sections: [
      {
        heading: 'About Alimenture',
        body: 'The website is operated by Alimenture Industries Private Limited, a Food Business Operator registered under the Food Safety and Standards Act, 2006. All website content, brand names, logos, product formulations, images, and trademarks are the property of Alimenture Industries Private Limited and may not be reproduced without permission.',
      },
      {
        heading: 'Product Information',
        body: 'We make reasonable efforts to ensure that product names, descriptions, images, ingredients, and prices are accurate. Product appearance and packaging may vary slightly from photographs due to production batches, display settings, or updates to our packaging.',
      },
      {
        heading: 'Orders & Acceptance',
        body: 'Every order is an offer to purchase and is subject to acceptance and availability. We may decline or cancel an order in circumstances such as product unavailability, pricing or listing errors, suspected fraud, or payment failure. Where a prepaid order is cancelled by us, the amount paid is refunded.',
      },
      {
        heading: 'Pricing & Payment',
        body: 'All prices are listed in Indian Rupees and include applicable taxes unless stated otherwise. Orders are paid online at checkout; cash on delivery is not offered. Delivery charges, where applicable, are shown at checkout before you confirm your order. You are responsible for providing accurate billing, delivery, and contact details.',
      },
      {
        heading: 'Shipping & Delivery',
        body: 'Orders are delivered through our logistics partner, Shiprocket, and its partner courier companies, as described in our Shipping Policy. We can only accept orders for PIN codes that a courier serves. Delivery dates shown on the website are estimates. Orders that cannot be delivered because of incorrect details or the recipient being unavailable are handled as set out in the Shipping Policy.',
      },
      {
        heading: 'Cancellations, Returns & Refunds',
        body: 'Orders cannot be cancelled once placed, in line with our Cancellation Policy. Returns and refunds are governed by our Returns & Refunds Policy. Because our products are food items, return eligibility is limited as set out in that policy.',
      },
      {
        heading: 'Acceptable Use',
        body: 'You agree not to misuse the website, attempt unauthorised access, disrupt its operation, or use it for any unlawful purpose. We may suspend accounts that violate these terms.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'Our products are intended for personal consumption. Please check ingredients and allergen information before use if you have dietary restrictions or allergies. To the extent permitted by law, our liability for any claim relating to an order is limited to the value of that order.',
      },
      {
        heading: 'Changes & Governing Law',
        body: 'We may update these Terms from time to time; the current version is always published on this page. These Terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts of Chennai, Tamil Nadu.',
      },
    ],
  },
  {
    slug: 'shipping-policy',
    key: 'shipping',
    name: 'Shipping Policy',
    title: 'Shipping Policy',
    updated: 'October 2026',
    summary: 'How orders are dispatched and delivered across India through our logistics partner, Shiprocket.',
    intro:
      'We ship across India through Shiprocket, our logistics partner, which hands each order to one of its courier companies. This policy explains how orders are processed, shipped, tracked, and delivered.',
    sections: [
      {
        heading: 'Our Delivery Partner',
        body: 'Orders are shipped through Shiprocket (operated by Bigfoot Retail Solutions Private Limited), which assigns each shipment to one of its partner courier companies, such as Delhivery, Blue Dart, Xpressbees, Ekart, DTDC, or another courier serving your area. The courier is chosen based on serviceability, delivery speed, and reliability for your PIN code. We cannot guarantee a particular courier company.',
      },
      {
        heading: 'Serviceable Locations',
        body: 'When you enter your delivery PIN code at checkout, we check it against the courier network. If no courier currently serves your PIN code, we cannot accept the order for that address. Deliveries to remote areas, hilly regions, the North-East, Jammu & Kashmir, Ladakh, and island territories may take longer.',
      },
      {
        heading: 'Order Processing & Dispatch',
        body: 'Orders are processed once payment is confirmed. We pack and hand orders over to the courier, usually within 1–2 working days. Orders placed on Sundays or public holidays are processed on the next working day. Payment is online only; we do not offer cash on delivery.',
      },
      {
        heading: 'Delivery Timelines',
        body: 'After dispatch, delivery usually takes 2–7 working days, depending on your location and the courier assigned. The estimate shown at checkout combines our dispatch time with the courier’s transit estimate for your PIN code. It is an estimate, not a guaranteed delivery date. Courier operations, weather, strikes, festivals, regional restrictions, and other events outside our control can cause delays.',
      },
      {
        heading: 'Shipping Charges',
        body: 'Shipping charges, if any, are shown at checkout before you pay. Where free delivery is offered above a minimum order value, it is applied automatically at checkout. We pay the courier’s charges; you are never asked to pay anything to the delivery agent.',
      },
      {
        heading: 'Order Tracking',
        body: 'Once a courier is assigned, your order gets an AWB (tracking) number. You can track the shipment in the following ways:',
        items: [
          'On the "My Orders" page of our website, which shows the courier name, AWB number, and the latest scan updates',
          'Through the Shiprocket tracking link shared with your order',
          'Through SMS, email, or WhatsApp notifications sent by Shiprocket or the courier to the phone number and email address on your order',
        ],
      },
      {
        heading: 'Delivery Attempts & Undelivered Orders',
        body: 'Couriers usually make up to three delivery attempts. Please keep your phone reachable, because the delivery agent may call you before delivering. If the order cannot be delivered (for example, you were unavailable, the address or phone number was incorrect or incomplete, or the delivery was refused), the courier returns it to us. This is called Return to Origin (RTO). For RTO orders:',
        items: [
          'If the RTO happened because of an issue on our side or the courier’s side, we will re-ship the order or refund it in full',
          'Otherwise, once the shipment reaches us, we refund the order value minus the forward and return shipping costs, or re-ship it if you pay the re-delivery charges',
          'Because our products are perishable, an RTO shipment cannot be held for re-delivery indefinitely',
        ],
      },
      {
        heading: 'Address Changes',
        body: `Please check your delivery address, PIN code, and phone number carefully before paying. Address changes are only possible before a courier is assigned. To request one, contact ${SUPPORT_LINE} as soon as possible with your order number. Once a courier is assigned and the AWB is generated, the address cannot be changed.`,
      },
      {
        heading: 'Damaged, Tampered, or Lost Shipments',
        body: `Please check the outer packaging when your order is delivered. If the package looks damaged or tampered with, refuse it or accept it only after the agent records the issue, and contact ${SUPPORT_LINE} within 3 days of delivery with your order number, photographs, and an unboxing video if possible. If the courier confirms a shipment as lost in transit, we will re-ship your order or refund it in full.`,
      },
    ],
  },
  {
    slug: 'returns-refunds',
    key: 'returns',
    name: 'Returns & Refunds',
    title: 'Returns & Refunds Policy',
    updated: 'October 2026',
    summary: 'When returns are accepted for our perishable food products, and how refunds are processed.',
    intro:
      'We take care to ensure every order reaches you in good condition. Because our products are perishable food items, returns are accepted only in specific situations set out below.',
    sections: [
      {
        heading: 'Return Eligibility',
        body: 'A return request may be raised within 3 days of delivery where the product was received damaged, expired, incorrect, or defective. For a return to be considered, the following conditions apply:',
        items: [
          'The product must be in its original condition and packaging',
          'The issue must be reported within 3 days of delivery',
          'Supporting photographs or video of the product and packaging must be provided',
          'Products that have been opened, consumed, or damaged after delivery are not eligible unless they were defective on arrival',
        ],
      },
      {
        heading: 'How to Request a Return',
        body: `Contact ${SUPPORT_LINE} within 3 days of delivery with your order number, the product details, the reason for the return, and photographs or video where requested. Our team will review the request and confirm whether it is approved.`,
      },
      {
        heading: 'Return Pickup',
        body: 'For an approved return, we arrange a reverse pickup through our logistics partner, Shiprocket, at no cost to you. Please hand over the product in its original packaging. If reverse pickup is not available at your PIN code, our team will suggest another option. For damaged or incorrect items, we may issue a replacement or refund based on photographs alone, without asking for a pickup.',
      },
      {
        heading: 'Refunds',
        body: 'Once a return is approved and, where applicable, the product is received and verified, the eligible refund is initiated to the original payment method or to a bank account you register for the refund. Refunds are processed within 7 working days of approval. The time for the amount to reflect in your account depends on your bank or payment provider.',
      },
      {
        heading: 'Undelivered (Return to Origin) Orders',
        body: 'If a shipment is returned to us because it could not be delivered, the refund or re-shipping terms in the "Delivery Attempts & Undelivered Orders" section of our Shipping Policy apply. Shipments lost in transit are re-shipped or refunded in full.',
      },
      {
        heading: 'Damaged or Incorrect Products',
        body: 'If you receive a product that is damaged, incorrect, or appears tampered with, contact us as soon as possible with your order details and supporting photographs. Depending on the case, we will arrange a replacement or a full refund.',
      },
      {
        heading: 'Non-Returnable Situations',
        body: 'Products that have been opened, partially consumed, or damaged due to improper storage or handling after delivery cannot be returned, except where they were defective at the time of delivery.',
      },
    ],
  },
  {
    slug: 'cancellation-policy',
    key: 'cancellation',
    name: 'Cancellation Policy',
    title: 'Cancellation Policy',
    updated: 'October 2026',
    summary: 'Orders cannot be cancelled once placed.',
    intro:
      'Once an order is successfully placed and paid for, it cannot be cancelled — by you or by us. Please review your cart and shipping details carefully before completing payment.',
    sections: [
      {
        heading: 'No Order Cancellation',
        body: 'We do not offer order cancellation at any stage after an order is placed, including before dispatch. If you no longer want a delivered item, you may raise a return request if the product is eligible under our Returns & Refunds Policy.',
      },
      {
        heading: 'Unpaid / Incomplete Checkout Attempts',
        body: 'If a payment attempt is not completed (for example, you close the payment window or the payment fails), no order is placed and nothing is charged. This is not an order cancellation — it simply means the order was never confirmed.',
      },
      {
        heading: 'Orders We Are Unable to Ship',
        body: 'In rare cases we may be unable to ship a paid order, for example if the courier network stops serving your PIN code after the order is placed, or a product becomes unavailable. If that happens, we will contact you and refund the amount paid in full.',
      },
      {
        heading: 'Refused or Undelivered Orders',
        body: 'Refusing a delivery is not a cancellation. Refused or undelivered shipments are returned to us and handled under the "Delivery Attempts & Undelivered Orders" section of our Shipping Policy.',
      },
      {
        heading: 'Need Help?',
        body: `If there is a genuine issue with an order (e.g. an item is missing, damaged, or incorrect on delivery), contact ${SUPPORT_LINE} with your order number and we will assist under our Returns & Refunds Policy.`,
      },
    ],
  },
  {
    slug: 'quality-guidelines',
    key: 'quality',
    name: 'Quality Guidelines',
    title: 'Quality & Food Safety Guidelines',
    updated: 'October 2026',
    summary: 'Our food safety registration and the quality standards we hold ourselves to.',
    intro:
      'Alimenture is committed to maintaining appropriate food safety and quality standards across our products and operations.',
    sections: [
      {
        heading: 'Food Safety Registration',
        body: 'Our business is registered under the Food Safety and Standards Act, 2006. The FSSAI certificate identifies M/s. Alimenture Industries Private Limited as the Food Business Operator and lists Bakery Products and Ready-to-Eat Savouries among its registered food categories. The registration is valid until 31 March 2029. FSSAI registration is a compliance requirement and is not an endorsement or quality certification of individual products.',
      },
      {
        heading: 'Our Approach to Quality',
        body: 'Our products are made without maida, refined sugar, refined oil, or artificial preservatives, using traditional slow-baking methods intended to preserve the nutrition of whole grains. Batches are prepared in FSSAI-compliant facilities with attention to hygiene and handling.',
      },
      {
        heading: 'Packing & Dispatch',
        body: 'Before dispatch, products are checked and packed to survive courier handling, then handed to our logistics partner, Shiprocket, for delivery. Best-before or expiry information is printed on the product where applicable.',
      },
      {
        heading: 'Customer Responsibility',
        body: 'To get the best from our products, we ask customers to:',
        items: [
          'Check the packaging at the time of delivery',
          'Follow the storage instructions provided with the product',
          'Check the best-before or expiry information before consuming',
          'Not consume a product if the packaging appears damaged, opened, or tampered with',
        ],
      },
      {
        heading: 'Raising a Quality Concern',
        body: `If you believe a product has a quality or packaging issue, contact ${SUPPORT_LINE} with your order number, the product name, a description of the issue, and photographs or video of the product and packaging. Our team will review the concern and assist with an appropriate resolution.`,
      },
    ],
  },
];

export const POLICY_BY_SLUG = Object.fromEntries(POLICIES.map((p) => [p.slug, p]));

export const SUPPORT_CONTACT = { email: SUPPORT_EMAIL, phones: ['+91 98847 33453', '+91 73581 96132'] };
