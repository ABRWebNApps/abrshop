import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import ProductSlider from "@/components/ProductSlider";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

async function getActiveBanner() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Get active banners that are either:
  // - No date restrictions (both null)
  // - Currently within date range
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // Check if banner is within date range
  const startDate = data.start_date ? new Date(data.start_date) : null;
  const endDate = data.end_date ? new Date(data.end_date) : null;
  const nowDate = new Date(now);

  if (startDate && nowDate < startDate) return null;
  if (endDate && nowDate > endDate) return null;

  return data;
}

async function getFeaturedProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))"
    )
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(8);

  return data || [];
}

export default async function Home() {
  const banner = await getActiveBanner();
  const products = await getFeaturedProducts();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Banner */}
      {banner ? (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0">
            {banner.image_url ? (
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src="https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=2070"
                alt="Black professionals with technology and gadgets"
                fill
                className="object-cover opacity-60"
                priority
              />
            )}
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-3xl">
              <Link href="/products/new-arrivals" className="block">
                <p className="text-xs md:text-sm text-blue-400 mb-4 uppercase tracking-wider hover:text-blue-300 transition-colors cursor-pointer">
                  NEW ARRIVALS
                </p>
              </Link>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4">
                {banner.title}
              </h1>
              {banner.subtitle && (
                <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-gray-300">
                  {banner.subtitle}
                </p>
              )}
              {banner.button_text && banner.button_link && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href={banner.button_link}
                    className="inline-block px-6 md:px-8 py-2 md:py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all text-sm md:text-base"
                  >
                    {banner.button_text}
                  </Link>
                  <Link
                    href={banner.button_link}
                    className="inline-block px-6 md:px-8 py-2 md:py-3 bg-gray-800/50 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all text-sm md:text-base"
                  >
                    Learn more →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-black">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80"
              alt="Black professionals with technology and gadgets"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          </div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-3xl">
              <Link href="/products/new-arrivals" className="block">
                <p className="text-xs md:text-sm text-blue-400 mb-4 uppercase tracking-wider hover:text-blue-300 transition-colors cursor-pointer">
                  NEW ARRIVALS
                </p>
              </Link>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4">
                Titanium. Tough.
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-gray-300">
                Meet the new standard of durability and performance.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/products"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all text-sm md:text-base"
                >
                  View Collection
                </Link>
                <Link
                  href="/products"
                  className="inline-block px-6 md:px-8 py-2 md:py-3 bg-gray-800/50 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all text-sm md:text-base"
                >
                  Learn more →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Picked for You Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Picked for{" "}
              <span className="underline decoration-blue-500 decoration-2 underline-offset-4">
                You
              </span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Based on premium trends.
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center text-blue-500 hover:text-blue-400 font-medium group w-fit"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {products.length > 0 ? (
          <ProductSlider products={products} />
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">
              No products available yet.
            </p>
            <Link
              href="/admin"
              className="text-blue-500 hover:text-blue-400 font-medium"
            >
              Add products in admin panel
            </Link>
          </div>
        )}
      </section>

      {/* The Collection Section */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 md:mb-8">
            The Collection.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {products[0] && (
              <Link
                href={`/products/${products[0].id}`}
                className="lg:col-span-2 group"
              >
                <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                  <Image
                    src={
                      products[0].images?.[0] ||
                      "https://via.placeholder.com/800x800"
                    }
                    alt={products[0].name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {products[0].name}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {products[0].description}
                    </p>
                    <span className="text-white font-semibold">Buy Now →</span>
                  </div>
                </div>
              </Link>
            )}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-xl font-bold text-white mb-2">
                  Special Offers.
                </h3>
                <p className="text-gray-400 mb-4">
                  Discover exclusive deals and limited-time offers on our latest
                  products.
                </p>
                <Link
                  href="/products"
                  className="text-blue-500 hover:text-blue-400 font-medium"
                >
                  View offers →
                </Link>
              </div>
              {products[1] && (
                <Link href={`/products/${products[1].id}`} className="block">
                  <div className="relative h-[200px] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                    <Image
                      src={
                        products[1].images?.[0] ||
                        "https://via.placeholder.com/400x400"
                      }
                      alt={products[1].name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-xs text-gray-400 mb-1">RECOMMENDED</p>
                      <h3 className="text-lg font-bold text-white">
                        {products[1].name}
                      </h3>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ABR Intelligence Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 px-3 md:px-4 py-2 rounded-full border border-white/10 mb-4 md:mb-6">
          <span className="text-base md:text-lg">✨</span>
          <span className="text-xs md:text-sm font-medium text-white">
            ABR INTELLIGENCE
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 px-4">
          Find exactly what you need.
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-gray-400 mb-6 md:mb-8 px-4">
          Our AI-powered assistant understands context. Just ask for what you're
          looking for.
        </p>
        <div className="max-w-2xl mx-auto px-4">
          <div className="relative flex items-center bg-gray-900 rounded-full border border-white/10 p-3 md:p-4">
            <span className="text-gray-400 mr-2 md:mr-3 text-sm md:text-base">
              🔍
            </span>
            <input
              type="text"
              placeholder="Ex: 'Professional laptop for video editing under ₦2,000,000'..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm md:text-base"
            />
            <button className="ml-2 md:ml-4 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors flex-shrink-0">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-4 md:mt-6">
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors">
              Titanium Watch
            </button>
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors">
              Noise Cancelling
            </button>
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors">
              Gaming Setup
            </button>
            <button className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-900 border border-white/10 rounded-full text-white text-xs md:text-sm hover:border-white/20 transition-colors">
              4K Monitors
            </button>
          </div>
        </div>

        {/* Additional Product Layouts */}
        {products.length > 0 && (
          <div className="mt-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Featured Collections
                </h3>
                <p className="text-gray-400 text-sm md:text-base">
                  Curated selections for every need
                </p>
              </div>
              <Link
                href="/products"
                className="flex items-center text-blue-500 hover:text-blue-400 font-medium group w-fit mt-4 md:mt-0"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
              {products.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showNewBadge={true}
                />
              ))}
            </div>

            {/* Horizontal Scroll Section */}
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Trending Now
              </h3>
              <ProductSlider products={products.slice(6)} />
            </div>

            {/* Category Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products[0] && (
                <Link
                  href={`/products?category=${products[0].category_id}`}
                  className="group"
                >
                  <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                    <Image
                      src={
                        products[0].images?.[0] ||
                        "https://via.placeholder.com/800x800"
                      }
                      alt={products[0].name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <p className="text-xs md:text-sm text-blue-400 mb-2 uppercase tracking-wider">
                        {products[0].category?.name || "CATEGORY"}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {products[0].category?.name || "Explore Category"}
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base">
                        Shop the collection →
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              {products[1] && (
                <Link
                  href={`/products?category=${products[1].category_id}`}
                  className="group"
                >
                  <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                    <Image
                      src={
                        products[1].images?.[0] ||
                        "https://via.placeholder.com/800x800"
                      }
                      alt={products[1].name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <p className="text-xs md:text-sm text-blue-400 mb-2 uppercase tracking-wider">
                        {products[1].category?.name || "CATEGORY"}
                      </p>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {products[1].category?.name || "Explore Category"}
                      </h3>
                      <p className="text-gray-300 text-sm md:text-base">
                        Shop the collection →
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
