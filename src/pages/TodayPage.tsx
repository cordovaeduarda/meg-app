import { useState } from 'react'
import { Pill, Plus, Wallet } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { usePet } from '@/lib/pet-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

// Sample data — in step 6 this will come from the database
const medications = [
  { id: 1, name: 'Apoquel', dose: '16 mg', time: '08:00' },
  { id: 2, name: 'Omeprazole', dose: '10 mg', time: '08:00' },
  { id: 3, name: 'Gabapentin', dose: '100 mg', time: '14:00' },
  { id: 4, name: 'Apoquel', dose: '16 mg', time: '20:00' },
]

function TodayPage() {
  const pet = usePet()
  const [givenIds, setGivenIds] = useState<number[]>([])

  function toggleDose(id: number) {
    setGivenIds(
      givenIds.includes(id)
        ? givenIds.filter((given) => given !== id)
        : [...givenIds, id],
    )
  }

  const progress = (givenIds.length / medications.length) * 100
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={today} title={`${pet.name}'s day`} />

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Doses today
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {givenIds.length}/{medications.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Spent in Oct
            </p>
            <p className="text-3xl font-semibold tracking-tight">R$ 482</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="size-4" /> Medications
          </CardTitle>
          <CardDescription>Tap a dose once it's given</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Progress value={progress} />
          <ul className="flex flex-col gap-3">
            {medications.map((med) => (
              <li key={med.id}>
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={givenIds.includes(med.id)}
                    onCheckedChange={() => toggleDose(med.id)}
                  />
                  <span className="flex-1">
                    <span className="font-medium">{med.name}</span>{' '}
                    <span className="text-muted-foreground">{med.dose}</span>
                  </span>
                  <Badge variant="secondary">{med.time}</Badge>
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick note</CardTitle>
          <CardDescription>Appetite, mood, anything for the vet</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Ate everything, very playful…" />
          <Button>
            <Plus /> Save
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1">
          <Wallet /> Add expense
        </Button>
        <Button variant="outline" className="flex-1">
          View history
        </Button>
      </div>
    </div>
  )
}

export default TodayPage
