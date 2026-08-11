import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Journey } from './Journey'
import { JourneyStatic } from './JourneyStatic'

export function JourneySection() {
  const reducedMotion = useReducedMotion()
  return reducedMotion ? <JourneyStatic /> : <Journey />
}
