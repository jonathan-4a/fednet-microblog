// src/hooks/mutations/useInviteMutation.ts
import { useMutation } from '@tanstack/react-query'
import { generateInvite } from '../../services/users'

export function useInviteMutation() {
  return useMutation({
    mutationFn: generateInvite,
  })
}


