"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw,
  History,
} from "lucide-react";
import { format } from "date-fns";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import {
  walletApi,
  Wallet as WalletType,
  WalletTransaction as WalletTxType,
} from "@/lib/api/endpoints/wallet";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

type TransactionType = "CREDIT" | "DEBIT" | "REFUND";

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  frozen: boolean;
  frozenReason?: string;
  frozenAt?: string;
  lastTopUp?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  referenceType?: string;
  createdAt: string;
}

export function WalletManagementPage() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Adjust Balance Dialog
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      handleApiError(null, "Please enter a search term");
      return;
    }

    try {
      setLoading(true);
      const wallets = await walletApi.searchWallets(searchTerm);
      if (wallets && wallets.length > 0) {
        // Get the first wallet found
        const foundWallet = wallets[0];
        setWallet(foundWallet as WalletData);

        // Fetch transactions for this wallet
        const txResponse = await walletApi.getUserTransactions(
          foundWallet.userId
        );
        setTransactions((txResponse.data || []) as WalletTransaction[]);
      } else {
        setWallet(null);
        setTransactions([]);
        handleApiError(null, "No wallet found for this search term");
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch wallet data");
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!wallet) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      handleApiError(null, "Please enter a valid amount");
      return;
    }

    if (!adjustReason.trim()) {
      handleApiError(null, "Please provide a reason for adjustment");
      return;
    }

    try {
      setAdjusting(true);
      await walletApi.adjustBalance(wallet.userId, {
        amount,
        type: adjustType,
        reason: adjustReason,
      });

      handleApiSuccess(
        `Balance ${adjustType === "CREDIT" ? "credited" : "debited"} successfully`
      );
      setAdjustDialogOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
      handleSearch(); // Refresh data
    } catch (error) {
      handleApiError(error, "Failed to adjust balance");
    } finally {
      setAdjusting(false);
    }
  };

  const getTransactionBadge = (type: TransactionType) => {
    const config = {
      CREDIT: { icon: TrendingUp, className: "bg-green-100 text-green-800" },
      DEBIT: { icon: TrendingDown, className: "bg-red-100 text-red-800" },
      REFUND: { icon: RefreshCw, className: "bg-purple-100 text-purple-800" },
    };

    const { icon: Icon, className } = config[type];
    return (
      <Badge variant="outline" className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {type}
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground mt-1">
          Search and manage student wallet balances
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Wallet
          </CardTitle>
          <CardDescription>
            Search by student name or phone number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter student name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Details */}
      {wallet && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {wallet.user?.firstName} {wallet.user?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {wallet.user?.email}
                  </p>
                  {wallet.user?.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      {wallet.user.phoneNumber}
                    </p>
                  )}
                </div>
                {wallet.frozen && (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Frozen
                  </Badge>
                )}
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Current Balance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold flex items-center gap-2">
                      <DollarSign className="h-6 w-6" />
                      {wallet.balance.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Credits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      {wallet.totalCredits.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Debits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 flex items-center gap-2">
                      <TrendingDown className="h-6 w-6" />
                      {wallet.totalDebits.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Frozen Warning */}
              {wallet.frozen && wallet.frozenReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">
                        Wallet Frozen
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {wallet.frozenReason}
                      </p>
                      {wallet.frozenAt && (
                        <p className="text-xs text-red-600 mt-1">
                          Frozen on {safeFormatDate(wallet.frozenAt, "PPP")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Adjust Balance Button */}
              <Button
                onClick={() => setAdjustDialogOpen(true)}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Adjust Balance
              </Button>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All wallet transactions for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance Before</TableHead>
                      <TableHead>Balance After</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">
                            No transactions found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {safeFormatDate(transaction.createdAt, "PPp")}
                          </TableCell>
                          <TableCell>
                            {getTransactionBadge(transaction.type)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                transaction.type === "CREDIT"
                                  ? "text-green-600 font-semibold"
                                  : transaction.type === "DEBIT"
                                    ? "text-red-600 font-semibold"
                                    : "font-semibold"
                              }
                            >
                              {transaction.type === "CREDIT" ? "+" : "-"}
                              {transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {transaction.balanceBefore.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {transaction.balanceAfter.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {transaction.description || "-"}
                              {transaction.referenceType && (
                                <Badge variant="outline" className="ml-2">
                                  {transaction.referenceType}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* No Wallet Selected */}
      {!loading && !wallet && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Wallet className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Wallet Selected</h3>
              <p className="text-muted-foreground">
                Search for a student to view and manage their wallet
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
            <DialogDescription>
              Add or deduct credits from the wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Transaction Type */}
            <div>
              <Label>Transaction Type</Label>
              <RadioGroup
                value={adjustType}
                onValueChange={(v: any) => setAdjustType(v)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CREDIT" id="credit" />
                  <Label htmlFor="credit" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Credit (Add Money)</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEBIT" id="debit" />
                  <Label htmlFor="debit" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Debit (Deduct Money)</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Reason */}
            <div>
              <Label>Reason *</Label>
              <Textarea
                placeholder="Explain the reason for this adjustment..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Current Balance */}
            {wallet && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Current Balance
                </div>
                <div className="text-2xl font-bold">
                  {wallet.balance.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustDialogOpen(false);
                setAdjustAmount("");
                setAdjustReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={adjusting || !adjustAmount || !adjustReason.trim()}
            >
              {adjusting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : adjustType === "CREDIT" ? (
                <TrendingUp className="h-4 w-4 mr-2" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-2" />
              )}
              {adjustType === "CREDIT" ? "Credit" : "Debit"} Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
