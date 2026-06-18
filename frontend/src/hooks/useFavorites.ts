import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesService } from '@/services/favoritesService'
import type { Favorite } from '@/types'

interface AddPayload { event?: string | null; place?: string | null; activity?: string | null }

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesService.list,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAddFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: favoritesService.add,
    onMutate: async (payload: AddPayload) => {
      await qc.cancelQueries({ queryKey: ['favorites'] })
      const prev = qc.getQueryData<Favorite[]>(['favorites'])
      const optimistic: Favorite = {
        id: `optimistic-${Date.now()}`,
        event: payload.event ?? null,
        place: payload.place ?? null,
        activity: payload.activity ?? null,
        item_type: payload.event ? 'event' : payload.place ? 'place' : 'activity',
        item_name: null,
        created_at: new Date().toISOString(),
      }
      qc.setQueryData<Favorite[]>(['favorites'], (old = []) => [...old, optimistic])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}

export function useRemoveFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: favoritesService.remove,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['favorites'] })
      const prev = qc.getQueryData<Favorite[]>(['favorites'])
      qc.setQueryData<Favorite[]>(['favorites'], (old = []) => old.filter((f) => f.id !== id))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['favorites'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}
