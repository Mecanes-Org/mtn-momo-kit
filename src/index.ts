import { HttpClient } from './client'
import { Collections } from './collections'
import { Disbursements } from './disbursements'
import { Remittances } from './remittances'
import type { MomoConfig, ApiKeyResponse, MomoWebhookPayload, Environment } from './types'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.momodeveloper.mtn.com',
  production: 'https://momoapi.mtn.com',
}

/**
 * Main entry point for the MTN MoMo SDK.
 * Initializes all three products: Collections, Disbursements, Remittances.
 *
 * @example
 * const momo = new Momo({
 *   subscriptionKey: '...',
 *   apiUser: '...',
 *   apiKey: '...',
 *   environment: 'sandbox',
 * })
 *
 * await momo.collections.requestToPay(params, referenceId)
 * await momo.disbursements.transfer(params, referenceId)
 */
export class Momo {
  readonly collections: Collections
  readonly disbursements: Disbursements
  readonly remittances: Remittances

  /**
   * @param config - SDK configuration
   * @param config.subscriptionKey - Default Primary Key (used for all products if no specific key is set)
   * @param config.collectionSubscriptionKey - Primary Key for Collections only (overrides subscriptionKey)
   * @param config.disbursementSubscriptionKey - Primary Key for Disbursements only (overrides subscriptionKey)
   * @param config.remittanceSubscriptionKey - Primary Key for Remittances only (overrides subscriptionKey)
   * @param config.apiUser - API User UUID (v4)
   * @param config.apiKey - API Key generated via generateApiKey()
   * @param config.environment - 'sandbox' (default) | 'production'
   * @param config.callbackHost - Callback URL for MTN webhook notifications (optional)
   */
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

  /**
   * Create an API User on the MTN portal.
   * Required provisioning step (sandbox) before using the SDK.
   *
   * @param subscriptionKey - Product Primary Key
   * @param referenceId - UUID v4 — becomes your apiUser
   * @param callbackHost - URL where MTN sends transaction notifications
   * @param environment - 'sandbox' (default) | 'production'
   *
   * @example
   * const ref = uuid()
   * await Momo.createApiUser('primary_key', ref, 'https://my-site.com/webhook')
   * console.log('API User:', ref)
   */
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

  /**
   * Generate an API Key for an existing API User.
   * Call after createApiUser().
   *
   * @param subscriptionKey - Product Primary Key
   * @param referenceId - API User UUID (same as createApiUser)
   * @param environment - 'sandbox' (default) | 'production'
   * @returns The API Key — store it securely, it will not be shown again
   *
   * @example
   * const apiKey = await Momo.generateApiKey('primary_key', ref)
   * console.log('API Key:', apiKey)
   */
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

  /**
   * Validate and parse an incoming MTN webhook payload.
   * Use this in your /webhook endpoint to verify transaction notifications.
   *
   * @param body - Raw webhook request body (req.body)
   * @returns Validated MomoWebhookPayload, or null if invalid
   *
   * @example
   * app.post('/webhook', (req, res) => {
   *   const payload = Momo.parseWebhookPayload(req.body)
   *   if (!payload) return res.status(400).send('Invalid payload')
   *   console.log(payload.status) // SUCCESSFUL | FAILED | PENDING
   *   res.status(200).send('OK')
   * })
   */
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
