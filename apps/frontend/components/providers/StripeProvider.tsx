"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return null;
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

interface StripeProviderProps {
  children: React.ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    setStripe(getStripe());
  }, []);

  if (!stripe) {
    return <>{children}</>;
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0070f3",
            colorBackground: "#ffffff",
            colorText: "#1a1a1a",
            colorDanger: "#df1b41",
            fontFamily: "system-ui, sans-serif",
            spacingUnit: "4px",
            borderRadius: "8px",
          },
        },
        locale: "en",
      }}
    >
      {children}
    </Elements>
  );
}
