import { HttpClient } from './client'
import type { RequestToPayParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

/**
 * Collections module — incoming payments (Request to Pay).
 * Use to collect payments from customers on your e-commerce site.
 */
export class Collections {
  private client: HttpClient

  /**
   * @param client - HttpClient instance configured for Collections
   */
  constructor(client: HttpClient) {
    this.client = client
  }

  /**
   * Request a payment from an MTN MoMo customer.
   * The transaction is asynchronous — MTN sends the final status via webhook.
   *
   * @param params - Payment request parameters
   * @param params.amount - Amount (e.g. "5000")
   * @param params.currency - Currency code (e.g. "EUR", "XAF")
   * @param params.externalId - Your business transaction ID
   * @param params.payer - Payer information (partyIdType + partyId)
   * @param params.payerMessage - Message visible to the payer (optional)
   * @param params.payeeNote - Internal note for the payee (optional)
   * @param params.callbackUrl - Per-transaction callback URL (optional, overrides callbackHost)
   * @param referenceId - Unique UUID v4 for this transaction
   *
   * @example
   * const refId = uuid()
   * await momo.collections.requestToPay({
   *   amount: '5000',
   *   currency: 'EUR',
   *   externalId: 'order-123',
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
   * Get the status of a Request to Pay transaction.
   *
   * @param referenceId - Transaction UUID (the one passed to requestToPay)
   * @returns Full transaction status
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
   * Get the Collections wallet balance.
   *
   * @returns Available balance and currency
   *
   * @example
   * const balance = await momo.collections.getBalance()
   * console.log(balance.availableBalance, balance.currency)
   */
  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/collection/v1_0/account/balance')
  }

  /**
   * Check if an MoMo account is active and can receive payments.
   *
   * @param partyIdType - Identifier type (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Identifier value (phone number, email, etc.)
   * @returns Active status and optional reason
   *
   * @example
   * const active = await momo.collections.isAccountHolderActive('MSISDN', '256772123456')
   * console.log(active.result) // true | false
   */
  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/collection/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  /**
   * Get basic user info from an MoMo account (name, email, etc.).
   *
   * @param partyIdType - Identifier type (MSISDN | EMAIL | PARTY_CODE)
   * @param partyId - Identifier value
   * @returns Basic personal information (if available)
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
   * Get the Collections wallet balance in a specific currency.
   *
   * @param currency - Currency code (e.g. "EUR", "USD", "XAF")
   * @returns Balance in the requested currency
   *
   * @example
   * const balance = await momo.collections.getBalanceInCurrency('EUR')
   * console.log(balance.availableBalance)
   */
  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/collection/v1_0/account/balance/${currency}`)
  }
}
