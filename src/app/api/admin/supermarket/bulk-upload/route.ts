import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Papa from "papaparse";

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
  productId?: string;
  supermarketProductId?: string;
  action?: "new" | "update" | "skip";
}

const BATCH_SIZE = 100;

const REQUIRED_IDENTIFIERS = ["sku", "barcode", "name"];
const REQUIRED_FIELDS = ["price", "stock"];

// Field validation rules
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

async function getSupermarketId(sb: ReturnType<typeof createServerClient>) {
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("id, role, is_supermarket")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return null;
  }

  // Only admins and supermarkets can access this
  if (!profile.is_supermarket && profile.role !== "admin") {
    return null;
  }

  return profile.id;
}

async function getSupermarketIdForAdmin(sb: ReturnType<typeof createServerClient>, targetSupermarketId?: string) {
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select("id, role, is_supermarket")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    return null;
  }

  // Admins can specify a supermarket, supermarkets can only manage their own
  if (targetSupermarketId) {
    // Check if admin
    if (profile.role !== "admin") {
      return null; // Non-admins cannot specify a supermarket
    }
    return targetSupermarketId;
  }

  // Supermarkets can only manage their own
  if (profile.is_supermarket) {
    return profile.id;
  }

  // Admins without target get error
  return null;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, maxAge: 60 * 60 });
        },
        remove(name: string) {
          cookieStore.set({ name, value: "", maxAge: 0 });
        },
      },
    }
  );

  // Get supermarket ID
  const supermarketId = await getSupermarketIdForAdmin(sb);
  
  if (!supermarketId) {
    return NextResponse.json(
      { error: "Unauthorized. Only supermarkets or admins can upload products." },
      { status: 401 }
    );
  }

  // Get supermarket profile to confirm
  const { data: supermarket, error: supermarketErr } = await sb
    .from("profiles")
    .select("id, is_supermarket, supermarket_name")
    .eq("id", supermarketId)
    .maybeSingle();

  if (supermarketErr || !supermarket) {
    return NextResponse.json(
      { error: "Supermarket not found." },
      { status: 404 }
    );
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided. Please upload a CSV file." },
      { status: 400 }
    );
  }

  // Check file type
  if (file.size === 0) {
    return NextResponse.json(
      { error: "File is empty." },
      { status: 400 }
    );
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (fileExtension !== "csv") {
    return NextResponse.json(
      { error: "Invalid file type. Please upload a CSV file." },
      { status: 400 }
    );
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  try {
    // Parse CSV
    const text = await file.text();
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    const rows = parseResult.data as CSVProductRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No data found in CSV file." },
        { status: 400 }
      );
    }

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing errors",
          details: parseResult.errors.map((e: { message: string }) => e.message),
        },
        { status: 400 }
      );
    }

    // Validate all rows
    const processedRows: ProcessedRow[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const validated = validateRow(rows[i], i + 1);
      processedRows.push(validated);
      if (validated.status === "error") {
        validationErrors.push(`Row ${i + 1}: ${validated.message}`);
      }
    }

    const validRows = processedRows.filter((r) => r.status !== "error");
    const errorRows = processedRows.filter((r) => r.status === "error");

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          error: "All rows have errors",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // Process in batches
    const results = {
      totalRows: rows.length,
      validRows: validRows.length,
      errorRows: errorRows.length,
      importedCount: 0,
      updatedCount: 0,
      newProductCount: 0,
      ingredientsExtracted: 0,
      ingredientsNeedsReview: 0,
      errors: validationErrors,
      details: [] as Array<{
        row: number;
        productId: string | null;
        action: string;
        status: string;
        message: string;
        ingredientsExtracted: number;
        ingredientsNeedsReview: boolean;
      }>,
    };

    // Get admin client for batch processing
    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder",
      {
        cookies: {
          get() { return ""; },
          set() {},
          remove() {},
        },
      }
    );

    // Process in batches
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      // Build JSON array for PostgreSQL function
      const batchJson = batch.map((row) => ({
        sku: row.sku || null,
        barcode: row.barcode || null,
        name: row.name || null,
        category: row.category,
        price: row.price.toString(),
        stock: row.stock.toString(),
        description: row.description || null,
        brand: row.brand || null,
        unit: row.unit || null,
        location_in_store: row.location || null,
      }));

      try {
        const { data: batchResults, error: batchError } = await adminSb
          .rpc("process_supermarket_csv_batch_with_ingredients", {
            p_supermarket_id: supermarketId,
            p_rows: batchJson,
          });

        if (batchError) {
          throw batchError;
        }

        if (batchResults) {
          for (const result of batchResults) {
            results.details.push({
              row: result.row_index,
              productId: result.product_id || null,
              action: result.action || "unknown",
              status: result.status,
              message: result.message || "",
              ingredientsExtracted: result.ingredients_extracted || 0,
              ingredientsNeedsReview: result.ingredients_needs_review || false,
            });

            if (result.status === "success") {
              if (result.action === "insert_new") {
                results.newProductCount++;
              } else if (result.action === "insert") {
                results.importedCount++;
              } else if (result.action === "update") {
                results.updatedCount++;
              }
              results.ingredientsExtracted += result.ingredients_extracted || 0;
              if (result.ingredients_needs_review) {
                results.ingredientsNeedsReview++;
              }
            }
          }
        }
      } catch (batchProcessError) {
        // Log batch error but continue with next batch
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, batchProcessError);
        
        for (const row of batch) {
          results.details.push({
            row: row.index,
            productId: null,
            action: "error",
            status: "error",
            message: `Batch processing error: ${batchProcessError instanceof Error ? batchProcessError.message : String(batchProcessError)}`,
            ingredientsExtracted: 0,
            ingredientsNeedsReview: false,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      supermarketId,
      supermarketName: supermarket.supermarket_name?.en || "Unknown",
      ...results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process CSV: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
