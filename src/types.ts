export type Environment = 'sandbox' | 'production'

export interface MomoConfig {
  subscriptionKey: string
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

export interface RequestToPayParams {
  amount: string
  currency: string
  externalId: string
  payer: Party
  payerMessage?: string
  payeeNote?: string
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

export interface MomoError {
  code: string
  message: string
}
