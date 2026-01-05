"use client";

import React, { useState } from "react";
import { asApiError } from "@/lib/error-handling";
import {
  CreditCard,
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  DollarSign,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { publicationsApi } from "@/lib/api/endpoints/publications";
import { walletApi } from "@/lib/api/endpoints/wallet";
import { useAuthStore } from "@/stores/auth-store";
import { Publication } from "@/lib/api/types/publications.types";
import WalletTopUpModal from "./WalletTopUpModal";
import { getDisplayName } from "@/lib/utils/display";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
  onSuccess: () => void;
}

export default function PaymentConfirmationModal({
  isOpen,
  onClose,
  publication,
  onSuccess,
}: PaymentConfirmationModalProps) {
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">(
    "wallet"
  );
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Load wallet balance when modal opens
  React.useEffect(() => {
    if (isOpen && user) {
      loadWalletBalance();
    }
  }, [isOpen, user]);

  const loadWalletBalance = async () => {
    try {
      setLoadingBalance(true);
      const response = await walletApi.getBalance();
      setWalletBalance(response.balance);
    } catch (error) {
      setWalletBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const finalPrice = publication.discountPrice || publication.price;
  const hasInsufficientFunds =
    walletBalance !== null && walletBalance < finalPrice;

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to purchase");
      return;
    }

    if (paymentMethod === "wallet" && hasInsufficientFunds) {
      toast.error("Insufficient wallet balance");
      return;
    }

    try {
      setIsProcessing(true);

      if (paymentMethod === "wallet") {
        // Purchase using wallet
        await publicationsApi.purchase(publication.id);
        toast.success("Publication purchased successfully using wallet!");
      } else {
        // Simulate card payment (in real app, integrate with Stripe/PayPal)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await publicationsApi.purchase(publication.id);
        toast.success("Publication purchased successfully using card!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        asApiError(error).response?.data?.message ||
          "Failed to complete purchase"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Confirm Purchase
          </DialogTitle>
          <DialogDescription>
            Review your purchase details before completing the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Publication Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden flex-shrink-0">
                  {publication.coverImage ? (
                    <img
                      src={publication.coverImage}
                      alt={publication.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-blue-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold line-clamp-2 mb-1">
                    {publication.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mb-2">
                    {publication.shortDescription || publication.description}
                  </CardDescription>
                  <div className="flex items-center gap-2">
                    {publication.grade && publication.grade.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {getDisplayName(publication.grade)}
                      </Badge>
                    )}
                    {publication.subject && publication.subject.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {getDisplayName(publication.subject)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Price Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base Price:</span>
              <span className="text-sm">{formatPrice(publication.price)}</span>
            </div>

            {publication.discountPrice && (
              <>
                <div className="flex items-center justify-between text-green-600">
                  <span className="text-sm">Discount:</span>
                  <span className="text-sm">
                    -
                    {formatPrice(publication.price - publication.discountPrice)}
                  </span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex items-center justify-between font-semibold">
              <span>Total:</span>
              <span className="text-lg">{formatPrice(finalPrice)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Payment Method</h4>

            {/* Wallet Option */}
            <Card
              className={`cursor-pointer border-2 transition-colors ${
                paymentMethod === "wallet"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("wallet")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-sm">Wallet Balance</div>
                      <div className="text-xs text-muted-foreground">
                        {loadingBalance ? (
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </div>
                        ) : walletBalance !== null ? (
                          <>Available: {formatPrice(walletBalance)}</>
                        ) : (
                          "Unable to load balance"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasInsufficientFunds && (
                      <Badge variant="destructive" className="text-xs">
                        Insufficient
                      </Badge>
                    )}
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === "wallet"
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    >
                      {paymentMethod === "wallet" && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Option */}
            <Card
              className={`cursor-pointer border-2 transition-colors ${
                paymentMethod === "card"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <div className="font-medium text-sm">
                        Credit/Debit Card
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Secure payment via Stripe
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    {paymentMethod === "card" && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insufficient Funds Warning */}
          {paymentMethod === "wallet" && hasInsufficientFunds && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm text-yellow-700">
                  <div className="font-medium">Insufficient wallet balance</div>
                  <div className="text-xs">
                    You need {formatPrice(finalPrice - (walletBalance || 0))}{" "}
                    more to complete this purchase
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTopUpModal(true)}
                className="ml-2"
              >
                Top Up
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={
              isProcessing ||
              (paymentMethod === "wallet" && hasInsufficientFunds) ||
              loadingBalance
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Pay {formatPrice(finalPrice)}
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Wallet Top-up Modal */}
        {walletBalance !== null && (
          <WalletTopUpModal
            isOpen={showTopUpModal}
            onClose={() => setShowTopUpModal(false)}
            currentBalance={walletBalance}
            minimumRequired={finalPrice}
            onSuccess={() => {
              loadWalletBalance();
              setShowTopUpModal(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
