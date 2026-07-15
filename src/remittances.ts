import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, BasicUserInfo } from './types'

/**
 * Module Remittances — transferts d'argent internationaux.
 * Utilisé pour envoyer de l'argent entre différents pays (cross-border).
 */
export class Remittances {
  private client: HttpClient

  /**
   * @param client - Instance HttpClient configurée pour Remittances
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Effectue un transfert d'argent international.
   *
   * @param params - Paramètres du transfert
   * @param params.amount - Montant (ex: "100000")
   * @param params.currency - Devise (ex: "EUR", "USD")
   * @param params.externalId - Identifiant métier de la transaction
   * @param params.payee - Informations du bénéficiaire (partyIdType + partyId)
   * @param params.payerMessage - Message visible par le payeur (optionnel)
   * @param params.payeeNote - Note pour le bénéficiaire (optionnel)
   * @param params.callbackUrl - URL de callback par transaction (optionnel)
   * @param referenceId - UUID v4 unique pour cette transaction
   *
   * @example
   * const refId = uuid()
   * await momo.remittances.transfer({
   *   amount: '100000',
   *   currency: 'EUR',
   *   externalId: 'transfert-001',
   *   payee: { partyIdType: 'MSISDN', partyId: '256772123456' },
   * }, refId)
   */
  async transfer(params: TransferParams, referenceId: string): Promise<void> {
    const headers: Record<string, string> = {
      'X-Reference-Id': referenceId,
    }
    if (params.callbackUrl) {
      headers['X-Callback-Url'] = params.callbackUrl
    }
    await this.client.post('/remittance/v1_0/transfer', params, headers)
  }

  /**
   * Récupère le statut d'un transfert international.
   *
   * @param referenceId - UUID de la transaction (celui passé à transfer)
   * @returns Statut complet de la transaction
   *
   * @example
   * const status = await momo.remittances.getTransactionStatus(refId)
   * console.log(status.status)
   */
  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/remittance/v1_0/transfer/${referenceId}`,
    )
  }

  /**
   * Consulte le solde du portefeuille Remittances.
   *
   * @returns Solde disponible et devise
   *
   * @example
   * const balance = await momo.remittances.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/remittance/v1_0/account/balance')
  }

  /**
   * Récupère les informations de base d'un utilisateur MoMo.
   *
   * @param partyIdType - Type d'identifiant (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Valeur de l'identifiant
   * @returns Informations personnelles de l'utilisateur
   *
   * @example
   * const info = await momo.remittances.getBasicUserInfo('MSISDN', '256772123456')
   * console.log(info.given_name, info.family_name)
   */
  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/remittance/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  /**
   * Consulte le solde Remittances dans une devise spécifique.
   *
   * @param currency - Code devise (ex: "EUR", "USD", "XAF")
   * @returns Solde disponible dans la devise demandée
   *
   * @example
   * const balance = await momo.remittances.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/remittance/v1_0/account/balance/${currency}`)
  }
}
