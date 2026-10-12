import { useState, type FormEvent } from 'react'
import CenteredScreen from '@/components/CenteredScreen'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

type CreatePetPageProps = {
  onCreated: () => void
}

// Shown when the logged-in person has no pet yet (first time using the app)
function CreatePetPage({ onCreated }: CreatePetPageProps) {
  const [name, setName] = useState('Meg')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    // Calls the create_pet() database function: creates the pet
    // and makes you its owner in one step
    const { error } = await supabase.rpc('create_pet', {
      p_name: name.trim(),
      p_breed: breed.trim() || undefined,
      p_birth_date: birthDate || undefined,
    })

    setLoading(false)
    if (error) setError(error.message)
    else onCreated()
  }

  return (
    <CenteredScreen>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Set up your pet</CardTitle>
          <CardDescription>
            Were you invited by someone? Ask them to check the email they
            invited, then sign out and back in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="breed">Breed (optional)</Label>
              <Input
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="birth-date">Birth date (optional)</Label>
              <Input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Creating…' : 'Create'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </CenteredScreen>
  )
}

export default CreatePetPage
