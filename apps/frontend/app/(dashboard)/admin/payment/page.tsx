"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClient } from "@/lib/api/api-client"; // Import your ApiClient

interface PaymentSummary {
  teacherProfileId: string;
  teacherName: string;
  month: string;
  totalClasses: number;
  paymentPerClass: number;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: Date;
}

interface PendingPaymentsResponse {
  payments: Array<{
    id: string;
    teacherProfileId: string;
    month: string;
    totalClasses: number;
    paymentPerClass: number;
    totalAmount: number;
    isPaid: boolean;
    paidAt?: string;
    teacherProfile: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
    };
  }>;
  summary: {
    totalTeachers: number;
    totalPendingAmount: number;
    totalPendingClasses: number;
  };
}

export default function TeacherPaymentsDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // Current month in YYYY-MM format
  });
  const [pendingPayments, setPendingPayments] =
    useState<PendingPaymentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    fetchPendingPayments();
  }, [selectedMonth]);

  const fetchPendingPayments = async () => {
    setIsLoading(true);
    try {
      const data = await ApiClient.get<PendingPaymentsResponse>(
        `/teacher-payments/pending?month=${selectedMonth}`
      );
      setPendingPayments(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyPayments = async () => {
    setIsCalculating(true);
    try {
      const result = await ApiClient.post<{
        success: number;
        failed: number;
        message: string;
      }>(`/teacher-payments/calculate-all?month=${selectedMonth}`);

      toast.success(
        `Calculated payments for ${result.success} teachers${result.failed > 0 ? `, ${result.failed} failed` : ""}`
      );
      fetchPendingPayments(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to calculate payments");
    } finally {
      setIsCalculating(false);
    }
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      await ApiClient.post(
        `/teacher-payments/${paymentId}/mark-paid?paidBy=admin`,
        { notes: "Payment completed" }
      );

      toast.success("Payment marked as paid");
      fetchPendingPayments(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to mark payment as paid");
    }
  };

  const exportPayments = async () => {
    try {
      // Use the downloadFile method for CSV export
      await ApiClient.downloadFile(
        `/teacher-payments/export?month=${selectedMonth}`,
        `teacher-payments-${selectedMonth}.csv`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to export payments");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatMonth = (month: string) => {
    return new Date(`${month}-01`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Teacher Payments
            </h1>
            <p className="text-gray-600">
              Manage and track teacher payments based on classes conducted
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="month">Select Month</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={calculateMonthlyPayments}
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Calculate Payments
            </Button>
          </div>

          <div className="flex items-end">
            <Button
              onClick={exportPayments}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {pendingPayments && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingPayments.summary.totalTeachers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingPayments.summary.totalPendingAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingPayments.summary.totalPendingClasses}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Pending Payments - {formatMonth(selectedMonth)}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : pendingPayments?.payments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No pending payments for {formatMonth(selectedMonth)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Use the "Calculate Payments" button to generate payment records
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingPayments?.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payment.teacherProfile.user.firstName}{" "}
                          {payment.teacherProfile.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.teacherProfile.user.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.totalClasses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.paymentPerClass)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.isPaid
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.isPaid ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!payment.isPaid && (
                        <Button
                          onClick={() => markPaymentAsPaid(payment.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
