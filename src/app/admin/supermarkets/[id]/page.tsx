import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Calendar, Users, DollarSign, Upload, FileText, Package, Tag, TrendingUp, Briefcase, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const revalidate = 0;
export const dynamicParams = true;

export const metadata: Metadata = {
  title: "Supermarket Details — sucre et sel Admin",
  description: "View and manage supermarket profile, products, and settings",
};

// Mock data for local development
const mockSupermarket = {
  id: "s-1",
  supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
  profile_picture_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
  banner_url: "https://images.unsplash.com/photo-1555507036-ab794f4ade0a?auto=format&fit=crop&w=800&q=80",
  description: { 
    en: "Premium grocery store offering fresh produce, organic products, and local specialties.",
    es: "Tienda de comestibles premium que ofrece productos frescos, orgánicos y especialidades locales.",
    fr: "Épicerie premium offrant des produits frais, biologiques et des spécialités locales.",
    ar: "متجر بقالة premium يقدم المنتجات الطازجة والعضوية والتخصصات المحلية."
  },
  address: {
    line1: "123 Main Street",
    line2: "",
    city: "Paris",
    state: "Ile-de-France",
    postal_code: "75001",
    country: "France"
  },
  phone: "+33123456789",
  email: "contact@freshmart.fr",
  website: "https://freshmart.fr",
  opening_hours: [
    { day: "Monday", opens: "08:00", closes: "20:00", is_open: true },
    { day: "Tuesday", opens: "08:00", closes: "20:00", is_open: true },
    { day: "Wednesday", opens: "08:00", closes: "20:00", is_open: true },
    { day: "Thursday", opens: "08:00", closes: "20:00", is_open: true },
    { day: "Friday", opens: "08:00", closes: "22:00", is_open: true },
    { day: "Saturday", opens: "09:00", closes: "21:00", is_open: true },
    { day: "Sunday", opens: "10:00", closes: "18:00", is_open: true }
  ],
  social_links: {
    facebook: "https://facebook.com/freshmart",
    instagram: "https://instagram.com/freshmart",
    twitter: "https://twitter.com/freshmart",
    linkedin: ""
  },
  product_count: 1247,
  follower_count: 842,
  subscription_status: "active",
  subscription_plan: "premium",
  monthly_fee: 50,
  currency: "EUR",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-07-01T14:25:00Z"
};

const mockStats = {
  totalSales: 45230.50,
  totalOrders: 2847,
  averageOrderValue: 15.89,
  newCustomers: 156,
  activeProducts: 1247,
  lowStockItems: 23
};

const mockRecentActivity = [
  { id: "act-1", type: "new_order", title: "New order #4587", description: "€124.50 from 23 items", timestamp: "2 hours ago", status: "processing" },
  { id: "act-2", type: "new_product", title: "Added new product", description: "Organic Avocados - 6 pack", timestamp: "5 hours ago", status: "completed" },
  { id: "act-3", type: "stock_alert", title: "Low stock alert", description: "Only 3 units of Free Range Eggs remaining", timestamp: "1 day ago", status: "warning" },
  { id: "act-4", type: "new_follower", title: "New follower", description: "@john_doe started following", timestamp: "2 days ago", status: "completed" }
];

export default async function SupermarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // In a real implementation, fetch from Supabase
  const supermarket = mockSupermarket;
  const stats = mockStats;
  const recentActivity = mockRecentActivity;

  if (!supermarket) notFound();

  // Format address
  const getAddress = () => {
    const parts = [
      supermarket.address.line1,
      supermarket.address.line2,
      supermarket.address.city,
      supermarket.address.state,
      supermarket.address.postal_code,
      supermarket.address.country
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Format opening hours for display
  const formatHours = () => {
    if (!supermarket.opening_hours) return "Not specified";
    
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const todayHours = supermarket.opening_hours.find((h: any) => h.day === today);
    
    if (todayHours) {
      return `${today}: ${todayHours.opens} - ${todayHours.closes} ${todayHours.is_open ? "(Open)" : "(Closed)"}`;
    }
    
    return `${supermarket.opening_hours[0].day}: ${supermarket.opening_hours[0].opens} - ${supermarket.opening_hours[0].closes}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-recette-600" />
            {supermarket.supermarket_name.en}
          </h1>
          <p className="text-neutral-500 mt-1">ID: {supermarket.id}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/supermarkets">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          </Link>
          <Link href={`/admin/supermarkets/${supermarket.id}/edit`}>
            <Button className="gap-2 bg-recette-600 hover:bg-recette-700">
              <Edit className="h-4 w-4" />
              Edit Supermarket
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${supermarket.subscription_status === 'active' ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-5 w-5 ${supermarket.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Subscription Status</h3>
              <p className="text-sm text-neutral-500">Monthly fee: {supermarket.monthly_fee} {supermarket.currency}</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {supermarket.subscription_status.charAt(0).toUpperCase() + supermarket.subscription_status.slice(1)}
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${supermarket.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {supermarket.subscription_plan}
            </span>
          </div>
          <div className="mt-4">
            <Link href="/admin/supermarkets/subscriptions" className="text-sm text-recette-600 hover:text-recette-700 font-medium">
              Manage Subscriptions →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-neutral-900">Followers</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{supermarket.follower_count.toLocaleString()}</div>
          <p className="text-sm text-green-600 mt-1">+12 this week</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-neutral-900">Products</h3>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{supermarket.product_count.toLocaleString()}</div>
          <p className="text-sm text-neutral-500 mt-1">Active in catalog</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Supermarket Profile</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Supermarket Image */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100">
                {supermarket.banner_url ? (
                  <img
                    src={supermarket.banner_url}
                    alt={supermarket.supermarket_name.en}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-recette-100 to-recette-200 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-recette-600" />
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  {supermarket.profile_picture_url ? (
                    <img
                      src={supermarket.profile_picture_url}
                      alt={supermarket.supermarket_name.en}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover -mt-8"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-recette-100 flex items-center justify-center -mt-8">
                      <Building2 className="h-12 w-12 text-recette-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Supermarket Details */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">About</h3>
                <p className="text-neutral-600">{supermarket.description.en}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">Address</h4>
                    <p className="text-neutral-600">{getAddress()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">Phone</h4>
                    <p className="text-neutral-600">{supermarket.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">Email</h4>
                    <p className="text-neutral-600">{supermarket.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">Website</h4>
                    <p className="text-neutral-600">
                      {supermarket.website ? (
                        <a href={supermarket.website} target="_blank" rel="noopener noreferrer" className="text-recette-600 hover:text-recette-700">
                          {supermarket.website}
                        </a>
                      ) : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">Opening Hours</h4>
                    <p className="text-neutral-600">{formatHours()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href={`/admin/supermarkets/${supermarket.id}/bulk-upload`}>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                </Link>
                <Link href="/admin/products">
                  <Button variant="outline" className="gap-2">
                    <Package className="h-4 w-4" />
                    View Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href={`/admin/supermarkets/${supermarket.id}/edit`} className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Edit className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-neutral-900">Edit Profile</h3>
              <p className="text-sm text-neutral-500">Update supermarket information</p>
            </div>
          </div>
        </Link>

        <Link href={`/admin/supermarkets/${supermarket.id}/bulk-upload`} className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-neutral-900">Bulk Upload</h3>
              <p className="text-sm text-neutral-500">Upload products via CSV</p>
            </div>
          </div>
        </Link>

        <button className="w-full bg-white rounded-xl border border-red-200 p-6 hover:bg-red-50 transition-colors text-left">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-neutral-900">Delete Supermarket</h3>
              <p className="text-sm text-neutral-500">Permanently remove this supermarket</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Performance Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-recette-600">{stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-sm text-neutral-500 mt-1">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-recette-600">{stats.totalOrders.toLocaleString()}</div>
              <div className="text-sm text-neutral-500 mt-1">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-recette-600">{stats.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-sm text-neutral-500 mt-1">Avg. Order Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-recette-600">{stats.newCustomers}</div>
              <div className="text-sm text-neutral-500 mt-1">New Customers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Recent Activity</h2>
          <Link href="/admin/messages" className="text-sm text-recette-600 hover:text-recette-700 font-medium">
            View All Activity →
          </Link>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border border-neutral-100">
                <div className="flex-shrink-0">
                  {activity.type === 'new_order' && <ShoppingBag className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'new_product' && <Package className="h-5 w-5 text-green-600" />}
                  {activity.type === 'stock_alert' && <TrendingUp className="h-5 w-5 text-orange-600" />}
                  {activity.type === 'new_follower' && <Users className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-neutral-900">{activity.title}</h4>
                  <p className="text-sm text-neutral-500">{activity.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">{activity.timestamp}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}