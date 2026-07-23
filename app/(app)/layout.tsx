import Sidebar from '@/components/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <main className="relative flex-1 lg:ml-64 mt-14 lg:mt-0 min-h-screen overflow-hidden">
        {/* Ambient backdrop — same premium treatment as the marketing site */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute inset-0 bg-grid mask-fade-b opacity-40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
