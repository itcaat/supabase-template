'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/rbac'
import type { MemberRole } from '@/types'

interface RoleSelectorProps {
  value: MemberRole
  onChange: (role: MemberRole) => void
  disabled?: boolean
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MemberRole)} disabled={disabled}>
      <SelectTrigger className="w-28 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((role) => (
          <SelectItem key={role} value={role} className="text-xs">
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
