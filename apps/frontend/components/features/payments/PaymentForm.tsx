"use client";

import React, { useState } from "react";
import { asApiError } from "@/lib/error-handling";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentFormProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  amount,
  currency = "USD",
  description = "Payment",
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentStatus("error");
        setErrorMessage(error.message || "An error occurred during payment");
        onError?.(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setPaymentStatus("success");
        onSuccess?.(paymentIntent.id);
      }
    } catch (err) {
      setPaymentStatus("error");
      setErrorMessage(
        asApiError(err).message || "An unexpected error occurred"
      );
      onError?.(asApiError(err).message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Complete your payment of {currency} {amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Element */}
          <div className="space-y-4">
            <PaymentElement
              options={{
                layout: "tabs",
                paymentMethodOrder: ["card", "ideal", "sepa_debit"],
              }}
            />
          </div>

          {/* Error Message */}
          {paymentStatus === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {paymentStatus === "success" && (
            <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Payment successful! Your transaction has been completed.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isProcessing || paymentStatus === "success"}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === "success" ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Payment Complete
              </>
            ) : (
              `Pay ${currency} ${amount.toFixed(2)}`
            )}
          </Button>

          {/* Payment Description */}
          {description && (
            <p className="text-sm text-muted-foreground text-center">
              {description}
            </p>
          )}

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>Powered by Stripe</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
