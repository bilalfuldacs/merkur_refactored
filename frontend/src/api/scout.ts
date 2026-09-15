import { apiRequest } from './client'

export type ScoutMenuEvent = {
  ID: number
  slug: string
  name: string
  year: number | null
  icon: string
  active: boolean
  attendant: boolean
  may_manage: boolean
}

export type ScoutEventRecord = {
  ID: number
  slug: string
  name: string
  year: number | null
  icon: string
  active: boolean
  sort_order: number
}

export function getScoutMenu(): Promise<{ events: ScoutMenuEvent[] }> {
  return apiRequest<{ events: ScoutMenuEvent[] }>('/scout/events')
}

export function getScoutAdminEvents(): Promise<{ events: ScoutEventRecord[] }> {
  return apiRequest<{ events: ScoutEventRecord[] }>('/scout/admin/events')
}

export function createScoutEvent(body: {
  name: string
  slug?: string
  year?: number | null
  icon?: string
}): Promise<{ message: string; events: ScoutEventRecord[] }> {
  return apiRequest<{ message: string; events: ScoutEventRecord[] }>('/scout/admin/events', {
    method: 'POST',
    body,
  })
}

export function updateScoutEvent(
  slug: string,
  body: { name: string; year?: number | null; icon?: string; active: boolean },
): Promise<{ message: string; events: ScoutEventRecord[] }> {
  return apiRequest<{ message: string; events: ScoutEventRecord[] }>(`/scout/admin/events/${slug}`, {
    method: 'PATCH',
    body,
  })
}
