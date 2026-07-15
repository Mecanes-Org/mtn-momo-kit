import { HttpClient } from './client'
import { Collections } from './collections'
import { Disbursements } from './disbursements'
import { Remittances } from './remittances'
import type { MomoConfig } from './types'

export class Momo {
  readonly collections: Collections
  readonly disbursements: Disbursements
  readonly remittances: Remittances

  constructor(config: MomoConfig) {
    const env = config.environment ?? 'sandbox'
    const client = new HttpClient(config.apiUser, config.apiKey, config.subscriptionKey, env)

    this.collections = new Collections(client)
    this.disbursements = new Disbursements(client)
    this.remittances = new Remittances(client)
  }
}

export type { MomoConfig, Environment } from './types'
export type {
  RequestToPayParams,
  TransferParams,
  TransactionStatus,
  Balance,
  AccountHolderStatus,
  Party,
  TokenResponse,
} from './types'
