import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe: Stripe = new Proxy({} as any, {
  get(_, prop) {
    return (getStripe() as any)[prop];
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
