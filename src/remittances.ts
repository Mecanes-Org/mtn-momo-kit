import { HttpClient } from './client'
import type { TransferParams, TransactionStatus, Balance } from './types'

export class Remittances {
  private client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async transfer(params: TransferParams, referenceId: string): Promise<void> {
    await this.client.post('/remittance/v1_0/transfer', params, {
      'X-Reference-Id': referenceId,
      'X-Target-Environment': 'sandbox',
    })
  }

  async getTransactionStatus(referenceId: string): Promise<TransactionStatus> {
    return this.client.get<TransactionStatus>(
      `/remittance/v1_0/transfer/${referenceId}`,
    )
  }

  async getBalance(): Promise<Balance> {
    return this.client.get<Balance>('/remittance/v1_0/account/balance')
  }
}
