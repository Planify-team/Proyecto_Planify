import apiClient from '@/lib/axios'
import type { ApiResponse, Plan, PlanGenerateInput, PlanFeedback, PlanFeedbackInput } from '@/types'

const BASE = '/plans'

export const plannerService = {
  async generate(input: PlanGenerateInput): Promise<Plan> {
    const { data } = await apiClient.post<ApiResponse<Plan>>(`${BASE}/generate/`, input)
    return data.data
  },

  async list(): Promise<Plan[]> {
    const { data } = await apiClient.get<ApiResponse<Plan[]>>(`${BASE}/`)
    return data.data
  },

  async getById(id: string): Promise<Plan> {
    const { data } = await apiClient.get<ApiResponse<Plan>>(`${BASE}/${id}/`)
    return data.data
  },

  async getBySlug(slug: string): Promise<Plan> {
    const { data } = await apiClient.get<ApiResponse<Plan>>(`${BASE}/public/${slug}/`)
    return data.data
  },

  async patch(id: string, payload: Partial<Pick<Plan, 'is_public' | 'status' | 'title'>>): Promise<Plan> {
    const { data } = await apiClient.patch<ApiResponse<Plan>>(`${BASE}/${id}/`, payload)
    return data.data
  },

  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/`)
  },

  async addItem(planId: string, payload: {
    entity_type: string
    entity_id: string
    slot: string
    note?: string
  }): Promise<Plan> {
    const { data } = await apiClient.post<ApiResponse<Plan>>(`${BASE}/${planId}/items/`, payload)
    return data.data
  },

  async removeItem(planId: string, itemId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${planId}/items/${itemId}/`)
  },

  async sharePlan(planId: string): Promise<void> {
    await apiClient.post(`${BASE}/${planId}/share/`)
  },

  async submitFeedback(planId: string, payload: PlanFeedbackInput): Promise<PlanFeedback> {
    const { data } = await apiClient.post<ApiResponse<PlanFeedback>>(`${BASE}/${planId}/feedback/`, payload)
    return data.data
  },
}
