"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  images: string[];
  created_at: string;
  updated_at: string;
  category?: any;
  brand?: any;
  tags?: any;
}

interface AIProductWrapperProps {
  products: Product[];
}

export default function AIProductWrapper({ products }: AIProductWrapperProps) {
  const searchParams = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [isAISearch, setIsAISearch] = useState(false);

  useEffect(() => {
    const aiSearch = searchParams.get("ai_search");
    if (aiSearch === "true") {
      const stored = sessionStorage.getItem("aiSearchResults");
      if (stored) {
        try {
          const aiProductIds: string[] = JSON.parse(stored);
          // Filter products to only show AI-selected ones, maintaining order
          const aiProducts = aiProductIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => p !== undefined);
          
          setFilteredProducts(aiProducts);
          setIsAISearch(true);
          // Clear after reading
          sessionStorage.removeItem("aiSearchResults");
        } catch (e) {
          console.error("Error parsing AI search results:", e);
          setFilteredProducts(products);
        }
      } else {
        setFilteredProducts(products);
      }
    } else {
      setFilteredProducts(products);
    }
  }, [searchParams, products]);

  if (filteredProducts.length > 0) {
    return (
      <>
        {isAISearch && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              ✨ Showing AI-powered search results
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showNewBadge={true}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-lg mb-4">No products found.</p>
      <p className="text-gray-500">
        {isAISearch
          ? "Try a different search query or browse all products."
          : "Try adjusting your filters or search terms."}
      </p>
    </div>
  );
}

