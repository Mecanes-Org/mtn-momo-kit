import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

/**
 * Module Disbursements — envoi d'argent (Transfer).
 * Utilisé pour les remboursements, reversements aux vendeurs, paiements de gains, etc.
 */
export class Disbursements {
  private client: HttpClient

  /**
   * @param client - Instance HttpClient configurée pour Disbursements
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Envoie de l'argent à un utilisateur MTN MoMo.
   * Utilisé pour les remboursements, reversements aux vendeurs, etc.
   *
   * @param params - Paramètres du transfert
   * @param params.amount - Montant (ex: "2500")
   * @param params.currency - Devise (ex: "EUR", "XAF")
   * @param params.externalId - Identifiant métier de la transaction
   * @param params.payee - Informations du bénéficiaire (partyIdType + partyId)
   * @param params.payerMessage - Message visible par le payeur (optionnel)
   * @param params.payeeNote - Note pour le bénéficiaire (optionnel)
   * @param params.callbackUrl - URL de callback par transaction (optionnel)
   * @param referenceId - UUID v4 unique pour cette transaction
   *
   * @example
   * const refId = uuid()
   * await momo.disbursements.transfer({
   *   amount: '2500',
   *   currency: 'EUR',
   *   externalId: 'remb-123',
   *   payee: { partyIdType: 'MSISDN', partyId: '256772123456' },
   *   payeeNote: 'Remboursement commande #123',
   * }, refId)
   */
  async transfer(params: TransferParams, referenceId: string): Promise<void> {
    const headers: Record<string, string> = {
      'X-Reference-Id': referenceId,
    }
    if (params.callbackUrl) {
      headers['X-Callback-Url'] = params.callbackUrl
    }
    await this.client.post('/disbursement/v1_0/transfer', params, headers)
  }

  /**
   * Récupère le statut d'un transfert.
   *
   * @param referenceId - UUID de la transaction (celui passé à transfer)
   * @returns Statut complet de la transaction
   *
   * @example
   * const status = await momo.disbursements.getTransactionStatus(refId)
   * console.log(status.status)
   */
  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/disbursement/v1_0/transfer/${referenceId}`,
    )
  }

  /**
   * Consulte le solde du portefeuille Disbursements.
   *
   * @returns Solde disponible et devise
   *
   * @example
   * const balance = await momo.disbursements.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/disbursement/v1_0/account/balance')
  }

  /**
   * Vérifie si un compte MoMo est actif avant d'envoyer un transfert.
   *
   * @param partyIdType - Type d'identifiant (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Valeur de l'identifiant
   * @returns true si le compte est actif, false sinon
   *
   * @example
   * const actif = await momo.disbursements.isAccountHolderActive('MSISDN', '256772123456')
   * if (!actif.result) console.log('Compte inactif')
   */
  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/disbursement/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  /**
   * Récupère les informations de base d'un utilisateur MoMo.
   *
   * @param partyIdType - Type d'identifiant (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Valeur de l'identifiant
   * @returns Informations personnelles de l'utilisateur
   *
   * @example
   * const info = await momo.disbursements.getBasicUserInfo('MSISDN', '256772123456')
   * console.log(info.given_name)
   */
  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/disbursement/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  /**
   * Consulte le solde Disbursements dans une devise spécifique.
   *
   * @param currency - Code devise (ex: "EUR", "USD", "XAF")
   * @returns Solde disponible dans la devise demandée
   *
   * @example
   * const balance = await momo.disbursements.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/disbursement/v1_0/account/balance/${currency}`)
  }
}
