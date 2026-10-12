import { useCallback, useEffect, useState, type ReactNode } from 'react'
import CenteredScreen from '@/components/CenteredScreen'
import { Button } from '@/components/ui/button'
import { PetContext, type Pet } from '@/lib/pet-context'
import { supabase } from '@/lib/supabase'
import CreatePetPage from '@/pages/CreatePetPage'

// Runs after login: accepts pending invitations, loads the pets this person
// can access, and either shows first-time setup or the app with the pet
function PetGate({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPets = useCallback(async () => {
    setError(null)
    await supabase.rpc('accept_pending_invitations')

    // RLS filters this: it only returns pets you're a member of
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at')

    if (error) setError(error.message)
    else setPets(data)
  }, [])

  useEffect(() => {
    void loadPets()
  }, [loadPets])

  if (error) {
    return (
      <CenteredScreen>
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={loadPets}>Try again</Button>
      </CenteredScreen>
    )
  }

  if (pets === null) {
    return <CenteredScreen />
  }

  if (pets.length === 0) {
    return <CreatePetPage onCreated={loadPets} />
  }

  return <PetContext.Provider value={pets[0]}>{children}</PetContext.Provider>
}

export default PetGate
