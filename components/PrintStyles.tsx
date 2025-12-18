'use client'

export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
      }
      @media screen {
        .print-only {
          display: none !important;
        }
      }
    `}</style>
  )
}

