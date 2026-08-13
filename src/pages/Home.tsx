import { Hero } from '@/sections/Hero'
import { TrustBar } from '@/sections/TrustBar'
import { JourneySection } from '@/sections/JourneySection'
import { Services } from '@/sections/Services'
import { Fleet } from '@/sections/Fleet'
import { Company } from '@/sections/Company'
import { Differentiators } from '@/sections/Differentiators'
import { Quote } from '@/sections/Quote'

/** A página institucional, exatamente na ordem em que já estava no App. */
export function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <JourneySection />
      <Services />
      <Fleet />
      <Company />
      <Differentiators />
      <Quote />
    </>
  )
}
