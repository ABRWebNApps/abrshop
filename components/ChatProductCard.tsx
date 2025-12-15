"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";

interface ChatProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category?: { name: string };
    brand?: { name: string };
    tags?: Array<{ tag?: { name: string } }>;
  };
  isRecommendation?: boolean;
}

export default function ChatProductCard({
  product,
  isRecommendation = false,
}: ChatProductCardProps) {
  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "https://via.placeholder.com/300x300?text=No+Image";

  const categoryName = product.category?.name || "Product";
  const brandName = product.brand?.name;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`block group ${
        isRecommendation ? "opacity-90 hover:opacity-100" : ""
      }`}
    >
      <div className="bg-gray-900 rounded-lg border border-white/10 hover:border-white/20 transition-all p-2 md:p-3">
        <div className="flex gap-2 md:gap-3">
          <div className="relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-white text-sm md:text-base line-clamp-1 group-hover:text-blue-400 transition-colors">
                {product.name}
              </h4>
              {isRecommendation && (
                <span className="text-xs text-blue-400 font-medium flex-shrink-0">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base font-bold text-white">
                  {formatCurrency(product.price)}
                </p>
                {brandName && (
                  <p className="text-xs text-gray-500">{brandName}</p>
                )}
              </div>
              <div className="text-right">
                {product.stock > 0 ? (
                  <span className="text-xs text-green-400">In Stock</span>
                ) : (
                  <span className="text-xs text-red-400">Out of Stock</span>
                )}
              </div>
            </div>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.slice(0, 2).map((pt: any, idx: number) => {
                  const tag = pt.tag || pt;
                  const tagName = tag?.name;
                  if (!tagName) return null;
                  return (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30"
                    >
                      {tagName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
