"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { getQuickBooksOverview, getQuickBooksInvoices, getQuickBooksBills, getQuickBooksPayments } from "@/lib/api";
import { Loader2, DollarSign, FileText, CreditCard, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";

interface QuickBooksOverview {
  period_days: number;
  start_date: string;
  end_date: string;
  invoices: {
    count: number;
    total_amount: number;
    outstanding_balance: number;
    paid_amount: number;
  };
  bills: {
    count: number;
    total_amount: number;
    unpaid_balance: number;
    paid_amount: number;
  };
  payments: {
    count: number;
    total_amount: number;
  };
  customers: {
    count: number;
    top_5: Array<{ name: string; revenue: number }>;
  };
  recent_transactions: Array<{
    id: string;
    type: string;
    title: string;
    amount: number;
    date: string;
    customer_vendor: string;
    status: string;
  }>;
  total_documents: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<QuickBooksOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQuickBooksOverview(period);
      setOverview(data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!user || !overview) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
            <p className="text-gray-600">QuickBooks financial overview and insights</p>
          </div>

          {/* Period Selector */}
          <div className="mb-6 flex gap-3">
            {[7, 30, 90, 365].map((days) => (
              <Button
                key={days}
                onClick={() => setPeriod(days)}
                variant={period === days ? "default" : "outline"}
                className={period === days
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "border-2"
                }
              >
                {days === 7 && "Last 7 Days"}
                {days === 30 && "Last 30 Days"}
                {days === 90 && "Last 90 Days"}
                {days === 365 && "Last Year"}
              </Button>
            ))}
          </div>

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.invoices.total_amount)}</p>
              <p className="text-sm text-gray-500 mt-2">{overview.invoices.count} invoices</p>
            </div>

            {/* Outstanding Balance Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Outstanding</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.invoices.outstanding_balance)}</p>
              <p className="text-sm text-gray-500 mt-2">Unpaid invoices</p>
            </div>

            {/* Expenses Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Expenses</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.bills.total_amount)}</p>
              <p className="text-sm text-gray-500 mt-2">{overview.bills.count} bills</p>
            </div>

            {/* Payments Received Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Payments Received</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.payments.total_amount)}</p>
              <p className="text-sm text-gray-500 mt-2">{overview.payments.count} transactions</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Customers */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Customers</h3>
              <div className="space-y-4">
                {overview.customers.top_5.length > 0 ? (
                  overview.customers.top_5.map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(customer.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No customer data yet</p>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {overview.recent_transactions.length > 0 ? (
                  overview.recent_transactions.map((txn) => (
                    <div key={txn.id} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              txn.type === 'invoice' ? 'bg-green-100 text-green-700' :
                              txn.type === 'bill' ? 'bg-red-100 text-red-700' :
                              txn.type === 'payment' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {txn.type}
                            </span>
                            {txn.status && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                txn.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {txn.status}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900 text-sm">{txn.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {txn.customer_vendor && `${txn.customer_vendor} • `}
                            {formatDate(txn.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            txn.type === 'bill' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {txn.type === 'bill' ? '-' : '+'}{formatCurrency(txn.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-6 bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <p className="text-sm text-gray-600 mb-1">Invoices Paid</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(overview.invoices.paid_amount)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((overview.invoices.paid_amount / overview.invoices.total_amount) * 100 || 0).toFixed(1)}% collected
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                <p className="text-sm text-gray-600 mb-1">Bills Unpaid</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(overview.bills.unpaid_balance)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((overview.bills.unpaid_balance / overview.bills.total_amount) * 100 || 0).toFixed(1)}% outstanding
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  (overview.invoices.paid_amount - overview.bills.paid_amount) >= 0
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {formatCurrency(overview.invoices.paid_amount - overview.bills.paid_amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Paid in - Paid out</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Showing data from {formatDate(overview.start_date)} to {formatDate(overview.end_date)}</p>
            <p className="mt-1">{overview.total_documents} total QuickBooks documents synced</p>
          </div>
        </div>
      </div>
    </div>
  );
}
