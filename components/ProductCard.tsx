"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/database";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils/currency";

interface ProductCardProps {
  product: Product;
  showNewBadge?: boolean;
}

export default function ProductCard({
  product,
  showNewBadge = false,
}: ProductCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isNew] = useState(() => {
    // Show NEW badge for products created in last 30 days
    if (showNewBadge) return true;
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const daysSinceCreation =
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30;
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    // Save to localStorage
    const savedFavourites = localStorage.getItem("favourites");
    let favourites: string[] = savedFavourites
      ? JSON.parse(savedFavourites)
      : [];

    if (newLikedState) {
      if (!favourites.includes(product.id)) {
        favourites.push(product.id);
      }
    } else {
      favourites = favourites.filter((id) => id !== product.id);
    }

    localStorage.setItem("favourites", JSON.stringify(favourites));
  };

  useEffect(() => {
    // Check if product is in favourites
    const savedFavourites = localStorage.getItem("favourites");
    if (savedFavourites) {
      try {
        const favourites: string[] = JSON.parse(savedFavourites);
        setIsLiked(favourites.includes(product.id));
      } catch (e) {
        console.error("Error reading favourites:", e);
      }
    }
  }, [product.id]);

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "https://via.placeholder.com/400x400?text=No+Image";
  const categoryName = product.category?.name || "Uncategorized";

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className="group relative bg-black rounded-xl md:rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square overflow-hidden bg-black">
          {!imageError ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <span className="text-gray-600 text-xs md:text-sm">No Image</span>
            </div>
          )}
          {isNew && (
            <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-blue-500 text-white text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded">
              NEW
            </div>
          )}
          <button
            onClick={handleLike}
            className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors z-10"
          >
            <Heart
              className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${
                isLiked ? "fill-white text-white" : "text-white"
              }`}
            />
          </button>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white font-semibold text-xs md:text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        <div className="p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wide line-clamp-1">
            {categoryName}
          </p>
          <h3 className="font-semibold text-white mb-1 md:mb-2 line-clamp-2 text-xs md:text-sm">
            {product.name}
          </h3>
          {/* Brand */}
          {(product as any).brand && (product as any).brand.name && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/products?search=${encodeURIComponent((product as any).brand.name)}`);
              }}
              className="inline-block mb-1.5"
            >
              <span className="inline-block px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] md:text-[10px] rounded-full border border-purple-500/30 font-medium hover:bg-purple-500/30 transition-colors">
                {(product as any).brand.name}
              </span>
            </button>
          )}

          {/* Tags */}
          {(product as any).tags &&
            Array.isArray((product as any).tags) &&
            (product as any).tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(product as any).tags
                  .slice(0, 3)
                  .map((pt: any, idx: number) => {
                    // Handle nested structure: tags:product_tags(tag:tags(*)) returns [{tag: {id, name}}, ...]
                    let tag = null;
                    if (pt && typeof pt === "object") {
                      tag = pt.tag || pt;
                    }

                    const tagName = tag?.name;
                    const tagId = tag?.id || `tag-${idx}`;

                    if (!tagName) return null;

                    return (
                      <button
                        key={tagId}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/products?search=${encodeURIComponent(tagName)}`);
                        }}
                        className="inline-block px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] md:text-[10px] rounded-full border border-blue-500/30 font-medium hover:bg-blue-500/30 transition-colors cursor-pointer"
                      >
                        {tagName}
                      </button>
                    );
                  })}
                {(product as any).tags.length > 3 && (
                  <span className="inline-block px-1.5 py-0.5 bg-gray-800 text-gray-400 text-[9px] md:text-[10px] rounded-full border border-white/10">
                    +{(product as any).tags.length - 3}
                  </span>
                )}
              </div>
            )}
          <p className="text-xs md:text-sm text-gray-400 font-medium">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
