export type UserRole = 'admin' | 'member'
export type MeetingStatus = 'processing' | 'done' | 'failed'

export interface TeamMember {
  user_id: string
  team_id: string
  role: UserRole
  users: { id: string; name: string; email: string }
}

export interface Team {
  id: string
  name: string
  created_at: string
  team_members?: TeamMember[]
}

export interface Meeting {
  id: string
  team_id: string
  title: string
  recorded_by: string
  audio_url: string | null
  transcript: string | null
  status: MeetingStatus
  created_at: string
}

export interface ActionItem {
  who: string
  what: string
  due: string | null
}

export interface SummaryContent {
  topics: string[]
  decisions: string[]
  action_items: ActionItem[]
  custom: Record<string, string>
}

export interface Summary {
  id: string
  meeting_id: string
  content: SummaryContent
  edited_by: string | null
  updated_at: string
}

export interface TeamTemplate {
  id: string
  team_id: string
  fields: string[]
  updated_at: string
}
