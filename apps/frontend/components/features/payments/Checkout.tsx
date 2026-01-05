"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "./PaymentForm";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface CheckoutProps {
  amount: number;
  currency?: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function Checkout({
  amount,
  currency = "USD",
  description = "Payment",
  referenceType,
  referenceId,
  onSuccess,
  onError,
}: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Create PaymentIntent on mount
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = (await ApiClient.post("/payments/create-intent", {
          amount,
          currency,
          description,
          referenceType,
          referenceId,
        })) as { data?: { clientSecret?: string } };

        if (response.data?.clientSecret) {
          setClientSecret(response.data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      } catch (err) {
        const errorMsg =
          asApiError(err).response?.data?.message ||
          "Failed to initialize payment";
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency, description, referenceType, referenceId, onError]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Initializing secure payment...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to initialize payment. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#0070f3",
      colorBackground: "#ffffff",
      colorText: "#1a1a1a",
      colorDanger: "#df1b41",
      fontFamily: "system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        locale: "en",
      }}
    >
      <PaymentForm
        amount={amount}
        currency={currency}
        description={description}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
