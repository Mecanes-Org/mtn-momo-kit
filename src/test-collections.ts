import 'dotenv/config'
import { v4 as uuid } from 'uuid'
import { Momo } from './index.js'
import type { MomoWebhookPayload } from './types.js'

const PRIMARY_KEY = process.env.MOMO_SUBSCRIPTION_KEY!
const CALLBACK_HOST = process.env.MOMO_CALLBACK_HOST ?? 'https://mon-site.com/webhook'

if (!PRIMARY_KEY) {
  console.error('ERREUR : Définissez MOMO_SUBSCRIPTION_KEY dans .env')
  process.exit(1)
}

async function provisioning() {
  console.log('--- Provisioning ---')

  const ref = uuid()

  await Momo.createApiUser(PRIMARY_KEY, ref, CALLBACK_HOST)
  console.log('API User créé :', ref)

  const apiKey = await Momo.generateApiKey(PRIMARY_KEY, ref)
  console.log('API Key :', apiKey)

  return { apiUser: ref, apiKey }
}

async function usage() {
  console.log('\n--- Utilisation SDK ---')

  const { apiUser, apiKey } = await provisioning()

  const momo = new Momo({
    subscriptionKey: PRIMARY_KEY,
    apiUser,
    apiKey,
    environment: 'sandbox',
  })

  const balance = await momo.collections.getBalance()
  console.log('Solde :', balance.availableBalance, balance.currency)
  const refId = uuid()

  await momo.collections.requestToPay(
    {
      amount: '100',
      currency: 'EUR',
      externalId: 'test-001',
      payer: { partyIdType: 'MSISDN', partyId: '256772123456' },
    },
    refId,
  )
  console.log('Request to Pay envoyé :', refId)

  const status = await momo.collections.getTransactionStatus(refId)
  console.log('Statut :', status.status)

  const info = await momo.collections.getBasicUserInfo('MSISDN', '256772123456')
  console.log('Utilisateur :', info.given_name, info.family_name)

  const balanceEur = await momo.collections.getBalanceInCurrency('EUR')
  console.log('Solde EUR :', balanceEur.availableBalance)
}

function webhookDemo() {
  console.log('\n--- Webhook ---')

  const mockPayload = {
    referenceId: uuid(),
    status: 'SUCCESSFUL',
    amount: '5000',
    currency: 'EUR',
    financialTransactionId: 'MTN123456',
    externalId: 'facture-001',
    payer: {
      partyIdType: 'MSISDN',
      partyId: '256772123456'
    },
  }

  const parsed = Momo.parseWebhookPayload(mockPayload) as MomoWebhookPayload | null
  if (parsed) {
    console.log('Payload valide :', parsed.status, parsed.amount, parsed.currency)
  } else {
    console.log('Payload invalide')
  }
}

usage().catch(console.error)
webhookDemo()
