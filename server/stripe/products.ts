/**
 * Stripe Products & Prices Configuration
 * Maps local membership tiers to Stripe products.
 * Stripe Price IDs are stored in the DB after sync.
 */

export interface TierPricing {
  slug: string;
  name: string;
  monthlyPriceCents: number; // in cents (CAD)
  yearlyPriceCents: number;  // in cents (CAD)
  currency: string;
}

export const TIER_PRICING: TierPricing[] = [
  {
    slug: "free",
    name: "Free",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    currency: "cad",
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPriceCents: 2999, // $29.99 CAD
    yearlyPriceCents: 28788, // $287.88 CAD ($23.99/mo)
    currency: "cad",
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    monthlyPriceCents: 9999, // $99.99 CAD
    yearlyPriceCents: 95988, // $959.88 CAD ($79.99/mo)
    currency: "cad",
  },
];

export const STRIPE_SUCCESS_PATH = "/membership?status=success";
export const STRIPE_CANCEL_PATH = "/membership?status=cancelled";
