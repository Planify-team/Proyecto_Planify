import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'

export function useBusinessStats() {
  return useQuery({
    queryKey: ['dashboard', 'business', 'stats'],
    queryFn: dashboardService.getBusinessStats,
  })
}

export function useOwnedPlaces() {
  return useQuery({
    queryKey: ['dashboard', 'business', 'places'],
    queryFn: dashboardService.getOwnedPlaces,
  })
}

export function useOwnedPromotions() {
  return useQuery({
    queryKey: ['dashboard', 'business', 'promotions'],
    queryFn: dashboardService.getOwnedPromotions,
  })
}

export function useOrganizerStats() {
  return useQuery({
    queryKey: ['dashboard', 'organizer', 'stats'],
    queryFn: dashboardService.getOrganizerStats,
  })
}

export function useOwnedEvents() {
  return useQuery({
    queryKey: ['dashboard', 'organizer', 'events'],
    queryFn: dashboardService.getOwnedEvents,
  })
}
