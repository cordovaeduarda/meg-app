import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { LogOut, Mail, UserPlus, X } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Database, Tables } from '@/lib/database.types'
import { usePet } from '@/lib/pet-context'
import { supabase } from '@/lib/supabase'

type Member = Database['public']['Functions']['list_pet_members']['Returns'][number]
type Invitation = Tables<'pet_invitations'>

function SettingsPage() {
  const pet = usePet()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isOwner = members.some((m) => m.is_me && m.role === 'owner')

  const loadSharing = useCallback(async () => {
    const [membersResult, invitationsResult] = await Promise.all([
      supabase.rpc('list_pet_members', { p_pet_id: pet.id }),
      // Members who aren't the owner get an empty list here (RLS)
      supabase.from('pet_invitations').select('*').eq('pet_id', pet.id).order('created_at'),
    ])
    setMembers(membersResult.data ?? [])
    setInvitations(invitationsResult.data ?? [])
  }, [pet.id])

  useEffect(() => {
    void loadSharing()
  }, [loadSharing])

  async function handleInvite(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const { error } = await supabase
      .from('pet_invitations')
      .insert({ pet_id: pet.id, email: inviteEmail.trim().toLowerCase() })

    if (error) {
      setError(
        error.code === '23505' // unique violation
          ? 'That email is already invited.'
          : error.message,
      )
      return
    }
    setInviteEmail('')
    void loadSharing()
  }

  async function cancelInvitation(id: string) {
    await supabase.from('pet_invitations').delete().eq('id', id)
    void loadSharing()
  }

  async function removeMember(member: Member) {
    const leaving = member.is_me
    const question = leaving
      ? `Leave ${pet.name}? You'll lose access to all her data.`
      : `Remove ${member.email}? They'll lose access to ${pet.name}'s data.`
    if (!window.confirm(question)) return

    await supabase
      .from('pet_members')
      .delete()
      .eq('pet_id', pet.id)
      .eq('user_id', member.user_id)

    if (leaving) window.location.reload()
    else void loadSharing()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Settings" title="Sharing" />

      <Card>
        <CardHeader>
          <CardTitle>People with access</CardTitle>
          <CardDescription>
            Everyone here can see and edit {pet.name}'s meds, logs and expenses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate">
                  {member.email}
                  {member.is_me && <span className="text-muted-foreground"> (you)</span>}
                </span>
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
                {member.role === 'member' && (isOwner || member.is_me) && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={member.is_me ? 'Leave' : `Remove ${member.email}`}
                    onClick={() => removeMember(member)}
                  >
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" /> Invite someone
            </CardTitle>
            <CardDescription>
              They get access as soon as they sign up (or sign in) with this
              email. Send them the app link yourself, as no email is sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button type="submit">Invite</Button>
            </form>
            {error && <p className="text-sm text-destructive">{error}</p>}

            {invitations.length > 0 && (
              <ul className="flex flex-col gap-3">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{invitation.email}</span>
                    <Badge variant="outline">pending</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Cancel invitation for ${invitation.email}`}
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={() => supabase.auth.signOut()}>
        <LogOut /> Sign out
      </Button>
    </div>
  )
}

export default SettingsPage
