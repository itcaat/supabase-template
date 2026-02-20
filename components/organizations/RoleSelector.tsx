'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/lib/rbac'
import type { MemberRole } from '@/types'

interface RoleSelectorProps {
  value: MemberRole
  onChange: (role: MemberRole) => void
  disabled?: boolean
  includeOwner?: boolean
}

export function RoleSelector({ value, onChange, disabled, includeOwner = false }: RoleSelectorProps) {
  const roles = includeOwner ? (['owner', ...ASSIGNABLE_ROLES] as MemberRole[]) : ASSIGNABLE_ROLES

  return (
    <Select value={value} onValueChange={(v) => onChange(v as MemberRole)} disabled={disabled}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
