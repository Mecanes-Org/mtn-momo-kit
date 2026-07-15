import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance, AccountHolderStatus } from './types'

export class Disbursements {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async transfer(params: TransferParams, referenceId: string): Promise<void> {
    await this.client.post('/disbursement/v1_0/transfer', params, {
      'X-Reference-Id': referenceId,
      'X-Target-Environment': 'sandbox',
    })
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
}
