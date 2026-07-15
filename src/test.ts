import { Momo } from './index.js'

const momo = new Momo({
  subscriptionKey: 'votre_subscription_key',
  apiUser: 'votre_api_user',
  apiKey: 'votre_api_key',
  environment: 'sandbox',
})

async function main() {
  const balance = await momo.collections.getBalance()
  console.log('Solde:', balance)
}

main().catch(console.error)
