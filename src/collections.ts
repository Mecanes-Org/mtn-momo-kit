import { HttpClient } from './client'
import type { RequestToPayParams, TransactionStatus, Balance, AccountHolderStatus } from './types'

export class Collections {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async requestToPay(params: RequestToPayParams, referenceId: string): Promise<void> {
    await this.client.post('/collection/v1_0/requesttopay', params, {
      'X-Reference-Id': referenceId,
      'X-Target-Environment': 'sandbox',
    })
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
}
