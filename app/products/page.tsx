import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import ProductFilters from "@/components/ProductFilters";
import AIProductWrapper from "@/components/AIProductWrapper";

type SearchParams = { [key: string]: string | string[] | undefined };

async function getProducts(searchParams: SearchParams | undefined) {
  const supabase = await createClient();

  // Helper to get string value from searchParams
  const getParam = (key: string): string | undefined => {
    if (!searchParams) return undefined;
    const value = searchParams[key];
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value[0];
    if (typeof value === "string") return value;
    return undefined;
  };

  try {
    // First, try to query products table directly to check if it exists
    const { data: testData, error: testError } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Products table not found in database!");
      console.error("Error code:", testError.code);
      console.error("Error message:", testError.message);
      console.error("");
      console.error("📋 To fix this issue:");
      console.error("1. Go to your Supabase Dashboard");
      console.error("2. Navigate to SQL Editor");
      console.error("3. Run the supabase-schema.sql file to create all tables");
      console.error("4. Verify the tables exist in Table Editor");
      console.error(
        "5. Make sure you are using the correct Supabase project URL and API key"
      );
      console.error("");
      console.error("Full error details:", JSON.stringify(testError, null, 2));
      return [];
    }

    // Get all filter parameters
    const category = getParam("category");
    const brands = getParam("brands");
    const search = getParam("search");
    const tags = getParam("tags");

    // Step 1: Collect all matching product IDs from each filter
    const allProductIdSets: Set<string>[] = [];
    const needsIdCollection = search || tags;

    // Category filter - only collect if we have tags (search already filters by category)
    if (category && tags && !search) {
      const { data: categoryProducts } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", category)
        .gt("stock", 0);

      if (categoryProducts && categoryProducts.length > 0) {
        allProductIdSets.push(new Set(categoryProducts.map((p: any) => p.id)));
      } else {
        return [];
      }
    }

    // Brand filter - only collect IDs if we have search or tags (which require intersection)
    // Otherwise, we'll apply it directly to the query
    if (brands && needsIdCollection) {
      const brandIds = brands.split(",").filter(Boolean);
      if (brandIds.length > 0) {
        let brandQuery = supabase
          .from("products")
          .select("id")
          .in("brand_id", brandIds)
          .gt("stock", 0);

        if (category) {
          brandQuery = brandQuery.eq("category_id", category);
        }

        const { data: brandProducts } = await brandQuery;
        if (brandProducts && brandProducts.length > 0) {
          allProductIdSets.push(new Set(brandProducts.map((p: any) => p.id)));
        } else {
          return [];
        }
      }
    }

    // Search filter - name, description, brand name, tags
    if (search) {
      const searchIds = new Set<string>();

      // Products by name/description
      let nameDescQuery = supabase
        .from("products")
        .select("id")
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        .gt("stock", 0);

      if (category) {
        nameDescQuery = nameDescQuery.eq("category_id", category);
      }
      if (brands) {
        const brandIds = brands.split(",").filter(Boolean);
        if (brandIds.length > 0) {
          nameDescQuery = nameDescQuery.in("brand_id", brandIds);
        }
      }

      const { data: nameDescProducts } = await nameDescQuery;
      if (nameDescProducts) {
        nameDescProducts.forEach((p: any) => searchIds.add(p.id));
      }

      // Products by brand name
      const { data: matchingBrands } = await supabase
        .from("brands")
        .select("id")
        .ilike("name", `%${search}%`);

      if (matchingBrands && matchingBrands.length > 0) {
        const matchingBrandIds = matchingBrands.map((b) => b.id);
        let brandNameQuery = supabase
          .from("products")
          .select("id")
          .in("brand_id", matchingBrandIds)
          .gt("stock", 0);

        if (category) {
          brandNameQuery = brandNameQuery.eq("category_id", category);
        }
        if (brands) {
          const selectedBrandIds = brands.split(",").filter(Boolean);
          // Only include brands that match both search and selected brands
          const intersection = matchingBrandIds.filter((id) =>
            selectedBrandIds.includes(id)
          );
          if (intersection.length > 0) {
            brandNameQuery = brandNameQuery.in("brand_id", intersection);
          } else {
            // No intersection, skip this
          }
        }

        const { data: brandNameProducts } = await brandNameQuery;
        if (brandNameProducts) {
          brandNameProducts.forEach((p: any) => searchIds.add(p.id));
        }
      }

      // Products by tags
      const { data: matchingTags } = await supabase
        .from("tags")
        .select("id")
        .ilike("name", `%${search}%`);

      if (matchingTags && matchingTags.length > 0) {
        const tagIds = matchingTags.map((t) => t.id);
        const { data: taggedProducts } = await supabase
          .from("product_tags")
          .select("product_id")
          .in("tag_id", tagIds);

        if (taggedProducts && taggedProducts.length > 0) {
          const taggedProductIds = [
            ...new Set(taggedProducts.map((pt: any) => pt.product_id)),
          ];

          let taggedQuery = supabase
            .from("products")
            .select("id")
            .in("id", taggedProductIds)
            .gt("stock", 0);

          if (category) {
            taggedQuery = taggedQuery.eq("category_id", category);
          }
          if (brands) {
            const brandIds = brands.split(",").filter(Boolean);
            if (brandIds.length > 0) {
              taggedQuery = taggedQuery.in("brand_id", brandIds);
            }
          }

          const { data: filteredTagged } = await taggedQuery;
          if (filteredTagged) {
            filteredTagged.forEach((p: any) => searchIds.add(p.id));
          }
        }
      }

      if (searchIds.size > 0) {
        allProductIdSets.push(searchIds);
      } else {
        return [];
      }
    }

    // Tag filter (separate from search)
    if (tags) {
      const tagIds = tags.split(",").filter(Boolean);
      if (tagIds.length > 0) {
        const { data: taggedProducts } = await supabase
          .from("product_tags")
          .select("product_id")
          .in("tag_id", tagIds);

        if (taggedProducts && taggedProducts.length > 0) {
          const taggedProductIds = [
            ...new Set(taggedProducts.map((pt: any) => pt.product_id)),
          ];

          let taggedQuery = supabase
            .from("products")
            .select("id")
            .in("id", taggedProductIds)
            .gt("stock", 0);

          if (category) {
            taggedQuery = taggedQuery.eq("category_id", category);
          }
          if (brands) {
            const brandIds = brands.split(",").filter(Boolean);
            if (brandIds.length > 0) {
              taggedQuery = taggedQuery.in("brand_id", brandIds);
            }
          }

          const { data: filteredTagged } = await taggedQuery;
          if (filteredTagged && filteredTagged.length > 0) {
            allProductIdSets.push(
              new Set(filteredTagged.map((p: any) => p.id))
            );
          } else {
            return [];
          }
        } else {
          return [];
        }
      }
    }

    // Step 2: Intersect all product ID sets (products must match ALL active filters)
    let finalProductIds: string[] = [];
    if (allProductIdSets.length > 0) {
      // Start with first set
      finalProductIds = Array.from(allProductIdSets[0]);
      // Intersect with remaining sets
      for (let i = 1; i < allProductIdSets.length; i++) {
        finalProductIds = finalProductIds.filter((id) =>
          allProductIdSets[i].has(id)
        );
      }
    }

    // Step 3: Build final query
    let query = supabase
      .from("products")
      .select(
        "*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))"
      )
      .gt("stock", 0);

    // Apply category filter (if not already in productIds)
    if (category && !needsIdCollection) {
      query = query.eq("category_id", category);
    }

    // Apply brand filter (if not already in productIds)
    if (brands && !needsIdCollection) {
      const brandIds = brands.split(",").filter(Boolean);
      if (brandIds.length > 0) {
        query = query.in("brand_id", brandIds);
      }
    }

    // Apply final product ID filter if we have specific IDs
    if (finalProductIds.length > 0) {
      query = query.in("id", finalProductIds);
    } else if (needsIdCollection && (search || tags)) {
      // If we were collecting IDs (search/tags) but got no results after intersection
      return [];
    }
    // Note: If we applied filters directly (brands/category without search/tags),
    // we let the query execute normally - don't return empty here

    // Sort
    const sortBy = getParam("sort") || "created_at";
    const sortOrder = getParam("order") === "asc" ? "asc" : "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Try fallback query without join if join fails
      if (
        error.code === "PGRST116" ||
        error.message?.includes("relation") ||
        error.message?.includes("schema")
      ) {
        console.log("Attempting fallback query without category join...");
        const fallbackQuery = supabase
          .from("products")
          .select("*")
          .gt("stock", 0);

        const category = getParam("category");
        if (category) {
          fallbackQuery.eq("category_id", category);
        }

        const { data: fallbackData, error: fallbackError } =
          await fallbackQuery;

        if (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          return [];
        }

        return fallbackData || [];
      }

      return [];
    }

    console.log(`Fetched ${data?.length || 0} products`);
    return data || [];
  } catch (err) {
    console.error("Unexpected error in getProducts:", err);
    return [];
  }
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data || [];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  // Handle both sync and async searchParams (Next.js 15+ compatibility)
  const resolvedSearchParams: SearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams || {};
  const products = await getProducts(resolvedSearchParams);
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              All Products
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Browse the complete ABR collection.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Suspense
              fallback={<div className="text-white">Loading filters...</div>}
            >
              <ProductFilters categories={categories} />
            </Suspense>
          </div>
        </div>

        <AIProductWrapper products={products} />
      </div>
    </div>
  );
}
