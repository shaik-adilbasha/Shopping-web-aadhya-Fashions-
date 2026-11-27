import { HeroCarousel } from '@/components/home/hero-carousel'
import { FeaturedGrid } from '@/components/home/featured-grid'
import { BrandPanel } from '@/components/home/brand-panel'
import { CategoryRail } from '@/components/shop/category-rail'

export default function HomePage() {
  return (
    <div className="flex gap-6 px-4 pt-4 md:px-4 md:pt-4 xl:pr-4">
      <div className="min-w-0 flex-1">
        <div className="-mx-2 md:mx-0">
          <HeroCarousel />
        </div>
        <div className="mt-6 md:px-12">
          <CategoryRail />
        </div>
        <FeaturedGrid />
      </div>
      <BrandPanel />
    </div>
  )
}
