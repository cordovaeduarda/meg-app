import { createContext, useContext } from 'react'
import type { Tables } from './database.types'

export type Pet = Tables<'pets'>

export const PetContext = createContext<Pet | null>(null)

// Any page inside the app can call usePet() to get the current pet
export function usePet() {
  const pet = useContext(PetContext)
  if (!pet) throw new Error('usePet must be used inside <PetGate>')
  return pet
}
