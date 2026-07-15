import { HttpClient } from './client'
import type { RequestToPayParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

export class Collections {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async requestToPay(params: RequestToPayParams, referenceId: string): Promise<void> {
    const headers: Record<string, string> = {
      'X-Reference-Id': referenceId,
    }
    if (params.callbackUrl) {
      headers['X-Callback-Url'] = params.callbackUrl
    }
    await this.client.post('/collection/v1_0/requesttopay', params, headers)
  }

  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/collection/v1_0/requesttopay/${referenceId}`,
    )
  }

  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/collection/v1_0/account/balance')
  }

  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/collection/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/collection/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/collection/v1_0/account/balance/${currency}`)
  }
}
