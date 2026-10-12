import { Route, Routes } from 'react-router'
import AppLayout from '@/components/layout/AppLayout'
import ExpensesPage from '@/pages/ExpensesPage'
import LogPage from '@/pages/LogPage'
import MedsPage from '@/pages/MedsPage'
import NotFoundPage from '@/pages/NotFoundPage'
import TodayPage from '@/pages/TodayPage'

function App() {
  return (
    <Routes>
      {/* Every page inside this route shares the layout (sidebar / tab bar) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<TodayPage />} />
        <Route path="/meds" element={<MedsPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
