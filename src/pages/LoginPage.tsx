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

type Mode = 'sign-in' | 'sign-up'

function LoginPage() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'sign-in') {
      // On success, useSession() hears about it and the app appears
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        // Where the confirmation link in the email sends you back to
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else setMessage('Check your email and click the confirmation link, then sign in.')
    }

    setLoading(false)
  }

  function switchMode() {
    setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
    setError(null)
    setMessage(null)
  }

  return (
    <CenteredScreen>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </CardTitle>
          <CardDescription>
            {mode === 'sign-in'
              ? 'Sign in to see Meg’s day'
              : 'Use the email you were invited with, if you were invited'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
            </Button>
            <Button type="button" variant="ghost" onClick={switchMode}>
              {mode === 'sign-in'
                ? 'No account yet? Sign up'
                : 'Already have an account? Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </CenteredScreen>
  )
}

export default LoginPage
