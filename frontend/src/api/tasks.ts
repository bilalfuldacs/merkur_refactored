import { apiRequest } from './client'

export type TasksPeople = 'm' | 'e'
export type TasksTime = 'u' | 'd' | 'a' | 'f'

export type TaskPerson = {
  ID: number
  initials: string | null
  firstname: string | null
  lastname: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

export type TaskStatus = {
  name: string
  color: string | null
  text_color: string | null
}

export type TaskJurisdiction = {
  ID: number
  flag: string | null
  iso3166: string | null
  segment: string | null
}

export type TaskSubject = {
  ID: number
  name: string | null
  table: 'versions' | 'builds'
}

export type TaskRow = {
  ID: number
  due: boolean
  subject: TaskSubject | null
  jurisdiction: TaskJurisdiction | null
  status: TaskStatus | null
  expected_date: string | null
  actual_date: string | null
  comment: string | null
  people: TaskPerson[]
}

export type TasksPayload = {
  people: TasksPeople
  time: TasksTime
  versions: TaskRow[]
  builds: TaskRow[]
}

export function getTasks(people: TasksPeople, time: TasksTime): Promise<TasksPayload> {
  const params = new URLSearchParams({ p: people, t: time })
  return apiRequest<TasksPayload>(`/tasks?${params.toString()}`)
}
