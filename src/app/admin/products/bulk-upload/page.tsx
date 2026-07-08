"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { ArrowLeft, Upload, X, Check, AlertCircle, Loader2, FileText, Download } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { revalidateAdmin } from "@/lib/admin/revalidate";

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
  location: string;
  status: "valid" | "warning" | "error";
  message: string;
}

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
    location: row.location_in_store?.trim() || "",
    status: "valid",
    message: "",
  };

  // Check required fields
  const missingRequired = REQUIRED_FIELDS.filter(
    (field) => !row[field as keyof CSVProductRow] || row[field as keyof CSVProductRow]?.trim() === ""
  );
  
  if (missingRequired.length > 0) {
    processed.status = "error";
    processed.message = `Missing required fields: ${missingRequired.join(", ")}`;
    return processed;
  }

  // Check at least one identifier
  const hasIdentifier = REQUIRED_IDENTIFIERS.some(
    (field) => row[field as keyof CSVProductRow] && row[field as keyof CSVProductRow]?.trim() !== ""
  );
  
  if (!hasIdentifier) {
    processed.status = "error";
    processed.message = "At least one identifier required: sku, barcode, or name";
    return processed;
  }

  // Validate individual fields
  for (const [field, validator] of Object.entries(FIELD_VALIDATION)) {
    const fieldValue = row[field as keyof CSVProductRow];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== "") {
      const result = validator(fieldValue);
      if (!result.valid) {
        processed.status = "error";
        processed.message = result.message || `Invalid ${field}`;
        return processed;
      }
    }
  }

  // Parse numeric fields
  processed.price = parseFloat(row.price || "0");
  processed.stock = parseInt(row.stock || "0", 10);

  return processed;
}

function getStatusColor(status: "valid" | "warning" | "error") {
  switch (status) {
    case "error":
      return "bg-red-50 text-red-700";
    case "warning":
      return "bg-amber-50 text-amber-700";
    case "valid":
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

function getStatusIcon(status: "valid" | "warning" | "error") {
  switch (status) {
    case "error":
      return <X className="h-3 w-3" />;
    case "warning":
      return <AlertCircle className="h-3 w-3" />;
    case "valid":
    default:
      return <Check className="h-3 w-3" />;
  }
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<ProcessedRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    totalRows?: number;
    validRows?: number;
    errorRows?: number;
    importedCount?: number;
    updatedCount?: number;
    newProductCount?: number;
    errors?: string[];
    supermarketName?: string;
  } | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sb = getSupabaseBrowserClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (uploadedFile: File) => {
    // Validate file type and size first
    if (uploadedFile.size === 0) {
      alert("File is empty.");
      return;
    }

    const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv") {
      alert("Invalid file type. Please upload a CSV file.");
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    setFile(uploadedFile);
    setIsPreviewing(true);
    setPreview([]);
    setUploadResult(null);

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: { data: unknown[] }) => {
        const rows = results.data as CSVProductRow[];
        const processed: ProcessedRow[] = [];

        for (let i = 0; i < rows.length; i++) {
          processed.push(validateRow(rows[i], i + 1));
        }

        setPreview(processed);
        setIsPreviewing(false);
      },
      error: (error: { message: string }) => {
        alert(`Error parsing CSV: ${error.message}`);
        setIsPreviewing(false);
      },
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const template = `sku,barcode,name,category,price,stock,description,brand,unit,location_in_store
PROD001,12345678,Organic Tomatoes,produce,2.99,50,Vine ripened organic tomatoes,Acme Farm,kg,
PROD002,87654321,Free Range Eggs,produce,3.50,100,Large free range eggs,Happy Farms,dozen,
PROD003,,Whole Wheat Bread,bakery,4.50,25,Artisan whole wheat bread,Local Bakery,loaf,Aisle 3
`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;

    const validRows = preview.filter((r) => r.status !== "error");
    if (validRows.length === 0) {
      alert("No valid rows to import. Please fix errors in your CSV.");
      return;
    }

    if (!confirm(`Are you sure you want to import ${validRows.length} valid rows?`)) {
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/supermarket/bulk-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        // Refresh products list
        await revalidateAdmin("products");
      }
    } catch (error) {
      setUploadResult({
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(100);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate stats
  const totalRows = preview.length;
  const validRows = preview.filter((r) => r.status === "valid").length;
  const warningRows = preview.filter((r) => r.status === "warning").length;
  const errorRows = preview.filter((r) => r.status === "error").length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/products"
              className="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Bulk Upload Products</h1>
            <p className="text-sm text-neutral-500">
              Upload a CSV file to add or update multiple products at once.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            {!file && !isPreviewing && !uploadResult ? (
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  isDragging ? "border-recette-500 bg-recette-50" : "border-neutral-300 bg-neutral-50"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <Upload className="h-12 w-12 mx-auto text-neutral-400" />
                </div>
                <p className="text-neutral-600 mb-2">
                  Drag and drop your CSV file here, or
                </p>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-1 px-4 py-2 bg-recette-600 text-white font-medium rounded-lg hover:bg-recette-700 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  Select File
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-neutral-400 mt-4">
                  Supported format: CSV only (max 10MB)
                </p>
              </div>
            ) : null}

            {/* File Selected */}
            {file && !isPreviewing && !isProcessing && !uploadResult && (
              <div className="flex items-center justify-between p-4 bg-recette-50 rounded-lg border border-recette-200">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-recette-600" />
                  <div>
                    <p className="font-medium text-neutral-900">{file.name}</p>
                    <p className="text-sm text-neutral-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Template Download */}
            <div className="flex items-center justify-end mt-4">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-recette-600 bg-recette-50 rounded-lg hover:bg-recette-100"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV Template
              </button>
            </div>
          </div>

          {/* Preview Section */}
          {isPreviewing && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-2 text-recette-600 mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing CSV...</span>
              </div>
            </div>
          )}

          {preview.length > 0 && !isPreviewing && !isProcessing && !uploadResult && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              {/* Preview Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="px-4 py-2 bg-neutral-100 rounded-lg">
                  <p className="text-2xl font-bold text-neutral-900">{totalRows}</p>
                  <p className="text-xs text-neutral-500">Total Rows</p>
                </div>
                <div className="px-4 py-2 bg-emerald-100 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">{validRows}</p>
                  <p className="text-xs text-emerald-600">Valid</p>
                </div>
                <div className="px-4 py-2 bg-amber-100 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{warningRows}</p>
                  <p className="text-xs text-amber-600">Warnings</p>
                </div>
                <div className="px-4 py-2 bg-red-100 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{errorRows}</p>
                  <p className="text-xs text-red-600">Errors</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="p-3 text-left">Row</th>
                      <th className="p-3 text-left">Identifier</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Stock</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((row) => (
                      <tr
                        key={row.index}
                        className={`border-t border-neutral-100 ${getStatusColor(row.status)}`}
                      >
                        <td className="p-3">{row.index}</td>
                        <td className="p-3">
                          {row.sku && (
                            <span className="block text-xs font-medium text-neutral-600">
                              SKU: {row.sku}
                            </span>
                          )}
                          {row.barcode && (
                            <span className="block text-xs font-medium text-neutral-600">
                              Barcode: {row.barcode}
                            </span>
                          )}
                          {!row.sku && !row.barcode && row.name && (
                            <span className="block text-xs font-medium text-neutral-600">
                              Name: {row.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-40 truncate">{row.name || "N/A"}</td>
                        <td className="p-3">{row.category}</td>
                        <td className="p-3">€{row.price.toFixed(2)}</td>
                        <td className="p-3">{row.stock}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(row.status)}
                            <span className="text-xs font-medium">{row.status.toUpperCase()}</span>
                          </div>
                          {row.message && (
                            <span className="block text-xs text-neutral-500 mt-1">{row.message}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {preview.length > 50 && (
                      <tr>
                        <td colSpan={7} className="p-3 text-center text-xs text-neutral-400">
                          + {preview.length - 50} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleRemoveFile}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={errorRows > 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-recette-600 rounded-lg hover:bg-recette-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {errorRows > 0 ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Fix Errors First
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload {validRows} Products
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-recette-600" />
                  <div>
                    <p className="font-medium text-neutral-900">Uploading...</p>
                    <p className="text-sm text-neutral-500">
                      Processing {preview.filter((r) => r.status !== "error").length} products
                    </p>
                  </div>
                </div>
                <div className="w-64 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-recette-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={`rounded-xl border p-6 ${
                uploadResult.success
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-full ${
                    uploadResult.success ? "bg-emerald-100" : "bg-red-100"
                  }`}
                >
                  {uploadResult.success ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {uploadResult.success ? "Upload Successful!" : "Upload Failed"}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {uploadResult.success
                      ? `Successfully processed ${uploadResult.totalRows} rows for ${uploadResult.supermarketName || "your supermarket"}.`
                      : uploadResult.errors?.join(", ")}
                  </p>

                  {uploadResult.success && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200">
                        <p className="text-2xl font-bold text-neutral-900">
                          {uploadResult.totalRows}
                        </p>
                        <p className="text-xs text-neutral-500">Total Rows</p>
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200">
                        <p className="text-2xl font-bold text-emerald-700">
                          {uploadResult.importedCount}
                        </p>
                        <p className="text-xs text-neutral-500">New Supermarket Products</p>
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200">
                        <p className="text-2xl font-bold text-amber-700">
                          {uploadResult.updatedCount}
                        </p>
                        <p className="text-xs text-neutral-500">Updated Products</p>
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200">
                        <p className="text-2xl font-bold text-neutral-700">
                          {uploadResult.newProductCount}
                        </p>
                        <p className="text-xs text-neutral-500">New Products</p>
                      </div>
                    </div>
                  )}

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-red-600 mb-2">
                        Errors ({uploadResult.errors.length}):
                      </p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {uploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>- {error}</li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li className="text-neutral-500">+ {uploadResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {uploadResult.success && (
                      <button
                        onClick={() => router.push("/admin/products")}
                        className="px-4 py-2 text-sm font-medium text-white bg-recette-600 rounded-lg hover:bg-recette-700"
                      >
                        View Products
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                    >
                      Upload Another File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
