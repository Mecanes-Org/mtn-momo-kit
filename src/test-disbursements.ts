import 'dotenv/config'
import { v4 as uuid } from 'uuid'
import { Momo } from './index.js'

const PRIMARY_KEY = process.env.MOMO_DISBURSEMENTS_KEY ?? process.env.MOMO_SUBSCRIPTION_KEY!
const CALLBACK_HOST = process.env.MOMO_CALLBACK_HOST ?? 'https://mon-site.com/webhook'

if (!PRIMARY_KEY) {
  console.error('ERREUR : Définissez MOMO_SUBSCRIPTION_KEY ou MOMO_DISBURSEMENTS_KEY dans .env')
  process.exit(1)
}

async function provisioning() {
  console.log('--- Provisioning Disbursements ---')

  const ref = uuid()

  await Momo.createApiUser(PRIMARY_KEY, ref, CALLBACK_HOST)
  console.log('API User :', ref)

  const apiKey = await Momo.generateApiKey(PRIMARY_KEY, ref)
  console.log('API Key :', apiKey)

  return { apiUser: ref, apiKey }
}

async function main() {
  const { apiUser, apiKey } = await provisioning()

  const momo = new Momo({
    subscriptionKey: PRIMARY_KEY,
    apiUser,
    apiKey,
    environment: 'sandbox',
  })

  const balance = await momo.disbursements.getBalance()
  console.log('Solde Disbursements :', balance.availableBalance, balance.currency)

  const refId = uuid()
  await momo.disbursements.transfer(
    {
      amount: '500',
      currency: 'EUR',
      externalId: 'remb-001',
      payee: { partyIdType: 'MSISDN', partyId: '256772123456' },
      payeeNote: 'Remboursement commande #123',
    },
    refId,
  )
  console.log('Transfert envoyé :', refId)

  const status = await momo.disbursements.getTransactionStatus(refId)
  console.log('Statut :', status.status)

  const actif = await momo.disbursements.isAccountHolderActive('MSISDN', '256772123456')
  console.log('Compte actif :', actif.result)

  const info = await momo.disbursements.getBasicUserInfo('MSISDN', '256772123456')
  console.log('Utilisateur :', info.given_name, info.family_name)

  const balanceEur = await momo.disbursements.getBalanceInCurrency('EUR')
  console.log('Solde EUR :', balanceEur.availableBalance)
}

main().catch(console.error)
