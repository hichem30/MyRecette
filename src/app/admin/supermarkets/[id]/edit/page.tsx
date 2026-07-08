"use client";

import { notFound, redirect } from "next/navigation";
import { Building2, MapPin, Phone, Mail, Globe, Calendar, Clock, Users, DollarSign, Upload, Camera, X, Plus, Trash2, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export const revalidate = 0;
export const dynamicParams = true;

// Mock data for local development
const mockSupermarket = {
  id: "s-1",
  supermarket_name: { en: "Fresh Mart", es: "Fresh Mart", fr: "Fresh Mart", ar: "فريش مارت" },
  slug: "fresh-mart",
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
    line2: "Apt 4B",
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
  categories: ["Grocery", "Organic", "Local Products"],
  subscription_status: "active",
  subscription_plan: "premium",
  monthly_fee: 50,
  currency: "EUR",
  is_verified: true,
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-07-01T14:25:00Z"
};

const mockCategories = [
  "Grocery",
  "Organic",
  "Local Products",
  "Specialty Foods",
  "International",
  "Bakery",
  "Deli",
  "Seafood",
  "Meat",
  "Health Food"
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ImageUpload({ label, name, currentImage, onChange }: { label: string; name: string; currentImage?: string; onChange?: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        onChange?.(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium text-neutral-900">{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-lg object-cover border border-neutral-300"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
              <Camera className="h-8 w-8 text-neutral-400" />
            </div>
          )}
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          name={name}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id={`upload-${name}`}
        />
        <Label htmlFor={`upload-${name}`} className="cursor-pointer">
          <Button type="button" variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {preview ? "Change Image" : "Upload Image"}
          </Button>
        </Label>
      </div>
    </div>
  );
}

function OpeningHoursEditor({ hours, onChange }: { hours: Array<{ day: string; opens: string; closes: string; is_open: boolean }>; onChange: (newHours: typeof hours) => void }) {
  const handleTimeChange = (index: number, field: 'opens' | 'closes', value: string) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    onChange(newHours);
  };

  const handleToggle = (index: number) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], is_open: !newHours[index].is_open };
    onChange(newHours);
  };

  return (
    <div className="space-y-4">
      <Label className="font-medium text-neutral-900">Opening Hours</Label>
      <div className="space-y-3">
        {hours.map((hour, index) => (
          <div key={hour.day} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
            <div className="w-24 font-medium text-neutral-900">{hour.day}</div>
            <select
              value={hour.is_open ? "open" : "closed"}
              onChange={() => handleToggle(index)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
            {hour.is_open && (
              <>
                <input
                  type="time"
                  value={hour.opens}
                  onChange={(e) => handleTimeChange(index, 'opens', e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="time"
                  value={hour.closes}
                  onChange={(e) => handleTimeChange(index, 'closes', e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialLinksEditor({ links, onChange }: { links: Record<string, string | null>; onChange: (newLinks: typeof links) => void }) {
  const platforms = [
    { key: "facebook", name: "Facebook", icon: "📘" },
    { key: "instagram", name: "Instagram", icon: "📷" },
    { key: "twitter", name: "Twitter", icon: "🐦" },
    { key: "linkedin", name: "LinkedIn", icon: "💼" },
    { key: "tiktok", name: "TikTok", icon: "🎵" },
    { key: "youtube", name: "YouTube", icon: "📺" }
  ];

  const handleChange = (key: string, value: string) => {
    onChange({ ...links, [key]: value || null });
  };

  return (
    <div className="space-y-4">
      <Label className="font-medium text-neutral-900">Social Media Links</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <div key={platform.key} className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <span>{platform.icon}</span>
              {platform.name}
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="url"
                value={links[platform.key] || ""}
                onChange={(e) => handleChange(platform.key, e.target.value)}
                placeholder={`https://${platform.key}.com/yourpage`}
                className="pl-10"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySelector({ selectedCategories, onChange, availableCategories }: { 
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  availableCategories: string[]
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCategories = availableCategories.filter(cat =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onChange(newCategories);
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium text-neutral-900">Categories</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex flex-wrap items-center justify-between gap-2 p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent text-left"
        >
          <div className="flex flex-wrap gap-1">
            {selectedCategories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-recette-100 text-recette-800 text-sm">
                {cat}
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }} className="hover:text-recette-600">✕</button>
              </span>
            ))}
            {selectedCategories.length === 0 && (
              <span className="text-neutral-500">Select categories...</span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 border border-neutral-200 rounded-lg bg-white shadow-lg">
            <div className="p-2 border-b border-neutral-200">
              <Input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2 p-2 hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="h-4 w-4 text-recette-600 border-neutral-300 focus:ring-recette-600 rounded"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditSupermarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In a real implementation, we would fetch the supermarket data from Supabase
  const supermarket = mockSupermarket;
  const [formData, setFormData] = useState({
    supermarket_name: { ...supermarket.supermarket_name },
    slug: supermarket.slug,
    description: { ...supermarket.description },
    address: { ...supermarket.address },
    phone: supermarket.phone,
    email: supermarket.email,
    website: supermarket.website,
    opening_hours: [...supermarket.opening_hours],
    social_links: { ...supermarket.social_links },
    categories: [...supermarket.categories],
    is_verified: supermarket.is_verified,
    subscription_status: supermarket.subscription_status,
    subscription_plan: supermarket.subscription_plan
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleNestedChange = (parent: string, child: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...((prev as Record<string, any>)[parent] as Record<string, any>),
        [child]: value
      }
    }));
    // Clear error
    if (errors[parent]) {
      setErrors(prev => ({ ...prev, [parent]: "" }));
    }
  };

  const handleTranslationChange = (parent: string, lang: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...((prev as Record<string, any>)[parent] as Record<string, any>),
        [lang]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate supermarket name (English)
    if (!formData.supermarket_name?.en?.trim()) {
      newErrors.supermarket_name = "Supermarket name (English) is required";
    }

    // Validate slug
    if (!formData.slug?.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    // Validate email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate website URL
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please enter a valid website URL (include http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSuccess(true);
      // In a real implementation: await fetch(`/api/supermarkets/${id}`, { method: 'PUT', body: JSON.stringify(formData) });
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this supermarket? This action cannot be undone.")) {
      // In a real implementation: await fetch(`/api/supermarkets/${id}`, { method: 'DELETE' });
      // redirect('/admin/supermarkets');
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">Supermarket Updated Successfully!</h1>
          <p className="mt-2 text-neutral-600">Your changes have been saved.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href={`/admin/supermarkets/${supermarket.id}`}>
              <Button className="gap-2">
                View Supermarket
              </Button>
            </Link>
            <Link href="/admin/supermarkets">
              <Button variant="outline" className="gap-2">
                Back to List
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-recette-600" />
            Edit Supermarket
          </h1>
          <p className="text-neutral-500 mt-1">Update supermarket profile and settings</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/supermarkets/${supermarket.id}`}>
            <Button variant="outline" className="gap-2">
              Cancel
            </Button>
          </Link>
          <Button type="submit" form="edit-supermarket" disabled={isSubmitting} className="gap-2 bg-recette-600 hover:bg-recette-700">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <form id="edit-supermarket" onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <div className="border-b border-neutral-200 pb-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Images */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageUpload
                    label="Profile Picture"
                    name="profile_picture"
                    currentImage={supermarket.profile_picture_url}
                  />
                  <ImageUpload
                    label="Banner Image"
                    name="banner"
                    currentImage={supermarket.banner_url}
                  />
                </div>
              </div>

              {/* Supermarket Name */}
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Supermarket Name *</Label>
                <Input
                  type="text"
                  value={formData.supermarket_name.en || ""}
                  onChange={(e) => handleTranslationChange("supermarket_name", "en", e.target.value)}
                  placeholder="Enter supermarket name"
                  required
                />
                {errors.supermarket_name && (
                  <p className="text-sm text-red-600">{errors.supermarket_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Name (Spanish)</Label>
                <Input
                  type="text"
                  value={formData.supermarket_name.es || ""}
                  onChange={(e) => handleTranslationChange("supermarket_name", "es", e.target.value)}
                  placeholder="Nombre del supermercado"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Name (French)</Label>
                <Input
                  type="text"
                  value={formData.supermarket_name.fr || ""}
                  onChange={(e) => handleTranslationChange("supermarket_name", "fr", e.target.value)}
                  placeholder="Nom du supermarché"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Name (Arabic)</Label>
                <Input
                  type="text"
                  value={formData.supermarket_name.ar || ""}
                  onChange={(e) => handleTranslationChange("supermarket_name", "ar", e.target.value)}
                  placeholder="اسم السوبرماركت"
                  dir="rtl"
                />
              </div>

              {/* Slug */}
              <div className="md:col-span-2 space-y-2">
                <Label className="font-medium text-neutral-900">URL Slug *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">/supermarkets/</span>
                  <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="fresh-mart"
                    className="pl-24"
                    required
                  />
                </div>
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug}</p>
                )}
                <p className="text-sm text-neutral-500">Must be unique and URL-friendly (lowercase, numbers, hyphens only)</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-neutral-200 pb-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">Description</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Description (English)</Label>
                <Textarea
                  value={formData.description.en || ""}
                  onChange={(e) => handleTranslationChange("description", "en", e.target.value)}
                  placeholder="Describe your supermarket..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Description (Spanish)</Label>
                <Textarea
                  value={formData.description.es || ""}
                  onChange={(e) => handleTranslationChange("description", "es", e.target.value)}
                  placeholder="Descripción del supermercado..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Description (French)</Label>
                <Textarea
                  value={formData.description.fr || ""}
                  onChange={(e) => handleTranslationChange("description", "fr", e.target.value)}
                  placeholder="Description du supermarché..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Description (Arabic)</Label>
                <Textarea
                  value={formData.description.ar || ""}
                  onChange={(e) => handleTranslationChange("description", "ar", e.target.value)}
                  placeholder="وصف السوبرماركت..."
                  rows={4}
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-neutral-200 pb-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Address</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">Street Address *</Label>
                    <Input
                      type="text"
                      value={formData.address.line1 || ""}
                      onChange={(e) => handleNestedChange("address", "line1", e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-neutral-700">Apt/Suite</Label>
                    <Input
                      type="text"
                      value={formData.address.line2 || ""}
                      onChange={(e) => handleNestedChange("address", "line2", e.target.value)}
                      placeholder="Apt 4B (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-neutral-700">City *</Label>
                      <Input
                        type="text"
                        value={formData.address.city || ""}
                        onChange={(e) => handleNestedChange("address", "city", e.target.value)}
                        placeholder="Paris"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-neutral-700">State/Region</Label>
                      <Input
                        type="text"
                        value={formData.address.state || ""}
                        onChange={(e) => handleNestedChange("address", "state", e.target.value)}
                        placeholder="Ile-de-France"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-neutral-700">Postal Code</Label>
                      <Input
                        type="text"
                        value={formData.address.postal_code || ""}
                        onChange={(e) => handleNestedChange("address", "postal_code", e.target.value)}
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-neutral-700">Country *</Label>
                      <Input
                        type="text"
                        value={formData.address.country || ""}
                        onChange={(e) => handleNestedChange("address", "country", e.target.value)}
                        placeholder="France"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-medium text-neutral-900">Contact Details</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+33123456789"
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="contact@supermarket.com"
                      className="pl-10"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://supermarket.com"
                      className="pl-10"
                    />
                    {errors.website && (
                      <p className="text-sm text-red-600">{errors.website}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="border-b border-neutral-200 pb-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">Additional Settings</h2>
            
            <div className="space-y-6">
              {/* Opening Hours */}
              <OpeningHoursEditor
                hours={formData.opening_hours}
                onChange={(newHours) => handleChange("opening_hours", newHours)}
              />

              {/* Categories */}
              <CategorySelector
                selectedCategories={formData.categories}
                onChange={(newCategories) => handleChange("categories", newCategories)}
                availableCategories={mockCategories}
              />

              {/* Social Links */}
              <SocialLinksEditor
                links={formData.social_links}
                onChange={(newLinks) => handleChange("social_links", newLinks)}
              />
            </div>
          </div>

          {/* Verification & Subscription */}
          <div>
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">Verification & Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Verified Supermarket</Label>
                <div className="relative">
                  <select
                    value={formData.is_verified ? "true" : "false"}
                    onChange={(e) => handleChange("is_verified", e.target.value === "true")}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
                  >
                    <option value="true">Yes, Verified</option>
                    <option value="false">No, Not Verified</option>
                  </select>
                </div>
                <p className="text-sm text-neutral-500">Verified supermarkets appear higher in search results</p>
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-neutral-900">Subscription Plan</Label>
                <div className="relative">
                  <select
                    value={formData.subscription_plan}
                    onChange={(e) => handleChange("subscription_plan", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
                  >
                    <option value="free">Free (Trial)</option>
                    <option value="basic">Basic (€25/month)</option>
                    <option value="premium">Premium (€50/month)</option>
                    <option value="enterprise">Enterprise (€100/month)</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="font-medium text-neutral-900">Subscription Status</Label>
                <div className="relative">
                  <select
                    value={formData.subscription_status}
                    onChange={(e) => handleChange("subscription_status", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="past_due">Past Due</option>
                    <option value="trialing">Trialing</option>
                    <option value="canceled">Canceled</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-recette-600 hover:bg-recette-700">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-8">
        <div className="border-b border-red-200 pb-6 mb-6">
          <h2 className="font-serif text-xl font-bold text-red-600 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Danger Zone
          </h2>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900">Delete Supermarket</h3>
              <p className="text-sm text-neutral-600">Once you delete this supermarket, all of its data will be permanently removed. This action cannot be undone.</p>
            </div>
            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Supermarket
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}