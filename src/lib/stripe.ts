import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});

export const PRICE_IDS = {
  explore: {
    monthly: process.env.STRIPE_PRICE_EXPLORE_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_EXPLORE_YEARLY!,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
} as const;

export type PlanName = keyof typeof PRICE_IDS;
export type BillingInterval = "monthly" | "yearly";
