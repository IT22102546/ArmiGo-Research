"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserWalletDialogProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
}

interface WalletData {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  minBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  createdAt: string;
}

const UserWalletDialog: React.FC<UserWalletDialogProps> = ({
  open,
  userId,
  userName,
  onClose,
}) => {
  const t = useTranslations("users");
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchWallet();
    }
  }, [open, userId]);

  const fetchWallet = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = (await ApiClient.get(`/users/${userId}/wallet`)) as any;
      setWallet(response);
    } catch (error) {
      handleApiError(error, "UserWalletDialog", "Failed to fetch wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("modals.wallet.title", { name: userName })}
          </DialogTitle>
          <DialogDescription>
            {t("modals.wallet.description")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : wallet ? (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.wallet.currentBalance")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    LKR {wallet.balance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.wallet.totalCredits")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    LKR {wallet.totalCredits.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.wallet.totalDebits")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    LKR {wallet.totalDebits.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.wallet.minBalance")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    LKR {wallet.minBalance.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>{t("modals.wallet.transactionHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {wallet.transactions && wallet.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("modals.wallet.date")}</TableHead>
                        <TableHead>{t("modals.wallet.type")}</TableHead>
                        <TableHead>
                          {t("modals.wallet.transactionDescription")}
                        </TableHead>
                        <TableHead>{t("modals.wallet.reference")}</TableHead>
                        <TableHead className="text-right">
                          {t("modals.wallet.amount")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("modals.wallet.balanceAfter")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wallet.transactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(txn.createdAt), "PP")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(txn.createdAt), "p")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                txn.type === "CREDIT" ? "default" : "secondary"
                              }
                              className={cn(
                                txn.type === "CREDIT"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {txn.type === "CREDIT" ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {txn.type === "CREDIT"
                                ? t("modals.wallet.credit")
                                : t("modals.wallet.debit")}
                            </Badge>
                          </TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell>
                            {txn.reference ? (
                              <span className="text-sm font-mono text-muted-foreground">
                                {txn.reference}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                "font-semibold",
                                txn.type === "CREDIT"
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {txn.type === "CREDIT" ? "+" : "-"}
                              {txn.amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {txn.balanceAfter.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t("modals.wallet.noTransactionsFound")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t("modals.wallet.noWalletData")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserWalletDialog;
