import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, BasicUserInfo } from './types'

/**
 * Remittances module — cross-border money transfers.
 * Use to send money between different countries.
 */
export class Remittances {
  private client: HttpClient

  /**
   * @param client - HttpClient instance configured for Remittances
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Send an international money transfer.
   *
   * @param params - Transfer parameters
   * @param params.amount - Amount (e.g. "100000")
   * @param params.currency - Currency code (e.g. "EUR", "USD")
   * @param params.externalId - Your business transaction ID
   * @param params.payee - Payee information (partyIdType + partyId)
   * @param params.payerMessage - Message visible to the payer (optional)
   * @param params.payeeNote - Note for the payee (optional)
   * @param params.callbackUrl - Per-transaction callback URL (optional, overrides callbackHost)
   * @param referenceId - Unique UUID v4 for this transaction
   *
   * @example
   * const refId = uuid()
   * await momo.remittances.transfer({
   *   amount: '100000',
   *   currency: 'EUR',
   *   externalId: 'transfer-001',
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
   * Get the status of an international transfer.
   *
   * @param referenceId - Transaction UUID (the one passed to transfer)
   * @returns Full transaction status
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
   * Get the Remittances wallet balance.
   *
   * @returns Available balance and currency
   *
   * @example
   * const balance = await momo.remittances.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/remittance/v1_0/account/balance')
  }

  /**
   * Get basic user info from an MoMo account.
   *
   * @param partyIdType - Identifier type (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Identifier value
   * @returns Basic personal information
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
   * Get the Remittances wallet balance in a specific currency.
   *
   * @param currency - Currency code (e.g. "EUR", "USD", "XAF")
   * @returns Balance in the requested currency
   *
   * @example
   * const balance = await momo.remittances.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/remittance/v1_0/account/balance/${currency}`)
  }
}
