import type { Metadata } from "next";
import { CheckCircle, Clock, XCircle, AlertTriangle, DollarSign, Building2, Search, Filter, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Supermarket Subscriptions — My Recette Admin",
  description: "Manage supermarket subscriptions and payment status",
};

// Mock data for local development
const mockSubscriptions = [
  {
    id: "sub-001",
    supermarket_id: "s-1",
    supermarket_name: "Fresh Mart",
    supermarket_email: "contact@freshmart.fr",
    plan: "premium",
    monthly_fee: 50,
    currency: "EUR",
    status: "active",
    payment_method: "stripe",
    stripe_customer_id: "cus_123456789",
    stripe_subscription_id: "sub_123456789",
    start_date: "2024-01-15",
    next_payment_due: "2024-08-01",
    last_payment_date: "2024-07-01",
    last_payment_amount: 50.00,
    payment_status: "paid",
    auto_renew: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-07-01T14:25:00Z"
  },
  {
    id: "sub-002",
    supermarket_id: "s-2",
    supermarket_name: "Green Grocer",
    supermarket_email: "info@greengrocer.com",
    plan: "premium",
    monthly_fee: 50,
    currency: "EUR", 
    status: "active",
    payment_method: "stripe",
    stripe_customer_id: "cus_987654321",
    stripe_subscription_id: "sub_987654321",
    start_date: "2024-02-20",
    next_payment_due: "2024-08-05",
    last_payment_date: "2024-07-05",
    last_payment_amount: 50.00,
    payment_status: "paid",
    auto_renew: true,
    created_at: "2024-02-20T14:45:00Z",
    updated_at: "2024-07-05T10:15:00Z"
  },
  {
    id: "sub-003", 
    supermarket_id: "s-3",
    supermarket_name: "Bio Market",
    supermarket_email: "hello@biomarket.com",
    plan: "premium",
    monthly_fee: 50,
    currency: "EUR",
    status: "past_due",
    payment_method: "stripe",
    stripe_customer_id: "cus_555666777",
    stripe_subscription_id: "sub_555666777",
    start_date: "2024-03-10",
    next_payment_due: "2024-07-10",
    last_payment_date: "2024-06-10",
    last_payment_amount: 50.00,
    payment_status: "failed",
    auto_renew: true,
    failed_payment_attempts: 3,
    created_at: "2024-03-10T09:20:00Z",
    updated_at: "2024-07-01T08:00:00Z"
  },
  {
    id: "sub-004",
    supermarket_id: "s-4", 
    supermarket_name: "Local Mart",
    supermarket_email: "contact@localmart.com",
    plan: "premium",
    monthly_fee: 50,
    currency: "EUR",
    status: "canceled",
    payment_method: "stripe",
    stripe_customer_id: "cus_111222333",
    stripe_subscription_id: "sub_111222333",
    start_date: "2024-04-01",
    end_date: "2024-06-30",
    next_payment_due: null,
    last_payment_date: "2024-06-01",
    last_payment_amount: 50.00,
    payment_status: "paid",
    auto_renew: false,
    created_at: "2024-04-01T11:00:00Z",
    updated_at: "2024-06-30T16:30:00Z"
  },
  {
    id: "sub-005",
    supermarket_id: "s-5",
    supermarket_name: "Eco Foods",
    supermarket_email: "sales@ecofoods.com",
    plan: "premium",
    monthly_fee: 50,
    currency: "EUR",
    status: "trialing",
    payment_method: "none",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    start_date: "2024-07-01",
    trial_end_date: "2024-08-01",
    next_payment_due: "2024-08-01",
    last_payment_date: null,
    last_payment_amount: 0.00,
    payment_status: "pending",
    auto_renew: true,
    created_at: "2024-07-01T12:00:00Z",
    updated_at: "2024-07-01T12:00:00Z"
  }
];

const plans = [
  { id: "premium", name: "Premium", price: 50, currency: "EUR", features: ["Full access", "Priority support", "Analytics", "Bulk upload"] },
];

const statuses = [
  { id: "all", name: "All Statuses", count: mockSubscriptions.length },
  { id: "active", name: "Active", count: mockSubscriptions.filter(s => s.status === "active").length },
  { id: "past_due", name: "Past Due", count: mockSubscriptions.filter(s => s.status === "past_due").length },
  { id: "trialing", name: "Trialing", count: mockSubscriptions.filter(s => s.status === "trialing").length },
  { id: "canceled", name: "Canceled", count: mockSubscriptions.filter(s => s.status === "canceled").length },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
        <CheckCircle className="h-3 w-3" /> Active
      </span>;
    case "past_due":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" /> Past Due
      </span>;
    case "trialing":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
        <Clock className="h-3 w-3" /> Trialing
      </span>;
    case "canceled":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium">
        <XCircle className="h-3 w-3" /> Canceled
      </span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium">
        <Clock className="h-3 w-3" /> {status}
      </span>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
        <CheckCircle className="h-3 w-3" /> Paid
      </span>;
    case "failed":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
        <XCircle className="h-3 w-3" /> Failed
      </span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
        <Clock className="h-3 w-3" /> Pending
      </span>;
    default:
      return <span className="text-xs font-medium text-neutral-600">{status}</span>;
  }
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    status?: string; 
    plan?: string; 
    search?: string;
    page?: string; 
  }>;
}) {
  const { status: statusFilter, plan: planFilter, search: searchQuery, page: pageParam } = await searchParams;
  
  const page = pageParam ? parseInt(pageParam) : 1;
  const perPage = 10;

  // Filter subscriptions
  let filteredSubscriptions = [...mockSubscriptions];
  
  if (statusFilter && statusFilter !== "all") {
    filteredSubscriptions = filteredSubscriptions.filter(s => s.status === statusFilter);
  }
  
  if (planFilter) {
    filteredSubscriptions = filteredSubscriptions.filter(s => s.plan === planFilter);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredSubscriptions = filteredSubscriptions.filter(s => 
      s.supermarket_name.toLowerCase().includes(query) ||
      s.supermarket_email.toLowerCase().includes(query) ||
      s.stripe_customer_id?.toLowerCase().includes(query)
    );
  }

  const total = filteredSubscriptions.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(start, end);

  // Calculate revenue stats
  const activeSubscriptions = filteredSubscriptions.filter(s => s.status === "active").length;
  const monthlyRevenue = activeSubscriptions * 50; // 50 EUR per supermarket
  const pastDueSubscriptions = filteredSubscriptions.filter(s => s.status === "past_due").length;
  const trialSubscriptions = filteredSubscriptions.filter(s => s.status === "trialing").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-recette-600" />
            Supermarket Subscriptions
          </h1>
          <p className="text-neutral-500 mt-1">Manage supermarket subscription plans and payments</p>
        </div>
        <Link href="/admin/supermarkets">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Supermarkets
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Active Subscriptions</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{activeSubscriptions}</div>
          <div className="text-sm text-green-600 mt-1">+{activeSubscriptions} this month</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <DollarSign className="h-4 w-4 text-recette-600" />
            <span>Monthly Revenue</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">€{monthlyRevenue}</div>
          <div className="text-sm text-green-600 mt-1">+€{monthlyRevenue} this month</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span>Past Due</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{pastDueSubscriptions}</div>
          <div className="text-sm text-orange-600 mt-1">Needs attention</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Trialing</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{trialSubscriptions}</div>
          <div className="text-sm text-blue-600 mt-1">Ending soon</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search supermarkets..."
              defaultValue={searchQuery || ""}
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
            />
          </div>

          <select
            defaultValue={statusFilter || "all"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.count})
              </option>
            ))}
          </select>

          <select
            defaultValue={planFilter || ""}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (€{p.price})
              </option>
            ))}
          </select>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
          
          <Button variant="outline" className="gap-2">
            <MoreVertical className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-neutral-900">All Subscriptions</h2>
          <div className="text-sm text-neutral-500">
            Showing {start + 1}-{Math.min(end, total)} of {total} subscriptions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Supermarket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Next Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedSubscriptions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-recette-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-recette-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{sub.supermarket_name}</div>
                        <div className="text-sm text-neutral-500">{sub.supermarket_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-recette-100 text-recette-800 text-xs font-medium">
                      {sub.plan} - €{sub.monthly_fee}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusBadge(sub.payment_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {sub.next_payment_due || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-900">
                    €{sub.last_payment_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link href={`/admin/supermarkets/${sub.supermarket_id}`} className="text-sm text-recette-600 hover:text-recette-700 font-medium">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-500">
                {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page === totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Available Plans</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-neutral-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-recette-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-recette-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{plan.name}</h3>
                    <p className="text-sm text-neutral-500">{plan.currency} {plan.price}/month</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-recette-600 mb-4">
                  {plan.currency} {plan.price}
                  <span className="text-lg font-normal text-neutral-500">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-neutral-600">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-sm text-neutral-500">
                  {activeSubscriptions} supermarkets currently on this plan
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}