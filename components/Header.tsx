"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, User, Menu, X, Shield } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/abrlogo.png"
              alt="ABR TECH"
              width={120}
              height={40}
              className="h-6 md:h-8 w-auto"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              href="/"
              className={`transition-colors font-medium text-sm lg:text-base ${
                pathname === "/"
                  ? "text-blue-500"
                  : "text-white hover:text-blue-500"
              }`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`transition-colors font-medium text-sm lg:text-base ${
                pathname === "/products"
                  ? "text-blue-500"
                  : "text-white hover:text-blue-500"
              }`}
            >
              Products
            </Link>
            <Link
              href="/products/new-arrivals"
              className={`transition-colors font-medium text-sm lg:text-base ${
                pathname === "/products/new-arrivals"
                  ? "text-blue-500"
                  : "text-white hover:text-blue-500"
              }`}
            >
              New Arrivals
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/cart"
              className="relative p-1.5 md:p-2 text-white hover:text-blue-500 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center text-[10px] md:text-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/cart"
                  className="p-2 text-white hover:text-blue-500 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                </Link>
                <Link
                  href="/profile"
                  className="p-2 text-white hover:text-blue-500 transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                {user.user_metadata?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-white hover:text-blue-500 transition-colors font-medium"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-white hover:text-blue-500 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="hidden md:flex items-center space-x-2 text-white hover:text-blue-500 transition-colors font-medium"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            <button
              className="md:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-2">
            <Link
              href="/"
              className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/products"
              className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/products/new-arrivals"
              className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              New Arrivals
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                {user.user_metadata?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block py-2 px-4 text-white hover:text-blue-500 hover:bg-gray-900 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
