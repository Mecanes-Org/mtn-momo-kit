import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, AccountHolderStatus, BasicUserInfo } from './types'

export class Disbursements {
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
    await this.client.post('/disbursement/v1_0/transfer', params, headers)
  }

  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/disbursement/v1_0/transfer/${referenceId}`,
    )
  }

  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/disbursement/v1_0/account/balance')
  }

  async isAccountHolderActive(partyIdType: string, partyId: string): Promise<AccountHolderStatus> {
    return this.client.get<AccountHolderStatus>(
      `/disbursement/v1_0/accountholder/${partyIdType}/${partyId}/active`,
    )
  }

  async getBasicUserInfo(partyIdType: string, partyId: string): Promise<BasicUserInfo> {
    return this.client.get<BasicUserInfo>(
      `/disbursement/v1_0/accountholder/${partyIdType}/${partyId}/basicuserinfo`,
    )
  }

  async getBalanceInCurrency(currency: string): Promise<Balance> {
    return this.client.get<Balance>(`/disbursement/v1_0/account/balance/${currency}`)
  }
}
