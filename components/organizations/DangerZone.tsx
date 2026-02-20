'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { deleteOrganization } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DangerZoneProps {
  orgId: string
  orgName: string
  isPersonal: boolean
}

export function DangerZone({ orgId, orgName, isPersonal }: DangerZoneProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmText, setConfirmText] = useState('')
  const [open, setOpen] = useState(false)

  if (isPersonal) return null

  const handleDelete = () => {
    if (confirmText !== orgName) {
      toast.error('Organization name does not match')
      return
    }
    startTransition(async () => {
      await deleteOrganization(orgId)
    })
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger zone
        </CardTitle>
        <CardDescription>
          Irreversible actions. Proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete organization</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete this organization and all its data.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete organization</DialogTitle>
                <DialogDescription>
                  This will permanently delete <strong>{orgName}</strong> and all associated
                  data including projects, members, and settings. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Label>
                  Type <strong>{orgName}</strong> to confirm
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={orgName}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={confirmText !== orgName || isPending}
                    onClick={handleDelete}
                  >
                    {isPending ? 'Deleting…' : 'Delete organization'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
