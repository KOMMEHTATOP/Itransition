import api from './axios'

export interface SupportTicketRequest {
  summary: string
  priority: string
  link: string
  inventory: string | null
}

export interface SupportTicketResult {
  ticketId: string
}

export const supportApi = {
  create: (data: SupportTicketRequest) =>
    api.post<SupportTicketResult>('/support/tickets', data),
}
