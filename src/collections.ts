import { HttpClient } from './client'
import type { RequestToPayParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

/**
 * Module Collections — réception de paiements (Request to Pay).
 * Utilisé pour encaisser des paiements clients sur votre site e-commerce.
 */
export class Collections {
  private client: HttpClient

  /**
   * @param client - Instance HttpClient configurée pour Collections
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Demande un paiement à un client MTN MoMo.
   * La transaction est asynchrone — MTN renvoie le statut final via webhook.
   *
   * @param params - Paramètres de la demande de paiement
   * @param params.amount - Montant (ex: "5000")
   * @param params.currency - Devise (ex: "EUR", "XAF")
   * @param params.externalId - Identifiant métier de la transaction
   * @param params.payer - Informations du payeur (partyIdType + partyId)
   * @param params.payerMessage - Message visible par le payeur (optionnel)
   * @param params.payeeNote - Note interne pour le bénéficiaire (optionnel)
   * @param params.callbackUrl - URL de callback par transaction (optionnel)
   * @param referenceId - UUID v4 unique pour cette transaction
   *
   * @example
   * const refId = uuid()
   * await momo.collections.requestToPay({
   *   amount: '5000',
   *   currency: 'EUR',
   *   externalId: 'commande-123',
   *   payer: { partyIdType: 'MSISDN', partyId: '256772123456' },
   * }, refId)
   */
  async requestToPay(params: RequestToPayParams, referenceId: string): Promise<void> {
    const headers: Record<string, string> = {
      'X-Reference-Id': referenceId,
    }
    if (params.callbackUrl) {
      headers['X-Callback-Url'] = params.callbackUrl
    }
    await this.client.post('/collection/v1_0/requesttopay', params, headers)
  }

  /**
   * Récupère le statut d'une transaction Request to Pay.
   *
   * @param referenceId - UUID de la transaction (celui passé à requestToPay)
   * @returns Statut complet de la transaction
   *
   * @example
   * const status = await momo.collections.getTransactionStatus(refId)
   * console.log(status.status) // SUCCESSFUL | FAILED | PENDING
   */
  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/collection/v1_0/requesttopay/${referenceId}`,
    )
  }

  /**
   * Consulte le solde du portefeuille Collections.
   *
   * @returns Solde disponible et devise
   *
   * @example
   * const balance = await momo.collections.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/collection/v1_0/account/balance')
  }

  /**
   * Vérifie si un compte MoMo est actif et peut recevoir des paiements.
   *
   * @param partyIdType - Type d'identifiant (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Valeur de l'identifiant (numéro de téléphone, email, etc.)
   * @returns Résultat du test (true/false) et raison éventuelle
   *
   * @example
   * const actif = await momo.collections.isAccountHolderActive('MSISDN', '256772123456')
   * console.log(actif.result) // true | false
   */
  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/collection/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  /**
   * Récupère les informations de base d'un utilisateur MoMo (nom, email, etc.).
   *
   * @param partyIdType - Type d'identifiant (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Valeur de l'identifiant
   * @returns Informations personnelles de l'utilisateur (si disponibles)
   *
   * @example
   * const info = await momo.collections.getBasicUserInfo('MSISDN', '256772123456')
   * console.log(info.given_name, info.family_name)
   */
  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/collection/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  /**
   * Consulte le solde du portefeuille Collections dans une devise spécifique.
   *
   * @param currency - Code devise (ex: "EUR", "USD", "XAF")
   * @returns Solde disponible dans la devise demandée
   *
   * @example
   * const balance = await momo.collections.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/collection/v1_0/account/balance/${currency}`)
  }
}
