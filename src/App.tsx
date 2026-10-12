import { Route, Routes } from 'react-router'
import CenteredScreen from '@/components/CenteredScreen'
import PetGate from '@/components/PetGate'
import AppLayout from '@/components/layout/AppLayout'
import { useSession } from '@/hooks/useSession'
import ExpensesPage from '@/pages/ExpensesPage'
import LogPage from '@/pages/LogPage'
import LoginPage from '@/pages/LoginPage'
import MedsPage from '@/pages/MedsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SettingsPage from '@/pages/SettingsPage'
import TodayPage from '@/pages/TodayPage'

function App() {
  const session = useSession()

  // Still checking whether someone is logged in
  if (session === undefined) return <CenteredScreen />

  // Logged out: the only thing you can see is the login screen
  if (session === null) return <LoginPage />

  return (
    <PetGate>
      <Routes>
        {/* Every page inside this route shares the layout (sidebar / tab bar) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<TodayPage />} />
          <Route path="/meds" element={<MedsPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </PetGate>
  )
}

export default App
