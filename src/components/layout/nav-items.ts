import { House, NotebookPen, Pill, Wallet } from 'lucide-react'

// One list drives both the desktop sidebar and the mobile tab bar
export const navItems = [
  { to: '/', label: 'Today', icon: House },
  { to: '/meds', label: 'Meds', icon: Pill },
  { to: '/log', label: 'Log', icon: NotebookPen },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
]
