"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  Plus,
  CreditCard,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { format } from "date-fns";

export default function WalletManagementPage() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/wallet/admin");
      return response?.data || [];
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground">
            Manage student wallets and transactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR{" "}
              {wallets
                ?.reduce((sum: number, w: any) => sum + (w.balance || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Wallets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallets?.filter((w: any) => w.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading wallets...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets?.map((wallet: any) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {wallet.student?.user?.firstName}{" "}
                          {wallet.student?.user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {wallet.student?.admissionNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        LKR {wallet.balance?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {wallet.lastTransaction &&
                        format(new Date(wallet.lastTransaction), "PP")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={wallet.isActive ? "default" : "secondary"}
                      >
                        {wallet.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <CreditCard className="h-4 w-4 mr-2" />
                        View Transactions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
