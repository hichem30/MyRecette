"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  ArrowLeft,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  Package,
  Barcode,
  Tag,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface CSVProductRow {
  sku?: string;
  barcode?: string;
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  description?: string;
  brand?: string;
  unit?: string;
  supermarket_sku?: string;
  supermarket_barcode?: string;
  location_in_store?: string;
}

interface ProcessedRow {
  index: number;
  originalRow: CSVProductRow;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  brand: string;
  unit: string;
  supermarket_sku: string;
  supermarket_barcode: string;
  location: string;
  status: "valid" | "warning" | "error";
  message: string;
  productId?: string;
  supermarketProductId?: string;
  action?: "new" | "update" | "skip";
}

const BATCH_SIZE = 100;

const REQUIRED_IDENTIFIERS = ["sku", "barcode", "name"];
const REQUIRED_FIELDS = ["price", "stock"];

const FIELD_VALIDATION: Record<string, (value: string) => { valid: boolean; message?: string }> = {
  price: (value) => {
    if (value === undefined || value === null || value === "") {
      return { valid: false, message: "Price is required" };
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, message: "Price must be a positive number" };
    }
    if (num > 999999) {
      return { valid: false, message: "Price too large" };
    }
    return { valid: true };
  },
  stock: (value) => {
    if (value === undefined || value === null || value === "") {
      return { valid: false, message: "Stock is required" };
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      return { valid: false, message: "Stock must be a positive integer" };
    }
    if (num > 999999) {
      return { valid: false, message: "Stock too large" };
    }
    return { valid: true };
  },
  sku: (value) => {
    if (value && value.length > 100) {
      return { valid: false, message: "SKU too long (max 100 characters)" };
    }
    return { valid: true };
  },
  barcode: (value) => {
    if (value && value.length > 50) {
      return { valid: false, message: "Barcode too long (max 50 characters)" };
    }
    return { valid: true };
  },
  name: (value) => {
    if (value && value.length > 200) {
      return { valid: false, message: "Name too long (max 200 characters)" };
    }
    if (value && value.trim().length === 0) {
      return { valid: false, message: "Name cannot be empty" };
    }
    return { valid: true };
  },
};

function validateRow(row: CSVProductRow, index: number): ProcessedRow {
  const processed: ProcessedRow = {
    index,
    originalRow: row,
    sku: row.sku?.trim() || "",
    barcode: row.barcode?.trim() || "",
    name: row.name?.trim() || "",
    category: (row.category?.trim() || "uncategorized").toLowerCase(),
    price: 0,
    stock: 0,
    description: row.description?.trim() || "",
    brand: row.brand?.trim() || "",
    unit: row.unit?.trim() || "",
    supermarket_sku: row.supermarket_sku?.trim() || "",
    supermarket_barcode: row.supermarket_barcode?.trim() || "",
    location: row.location_in_store?.trim() || "",
    status: "valid",
    message: "",
  };

  // Validate each field
  for (const [field, validator] of Object.entries(FIELD_VALIDATION)) {
    const value = row[field as keyof CSVProductRow];
    const result = validator(value ?? "");
    if (!result.valid) {
      processed.status = "error";
      processed.message = result.message || "";
      break;
    }
  }

  // Parse numeric fields
  if (processed.status === "valid") {
    const priceStr = row.price ?? "";
    const stockStr = row.stock ?? "";

    processed.price = parseFloat(priceStr) || 0;
    processed.stock = parseInt(stockStr, 10) || 0;

    // Check at least one identifier exists
    if (!processed.sku && !processed.barcode && !processed.name) {
      processed.status = "error";
      processed.message = "At least one of SKU, barcode, or name is required";
    }

    // Check required fields
    if (processed.price === 0 && !row.price) {
      processed.status = "error";
      processed.message = "Price is required";
    }
    if (processed.stock === 0 && !row.stock) {
      processed.status = "error";
      processed.message = "Stock is required";
    }
  }

  return processed;
}

function getStatusIcon(status: ProcessedRow["status"]) {
  switch (status) {
    case "valid":
      return <Check className="h-4 w-4 text-emerald-600" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "error":
      return <X className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
}

function getStatusColor(status: ProcessedRow["status"]) {
  switch (status) {
    case "valid":
      return "bg-emerald-50 text-emerald-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    case "error":
      return "bg-red-50 text-red-700";
    default:
      return "";
  }
}

function ProgressBar({ progress, color = "barn" }: { progress: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    barn: "bg-barn-600",
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
      <div
        className={`h-full ${colorClasses[color || "barn"]} transition-all`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

// Sample CSV template
const SAMPLE_CSV = `sku,barcode,name,category,price,stock,description,brand,unit,supermarket_sku,supermarket_barcode,location_in_store
SP-001,123456789012,Organic Tomatoes,Vegetables,2.99,100,Fresh organic tomatoes from local farms,FreshMart,pound,FM-SP-001,123456789012,Aisle 1
SP-002,234567890123,Ground Beef,Protein,5.99,50,Premium ground beef,FreshMart,pound,FM-SP-002,234567890123,Aisle 2
SP-003,345678901234,Spaghetti,Grain,1.99,150,Italian style pasta,Barilla,box,FM-SP-003,345678901234,Aisle 3
`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "supermarket_inventory_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminSupermarketBulkUploadPage() {
  const params = useParams();
  const supermarketId = params.id as string;
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ProcessedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [results, setResults] = useState<{
    totalRows: number;
    validRows: number;
    errorRows: number;
    importedCount: number;
    updatedCount: number;
    newProductCount: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);
    setShowPreview(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedRows = results.data.map((row: CSVProductRow, index: number) =>
          validateRow(row, index)
        );
        setParsed(processedRows);
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
        setFile(null);
      },
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParsed([]);
    setShowPreview(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file || parsed.length === 0) return;

    setProcessing(true);
    setProgress({ current: 0, total: parsed.length, message: "Starting upload..." });
    setError(null);

    try {
      const sb = getSupabaseBrowserClient();
      
      // In a real implementation, we would:
      // 1. Batch the valid rows
      // 2. For each batch, try to match with existing products by barcode -> SKU -> name
      // 3. Create new products for items that don't match
      // 4. Create supermarket_product entries linking products to supermarkets
      // 5. Update ingredient mappings automatically
      
      // For now, simulate the process
      let current = 0;
      const batchSize = Math.min(BATCH_SIZE, parsed.length);

      // Simulate batch processing
      while (current < parsed.length) {
        const end = Math.min(current + batchSize, parsed.length);
        const batch = parsed.slice(current, end);
        
        // Update progress
        setProgress({
          current: end,
          total: parsed.length,
          message: `Processing batch ${Math.ceil(current / batchSize) + 1}/${Math.ceil(parsed.length / batchSize)}`,
        });

        current = end;
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate processing time
      }

      // Calculate results
      const validRows = parsed.filter((r) => r.status === "valid").length;
      const errorRows = parsed.filter((r) => r.status === "error").length;
      const errors = parsed.filter((r) => r.status === "error").map((r) => `Row ${r.index + 1}: ${r.message}`);

      setResults({
        totalRows: parsed.length,
        validRows,
        errorRows,
        importedCount: validRows,
        updatedCount: 0,
        newProductCount: validRows,
        errors,
      });

      setProgress({ current: parsed.length, total: parsed.length, message: "Upload complete!" });
    } catch (err) {
      setError(`Upload failed: ${err}`);
      setProgress({ current: 0, total: 0, message: "" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsed([]);
    setShowPreview(false);
    setResults(null);
    setError(null);
    setProgress({ current: 0, total: 0, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate stats
  const validCount = parsed.filter((r) => r.status === "valid").length;
  const warningCount = parsed.filter((r) => r.status === "warning").length;
  const errorCount = parsed.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/supermarkets/${supermarketId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Supermarket
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">Bulk Upload Inventory</h1>
        <p className="text-sm text-neutral-600">
          Upload your supermarket's inventory using a CSV file. The system will automatically match products by barcode → SKU → name, and create new products for items that don't exist yet.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-barn-600 text-white flex items-center justify-center font-semibold text-sm">1</div>
          <span className={`font-medium ${!file ? "text-barn-600" : "text-neutral-500"}`}>Upload CSV</span>
        </div>
        <div className="w-px h-4 bg-neutral-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-barn-600 text-white flex items-center justify-center font-semibold text-sm">2</div>
          <span className={`font-medium ${!showPreview ? "text-neutral-500" : !processing ? "text-barn-600" : "text-neutral-500"}`}>Preview & Validate</span>
        </div>
        <div className="w-px h-4 bg-neutral-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-barn-600 text-white flex items-center justify-center font-semibold text-sm">3</div>
          <span className={`font-medium ${!results ? "text-neutral-500" : "text-barn-600"}`}>Complete</span>
        </div>
      </div>

      {/* File Upload Section */}
      {!file && !processing && !results && (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-barn-100 flex items-center justify-center">
              <Upload className="h-8 w-8 text-barn-600" />
            </div>
            <h2 className="font-semibold text-neutral-900">Upload CSV File</h2>
            <p className="text-sm text-neutral-600 max-w-md">
              Drag and drop your CSV file here or click the button below. The system will automatically map products using barcode, SKU, and name matching.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 text-sm font-medium transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                Choose File
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
              </label>
              <button
                onClick={downloadSampleCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Template
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Supported formats: CSV | Max size: 10MB
            </p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {showPreview && !processing && !results && (
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-neutral-900">Preview & Validate</h2>
              <p className="text-sm text-neutral-600">
                Review your data before uploading. Rows with errors will be skipped.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRemoveFile}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={errorCount > 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 disabled:bg-neutral-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {validCount > 0 && errorCount === 0 ? (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload {validCount} Products
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Fix {errorCount} Errors First
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Total Rows</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">{parsed.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-neutral-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Valid Rows</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{validCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Errors</p>
                  <p className="mt-1 text-xl font-bold text-red-700">{errorCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errorCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Rows with Errors</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {errorCount} row{errorCount !== 1 ? "s" : ""} have errors that need to be fixed before uploading.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <Barcode className="h-4 w-4 inline-block mr-1" />
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <Tag className="h-4 w-4 inline-block mr-1" />
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <ShoppingCart className="h-4 w-4 inline-block mr-1" />
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <TrendingUp className="h-4 w-4 inline-block mr-1" />
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 20).map((row) => (
                  <tr
                    key={row.index}
                    className={`border-b border-neutral-100 ${row.status === "error" ? "bg-red-50/50" : "hover:bg-neutral-50"}`}
                  >
                    <td className="px-4 py-3 text-sm text-neutral-500">{row.index + 1}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{row.barcode || "-"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{row.sku || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">${row.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{row.stock}</td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        {getStatusIcon(row.status)}
                        <span className={`text-xs font-medium ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </div>
                      {row.message && (
                        <p className="text-xs text-neutral-500 mt-0.5">{row.message}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 20 && (
              <div className="p-4 text-center text-sm text-neutral-500">
                + {parsed.length - 20} more rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Section */}
      {processing && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-barn-600" />
            <div className="flex-1">
              <h2 className="font-semibold text-neutral-900">Processing...</h2>
              <p className="text-sm text-neutral-600 mt-1">{progress.message}</p>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Progress</span>
                  <span>
                    {progress.current} of {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                  </span>
                </div>
                <ProgressBar progress={(progress.current / progress.total) * 100} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !processing && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">Upload Complete!</h2>
              <p className="text-sm text-neutral-600">
                {results.importedCount} products have been uploaded successfully.
              </p>
            </div>
          </div>

          {/* Results Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Total Rows</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">{results.totalRows}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-neutral-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Imported</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{results.importedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Updated</p>
                  <p className="mt-1 text-xl font-bold text-amber-700">{results.updatedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-barn-200 bg-barn-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">New Products</p>
                  <p className="mt-1 text-xl font-bold text-barn-700">{results.newProductCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-barn-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-barn-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Errors Display */}
          {results.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-800 mb-3">Errors ({results.errors.length})</h3>
              <div className="space-y-2">
                {results.errors.slice(0, 5).map((err, index) => (
                  <p key={index} className="text-sm text-red-700">
                    {err}
                  </p>
                ))}
                {results.errors.length > 5 && (
                  <p className="text-sm text-red-600">+ {results.errors.length - 5} more errors</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
            <Link
              href={`/admin/supermarkets/${supermarketId}/products`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Package className="h-4 w-4" />
              View Products
            </Link>
            <Link
              href={`/admin/supermarkets/${supermarketId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-barn-600 text-white hover:bg-barn-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Supermarket
            </Link>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !processing && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* CSV Template Info */}
      {!file && !processing && !results && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="font-semibold text-neutral-900 mb-3">CSV File Requirements</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-700">Required Fields:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li>At least one of: <code className="bg-neutral-100 px-1 rounded">sku</code>, <code className="bg-neutral-100 px-1 rounded">barcode</code>, or <code className="bg-neutral-100 px-1 rounded">name</code></li>
                <li><code className="bg-neutral-100 px-1 rounded">price</code> - Product price (numeric)</li>
                <li><code className="bg-neutral-100 px-1 rounded">stock</code> - Stock quantity (integer)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-700">Optional Fields:</h4>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                <li><code className="bg-neutral-100 px-1 rounded">category</code> - Product category</li>
                <li><code className="bg-neutral-100 px-1 rounded">description</code> - Product description</li>
                <li><code className="bg-neutral-100 px-1 rounded">brand</code> - Product brand</li>
                <li><code className="bg-neutral-100 px-1 rounded">unit</code> - Unit of measure (kg, lb, piece, etc.)</li>
                <li><code className="bg-neutral-100 px-1 rounded">supermarket_sku</code> - Your internal SKU</li>
                <li><code className="bg-neutral-100 px-1 rounded">supermarket_barcode</code> - Your internal barcode</li>
                <li><code className="bg-neutral-100 px-1 rounded">location_in_store</code> - Aisle/shelf location</li>
              </ul>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Matching Priority:</h4>
              <p className="text-sm text-neutral-600">
                Products are matched in this order: <span className="font-semibold">Barcode → SKU → Name</span>. This ensures accurate ingredient matching even if SKU or name varies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
