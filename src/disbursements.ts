import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

/**
 * Disbursements module — outgoing payments (Transfer).
 * Use for refunds, seller payouts, prize money, etc.
 */
export class Disbursements {
  private client: HttpClient

  /**
   * @param client - HttpClient instance configured for Disbursements
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Send money to an MTN MoMo user.
   * Use for refunds, payouts to sellers, etc.
   *
   * @param params - Transfer parameters
   * @param params.amount - Amount (e.g. "2500")
   * @param params.currency - Currency code (e.g. "EUR", "XAF")
   * @param params.externalId - Your business transaction ID
   * @param params.payee - Payee information (partyIdType + partyId)
   * @param params.payerMessage - Message visible to the payer (optional)
   * @param params.payeeNote - Note for the payee (optional)
   * @param params.callbackUrl - Per-transaction callback URL (optional, overrides callbackHost)
   * @param referenceId - Unique UUID v4 for this transaction
   *
   * @example
   * const refId = uuid()
   * await momo.disbursements.transfer({
   *   amount: '2500',
   *   currency: 'EUR',
   *   externalId: 'refund-123',
   *   payee: { partyIdType: 'MSISDN', partyId: '256772123456' },
   *   payeeNote: 'Refund for order #123',
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
   * Get the status of a transfer.
   *
   * @param referenceId - Transaction UUID (the one passed to transfer)
   * @returns Full transaction status
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
   * Get the Disbursements wallet balance.
   *
   * @returns Available balance and currency
   *
   * @example
   * const balance = await momo.disbursements.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/disbursement/v1_0/account/balance')
  }

  /**
   * Check if an MoMo account is active before sending a transfer.
   *
   * @param partyIdType - Identifier type (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Identifier value
   * @returns true if the account is active, false otherwise
   *
   * @example
   * const active = await momo.disbursements.isAccountHolderActive('MSISDN', '256772123456')
   * if (!active.result) console.log('Inactive account')
   */
  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/disbursement/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  /**
   * Get basic user info from an MoMo account.
   *
   * @param partyIdType - Identifier type (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Identifier value
   * @returns Basic personal information
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
   * Get the Disbursements wallet balance in a specific currency.
   *
   * @param currency - Currency code (e.g. "EUR", "USD", "XAF")
   * @returns Balance in the requested currency
   *
   * @example
   * const balance = await momo.disbursements.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/disbursement/v1_0/account/balance/${currency}`)
  }
}
