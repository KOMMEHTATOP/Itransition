import api from './axios'

export interface SalesforcePushRequest {
  phone: string
  company: string
  jobTitle: string
}

export interface SalesforcePushResult {
  accountId: string
  contactId: string
  accountUrl: string
  contactUrl: string
}

export const salesforceApi = {
  push: (data: SalesforcePushRequest) =>
    api.post<SalesforcePushResult>('/salesforce/push', data),
}
