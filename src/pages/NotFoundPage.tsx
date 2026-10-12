import { Link } from 'react-router'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-6">
      <PageHeader eyebrow="404" title="Page not found" />
      <Button asChild>
        <Link to="/">Back to today</Link>
      </Button>
    </div>
  )
}

export default NotFoundPage
