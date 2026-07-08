-- Migration: Add French product names to eliminate manual translations
-- Date: 2026-07-08
-- Purpose: Database-driven product naming system (no more manual "potato", "tomato" entries)

-- Step 1: Add French name column to products table
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS name_fr TEXT;

-- Step 2: Add French description column for completeness
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- Step 3: Add index for faster French name lookups
CREATE INDEX IF NOT EXISTS idx_products_name_fr ON products(name_fr);

-- Step 4: Create a dedicated product translations table for multi-language support
CREATE TABLE IF NOT EXISTS product_translations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lang VARCHAR(10) NOT NULL DEFAULT 'fr',
    name TEXT NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, lang)
);

-- Step 5: Create index on product_translations for performance
CREATE INDEX IF NOT EXISTS idx_product_translations_product_lang ON product_translations(product_id, lang);

-- Step 6: Create a cache table for frequently accessed products
CREATE TABLE IF NOT EXISTS product_name_cache (
    sku VARCHAR(50) PRIMARY KEY,
    lang VARCHAR(10) DEFAULT 'fr',
    name TEXT NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sku, lang)
);

-- Step 7: Create a function to get product name with fallback
CREATE OR REPLACE FUNCTION get_product_name(
    p_sku VARCHAR(50),
    p_lang VARCHAR(10) DEFAULT 'fr'
)
RETURNS TEXT AS $$
BEGIN
    -- Try to get from cache first
    RETURN (
        SELECT name 
        FROM product_name_cache 
        WHERE sku = p_sku AND lang = p_lang
    );
    
    IF FOUND THEN
        -- Update access time
        UPDATE product_name_cache 
        SET accessed_at = NOW() 
        WHERE sku = p_sku AND lang = p_lang;
        RETURN;
    END IF;
    
    -- Try to get from translations table
    RETURN (
        SELECT name 
        FROM product_translations 
        WHERE product_id = (SELECT id FROM products WHERE sku = p_sku) 
        AND lang = p_lang
    );
    
    IF FOUND THEN
        -- Cache the result
        INSERT INTO product_name_cache (sku, lang, name)
        VALUES (p_sku, p_lang, RETURNING.name)
        ON CONFLICT (sku, lang) DO UPDATE SET name = EXCLUDED.name, accessed_at = NOW();
        RETURN;
    END IF;
    
    -- Try to get from products table directly
    RETURN (
        SELECT COALESCE(name_fr, name, sku) 
        FROM products 
        WHERE sku = p_sku
    );
    
    IF FOUND THEN
        -- Cache the result
        INSERT INTO product_name_cache (sku, lang, name)
        VALUES (p_sku, p_lang, COALESCE(name_fr, name, sku))
        ON CONFLICT (sku, lang) DO UPDATE SET name = EXCLUDED.name, accessed_at = NOW();
        RETURN;
    END IF;
    
    -- Ultimate fallback: return the SKU
    RETURN p_sku;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create a function to update product French name
CREATE OR REPLACE FUNCTION update_product_french_name(
    p_sku VARCHAR(50),
    p_name TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the main products table
    UPDATE products 
    SET name_fr = p_name, description_fr = p_description, updated_at = NOW()
    WHERE sku = p_sku;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert into translations table
    INSERT INTO product_translations (product_id, lang, name, description, updated_at)
    VALUES (
        (SELECT id FROM products WHERE sku = p_sku),
        'fr',
        p_name,
        p_description,
        NOW()
    )
    ON CONFLICT (product_id, lang) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at;
    
    -- Invalidate cache
    DELETE FROM product_name_cache WHERE sku = p_sku AND lang = 'fr';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create a trigger to keep cache in sync
CREATE OR REPLACE FUNCTION sync_product_name_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an update to name_fr
    IF NEW.name_fr IS DISTINCT FROM OLD.name_fr THEN
        -- Update cache for French
        INSERT INTO product_name_cache (sku, lang, name)
        VALUES (NEW.sku, 'fr', COALESCE(NEW.name_fr, NEW.name, NEW.sku))
        ON CONFLICT (sku, lang) 
        DO UPDATE SET name = EXCLUDED.name, accessed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers
DROP TRIGGER IF EXISTS trg_products_name_fr_update ON products;
CREATE TRIGGER trg_products_name_fr_update
    AFTER UPDATE OF name_fr, name, sku ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_name_cache();

DROP TRIGGER IF EXISTS trg_products_insert_cache ON products;
CREATE TRIGGER trg_products_insert_cache
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_name_cache();

-- Step 11: Create a view for easy access
CREATE OR REPLACE VIEW products_with_french AS
SELECT 
    p.*,
    COALESCE(p.name_fr, p.name, p.sku) as display_name_fr,
    COALESCE(p.description_fr, p.description) as display_description_fr
FROM products p;

-- Step 12: Populate existing products with French names if they have them
-- This is a one-time migration that you can run manually
-- UPDATE products SET name_fr = name WHERE name_fr IS NULL;

COMMENT ON TABLE product_translations IS 'Multi-language product translations (replaces manual translation files) ';
COMMENT ON TABLE product_name_cache IS 'Cache for frequently accessed product names to improve performance';
COMMENT ON FUNCTION get_product_name(VARCHAR, VARCHAR) IS 'Get product name in specified language with fallbacks: cache -> translations -> products -> sku';

-- Step 13: Create a function to preload common products into cache
CREATE OR REPLACE FUNCTION preload_product_name_cache(p_limit INT DEFAULT 100)
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- Clear old cache entries
    DELETE FROM product_name_cache WHERE accessed_at < NOW() - INTERVAL '30 days';
    
    -- Preload top products
    INSERT INTO product_name_cache (sku, lang, name)
    SELECT 
        p.sku,
        'fr',
        COALESCE(p.name_fr, p.name, p.sku)
    FROM products p
    ORDER BY p.popularity DESC, p.created_at DESC
    LIMIT p_limit
    ON CONFLICT (sku, lang) DO NOTHING;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;