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
    updated: 'August 2026',
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
        body: 'We do not sell or rent your personal data. Information may be shared only with service providers who help us operate — such as payment processors, courier and logistics partners, communication and analytics providers — and only to the extent needed to deliver their service, or where required by law.',
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
    updated: 'August 2026',
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
        body: 'All prices are listed in Indian Rupees and include applicable taxes unless stated otherwise. Delivery charges, where applicable, are shown at checkout before you confirm your order. You are responsible for providing accurate billing, delivery, and contact details.',
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
    updated: 'August 2026',
    summary: 'How orders are processed, dispatched, and delivered across India.',
    intro:
      'We ship across India through reputed courier and logistics partners. This policy explains how orders are processed and delivered.',
    sections: [
      {
        heading: 'Order Processing',
        body: 'Orders are processed once the order is confirmed and payment (where applicable) is successful. Orders are generally dispatched within 24–48 hours on working days. Orders placed on Sundays or public holidays are processed on the next working day.',
      },
      {
        heading: 'Delivery Timelines',
        body: 'Once dispatched, delivery typically takes 2–7 working days depending on your location. Delivery timelines are estimates and may be affected by the delivery address, product availability, courier performance, weather, and other circumstances beyond our control. The estimate shown at checkout is not a guaranteed delivery date.',
      },
      {
        heading: 'Tracking',
        body: 'After your order is dispatched, tracking details are shared with you by SMS and/or email using the contact information provided with the order.',
      },
      {
        heading: 'Shipping Charges',
        body: 'Applicable shipping charges, if any, are calculated and displayed at checkout before you confirm your order.',
      },
      {
        heading: 'Delivery Issues',
        body: `If a package arrives visibly damaged, tampered with, or is not delivered within a reasonable time, please contact ${SUPPORT_LINE} promptly with your order number and photographs of the packaging where available.`,
      },
    ],
  },
  {
    slug: 'returns-refunds',
    key: 'returns',
    name: 'Returns & Refunds',
    title: 'Returns & Refunds Policy',
    updated: 'August 2026',
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
        heading: 'Refunds',
        body: 'Once a return is approved and, where applicable, the product is received and verified, the eligible refund is initiated to the original payment method or to a bank account you register for the refund. Refunds are processed within 7 working days of approval. The time for the amount to reflect in your account depends on your bank or payment provider.',
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
    updated: 'August 2026',
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
    updated: 'August 2026',
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
        body: 'Before dispatch, products are checked and packed to be suitable for transit. Best-before or expiry information is printed on the product where applicable.',
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
