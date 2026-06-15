// ─── API Response Shapes ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'moderator' | 'business_owner' | 'event_organizer' | 'user'
export type UserStatus = 'active' | 'suspended' | 'deleted'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string | null
  role: UserRole
  status: UserStatus
  profile_image: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface AuthResponse {
  user: User
  access: string
  refresh: string
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export interface UserPreference {
  id: string
  category: string
  value: string
  weight: number
}

// ─── Places ───────────────────────────────────────────────────────────────────

export interface Place {
  id: string
  name: string
  description: string
  category: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  phone: string
  website: string
  image_url: string
  price_level: number
  source?: string
  external_id?: string | null
  is_active: boolean
  avg_rating: number | null
  review_count: number
  created_at: string
  updated_at: string
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export interface Weather {
  temperature: number
  feels_like: number
  condition: string
  humidity: number
  wind_speed: number
  clouds: number
  is_outdoor_friendly: boolean
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished'

export interface Event {
  id: string
  title: string
  description: string
  category: string
  start_date: string
  end_date: string
  minimum_age: number
  capacity: number | null
  price: string
  image_url: string
  status: EventStatus
  place: string | null
  place_name: string | null
  organizer_email: string | null
  avg_rating: number | null
  review_count: number
  created_at: string
  updated_at: string
}

// ─── Activities ───────────────────────────────────────────────────────────────

export interface Activity {
  id: string
  name: string
  description: string
  category: string
  activity_type: string
  min_budget: string
  max_budget: string | null
  min_people: number
  max_people: number | null
  indoor: boolean
  outdoor: boolean
  score_base: number
  is_active: boolean
  avg_rating: number | null
  review_count: number
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export interface Favorite {
  id: string
  event: string | null
  place: string | null
  activity: string | null
  item_type: 'event' | 'place' | 'activity' | null
  item_name: string | null
  created_at: string
}

export interface ScoreBreakdown {
  preference: number
  popularity: number
  interaction: number
  weather: number
  distance: number
  budget: number
  time_of_day: number
  day_of_week: number
}

export interface Recommendation {
  id: string
  score: string
  recommendation_reason: string
  score_breakdown?: ScoreBreakdown
  activity: string | null
  event: string | null
  place: string | null
  item_type: 'activity' | 'event' | 'place' | null
  activity_detail: {
    id: string
    name: string
    category: string
    activity_type: string
    min_budget: string
    indoor: boolean
    outdoor: boolean
  } | null
  event_detail: {
    id: string
    title: string
    category: string
    start_date: string
    price: string
    image_url: string
  } | null
  place_detail: {
    id: string
    name: string
    category: string
    city: string
    price_level: number
    image_url: string
    latitude: number | null
    longitude: number | null
  } | null
  created_at: string
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type ReviewEntityType = 'place' | 'activity' | 'event'

export interface Review {
  id: string
  user_email: string
  user_name: string
  entity_type: ReviewEntityType
  entity_id: string
  stars: number
  text: string
  created_at: string
}

export interface EntityRating {
  average: number
  count: number
}

export interface ReviewsResponse {
  rating: EntityRating
  my_review: Review | null
  reviews: Review[]
}

// ─── Notifications / Reminders ────────────────────────────────────────────────

export interface Notification {
  id: string
  title: string
  message: string
  notification_type: string
  status: string
  read: boolean
  created_at: string
}

export interface Reminder {
  id: string
  event: string
  event_title: string
  reminder_date: string
  created_at: string
}

// ─── Planner ──────────────────────────────────────────────────────────────────

export type PlanStatus = 'draft' | 'generated' | 'completed' | 'cancelled'
export type PlanSlot = 'morning' | 'afternoon' | 'evening'
export type PlanEntityType = 'place' | 'activity' | 'event'

export interface PlanItem {
  id: string
  entity_type: PlanEntityType
  entity_id: string
  slot: PlanSlot
  order: number
  note: string
  generation_reason: string
  created_at: string
}

export interface Plan {
  id: string
  title: string
  date: string
  budget: string
  people_count: number
  city: string
  slug: string
  is_public: boolean
  status: PlanStatus
  items: PlanItem[]
  created_at: string
  updated_at: string
}

export interface PlanGenerateInput {
  date: string
  budget: string
  people_count: number
  city: string
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export type PromotionStatus = 'draft' | 'active' | 'expired' | 'cancelled'

export interface Promotion {
  id: string
  place: string
  place_name: string
  title: string
  description: string
  discount_percentage: string
  start_date: string
  end_date: string
  status: PromotionStatus
  is_currently_active: boolean
  created_at: string
  updated_at: string
}
