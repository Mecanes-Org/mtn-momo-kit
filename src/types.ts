export type Environment = 'sandbox' | 'production'

export interface MomoConfig {
  subscriptionKey: string
  collectionSubscriptionKey?: string
  disbursementSubscriptionKey?: string
  remittanceSubscriptionKey?: string
  apiUser: string
  apiKey: string
  environment?: Environment
  callbackHost?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface ApiKeyResponse {
  apiKey: string
}

export interface RequestToPayParams {
  amount: string
  currency: string
  externalId: string
  payer: Party
  payerMessage?: string
  payeeNote?: string
  callbackUrl?: string
}

export interface Party {
  partyIdType: 'MSISDN' | 'EMAIL' | 'PARTY_CODE'
  partyId: string
}

export interface TransferParams {
  amount: string
  currency: string
  externalId: string
  payee: Party
  payerMessage?: string
  payeeNote?: string
  callbackUrl?: string
}

export interface TransactionStatus {
  amount: string
  currency: string
  financialTransactionId: string
  externalId: string
  payer: Party
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  reason?: Record<string, unknown>
  payeeNote?: string
  payerMessage?: string
}

export interface Balance {
  availableBalance: string
  currency: string
}

export interface AccountHolderStatus {
  result: boolean
  reason?: string
}

export interface BasicUserInfo {
  given_name?: string
  family_name?: string
  birthdate?: string
  locale?: string
  phone_number?: string
  country?: string
  email?: string
}

export interface MomoError {
  code: string
  message: string
}

export interface MomoWebhookPayload {
  referenceId: string
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  amount?: string
  currency?: string
  financialTransactionId?: string
  externalId?: string
  payer?: Party
  reason?: Record<string, unknown>
  payeeNote?: string
  payerMessage?: string
}
