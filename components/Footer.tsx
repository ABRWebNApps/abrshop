import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/abrlogo.png"
                alt="ABR TECH"
                width={100}
                height={30}
                className="h-6 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium technology for the modern professional. We curate the finest hardware from around the globe, ensuring quality, performance, and aesthetic excellence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">Collections</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  Laptops
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  Smartphones
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} ABR TECH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

