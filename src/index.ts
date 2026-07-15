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
 * Point d'entrée principal du SDK MTN MoMo.
 * Initialise les trois produits : Collections, Disbursements, Remittances.
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
   * @param config - Configuration complète du SDK
   * @param config.subscriptionKey - Primary Key par défaut (tous produits)
   * @param config.collectionSubscriptionKey - Primary Key Collections seulement
   * @param config.disbursementSubscriptionKey - Primary Key Disbursements seulement
   * @param config.remittanceSubscriptionKey - Primary Key Remittances seulement
   * @param config.apiUser - UUID v4 de l'API User
   * @param config.apiKey - API Key générée
   * @param config.environment - 'sandbox' (défaut) | 'production'
   * @param config.callbackHost - URL de callback pour les webhooks (optionnel)
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
   * Crée un API User sur le portail MTN.
   * Étape préliminaire obligatoire (sandbox) avant d'utiliser le SDK.
   *
   * @param subscriptionKey - Primary Key du produit
   * @param referenceId - UUID v4 qui deviendra votre apiUser
   * @param callbackHost - URL où MTN enverra les notifications
   * @param environment - 'sandbox' (défaut) | 'production'
   *
   * @example
   * const ref = uuid()
   * await Momo.createApiUser('primary_key', ref, 'https://mon-site.com/webhook')
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
   * Génère une API Key pour un API User existant.
   * À appeler après createApiUser().
   *
   * @param subscriptionKey - Primary Key du produit
   * @param referenceId - UUID de l'API User (le même que createApiUser)
   * @param environment - 'sandbox' (défaut) | 'production'
   * @returns L'API Key à conserver précieusement
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
   * Valide et parse un payload webhook envoyé par MTN.
   * Utilisez cette méthode dans votre endpoint /webhook pour vérifier
   * l'intégrité des notifications de transaction.
   *
   * @param body - Corps brut de la requête webhook (req.body)
   * @returns MomoWebhookPayload valide ou null si invalide
   *
   * @example
   * app.post('/webhook', (req, res) => {
   *   const payload = Momo.parseWebhookPayload(req.body)
   *   if (!payload) return res.status(400).send('Invalide')
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
