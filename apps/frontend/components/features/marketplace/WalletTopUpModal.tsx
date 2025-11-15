"use client";

import React, { useState } from "react";
import {
  Wallet,
  Plus,
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { notifyError, asApiError } from "@/lib/error-handling";
import { walletApi } from "@/lib/api/endpoints/wallet";

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  minimumRequired?: number;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

export default function WalletTopUpModal({
  isOpen,
  onClose,
  currentBalance,
  minimumRequired,
  onSuccess,
}: WalletTopUpModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

  const formatPrice = (price: number) => {
    // Present prices in LKR consistently across the UI
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(price);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);

    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount < 5) {
      // Keep the numeric minimum but present it as LKR to the user (local policy)
      toast.error("Minimum top-up amount is LKR 5");
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate payment processing (in real app, integrate with Stripe/PayPal)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Credit the wallet
      await walletApi.credit({
        amount: numAmount,
        description: `Wallet top-up via ${paymentMethod}`,
        referenceType: "topup",
        reference: `topup_${Date.now()}`,
      });

      toast.success(
        `Successfully added ${formatPrice(numAmount)} to your wallet!`
      );
      onSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      notifyError(asApiError(error), "Failed to top up wallet");
    } finally {
      setIsProcessing(false);
    }
  };

  const newBalance = currentBalance + (parseFloat(amount) || 0);
  const isAmountValid = parseFloat(amount) >= 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Top Up Wallet
          </DialogTitle>
          <DialogDescription>
            Add funds to your wallet for seamless purchases
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Current Balance
                  </div>
                  <div className="text-2xl font-bold">
                    {formatPrice(currentBalance)}
                  </div>
                </div>
                <Wallet className="h-8 w-8 text-blue-500" />
              </div>

              {minimumRequired && currentBalance < minimumRequired && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  You need at least{" "}
                  {formatPrice(minimumRequired - currentBalance)} more for your
                  purchase
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount">Top-up Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="5"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min LKR 5)"
                className="pl-10"
              />
            </div>

            {amount && isAmountValid && (
              <div className="text-sm text-muted-foreground">
                New balance: {formatPrice(newBalance)}
              </div>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={
                    amount === quickAmount.toString() ? "border-primary" : ""
                  }
                >
                  {formatPrice(quickAmount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>

            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer border-2 transition-colors ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <div className="font-medium text-sm">Card</div>
                      <div className="text-xs text-muted-foreground">
                        Visa, Mastercard
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 transition-colors ${
                  paymentMethod === "paypal"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setPaymentMethod("paypal")}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">PayPal</div>
                      <div className="text-xs text-muted-foreground">
                        Secure payment
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleTopUp}
            disabled={!isAmountValid || isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add {amount ? formatPrice(parseFloat(amount)) : "Funds"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
