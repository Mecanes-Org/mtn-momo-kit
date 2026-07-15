import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, BasicUserInfo } from './types'

export class Remittances {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async transfer(params: TransferParams, referenceId: string): Promise<void> {
    const headers: Record<string, string> = {
      'X-Reference-Id': referenceId,
    }
    if (params.callbackUrl) {
      headers['X-Callback-Url'] = params.callbackUrl
    }
    await this.client.post('/remittance/v1_0/transfer', params, headers)
  }

  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/remittance/v1_0/transfer/${referenceId}`,
    )
  }

  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/remittance/v1_0/account/balance')
  }

  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/remittance/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/remittance/v1_0/account/balance/${currency}`)
  }
}
