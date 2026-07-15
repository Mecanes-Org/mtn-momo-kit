import { HttpClient } from './client'
import { Collections } from './collections'
import { Disbursements } from './disbursements'
import { Remittances } from './remittances'
import type { MomoConfig, ApiKeyResponse, MomoWebhookPayload, Environment } from './types'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.momodeveloper.mtn.com',
  production: 'https://momoapi.mtn.com',
}

export class Momo {
  readonly collections: Collections
  readonly disbursements: Disbursements
  readonly remittances: Remittances

  constructor(config: MomoConfig) {
    const env = config.environment ?? 'sandbox'

    this.collections = new Collections(
      new HttpClient(config.apiUser, config.apiKey, config.collectionSubscriptionKey ?? config.subscriptionKey, env, '/collection/token/'),
    )
    this.disbursements = new Disbursements(
      new HttpClient(config.apiUser, config.apiKey, config.disbursementSubscriptionKey ?? config.subscriptionKey, env, '/disbursement/token/'),
    )
    this.remittances = new Remittances(
      new HttpClient(config.apiUser, config.apiKey, config.remittanceSubscriptionKey ?? config.subscriptionKey, env, '/remittance/token/'),
    )
  }

  static async createApiUser(
    subscriptionKey: string,
    referenceId: string,
    callbackHost: string,
    environment: Environment = 'sandbox',
  ): Promise<void> {
    const res = await fetch(`${BASE_URLS[environment]}/v1_0/apiuser`, {
      method: 'POST',
      headers: {
        'X-Reference-Id': referenceId,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ providerCallbackHost: callbackHost }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`Create API user failed: ${res.status} ${err}`)
    }
  }

  static async generateApiKey(
    subscriptionKey: string,
    referenceId: string,
    environment: Environment = 'sandbox',
  ): Promise<string> {
    const res = await fetch(`${BASE_URLS[environment]}/v1_0/apiuser/${referenceId}/apikey`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`Generate API key failed: ${res.status} ${err}`)
    }
    const body: ApiKeyResponse = await res.json()
    return body.apiKey
  }

  static parseWebhookPayload(body: unknown): MomoWebhookPayload | null {
    if (!body || typeof body !== 'object') return null
    const data = body as Record<string, unknown>

    const status = data.status as string
    if (!['SUCCESSFUL', 'FAILED', 'PENDING'].includes(status)) return null

    const referenceId = data.referenceId ?? data['X-Reference-Id']
    if (!referenceId || typeof referenceId !== 'string') return null

    return {
      referenceId,
      status: status as MomoWebhookPayload['status'],
      amount: data.amount as string | undefined,
      currency: data.currency as string | undefined,
      financialTransactionId: data.financialTransactionId as string | undefined,
      externalId: data.externalId as string | undefined,
      payer: data.payer as MomoWebhookPayload['payer'] | undefined,
      reason: data.reason as Record<string, unknown> | undefined,
      payeeNote: data.payeeNote as string | undefined,
      payerMessage: data.payerMessage as string | undefined,
    }
  }
}

export type { MomoConfig, Environment } from './types'
export type {
  RequestToPayParams,
  TransferParams,
  TransactionStatus,
  Balance,
  AccountHolderStatus,
  BasicUserInfo,
  Party,
  TokenResponse,
  ApiKeyResponse,
  MomoWebhookPayload,
} from './types'
