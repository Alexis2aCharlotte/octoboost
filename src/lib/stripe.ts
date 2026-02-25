import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
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
