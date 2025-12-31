'use client'

import { Download } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
    >
      <Download className="w-4 h-4" />
      <span>Print Receipt</span>
    </button>
  )
}

