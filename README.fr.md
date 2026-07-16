# MTN MoMo Kit

[![npm version](https://img.shields.io/npm/v/mtn-momo-kit)](https://www.npmjs.com/package/mtn-momo-kit)
[![npm downloads](https://img.shields.io/npm/dm/mtn-momo-kit)](https://www.npmjs.com/package/mtn-momo-kit)
[![License](https://img.shields.io/npm/l/mtn-momo-kit)](https://www.npmjs.com/package/mtn-momo-kit)

Kit TypeScript universel pour l'API MTN Mobile Money (MoMo). Compatible **Node.js**, **React Native**, **Expo**, et **navigateur (Vite, Next.js, etc.)**.

## Table des matières

- [Installation](#installation)
- [Obtenir vos credentials](#obtenir-vos-credentials)
- [Démarrage rapide](#démarrage-rapide)
- [Provisioning](#provisioning)
  - [Créer un API User](#1-créer-un-api-user)
  - [Générer une API Key](#2-générer-une-api-key)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
  - [Collections](#collections)
  - [Disbursements](#disbursements)
  - [Remittances](#remittances)
- [Webhooks](#webhooks)
- [Référence API](#référence-api)
- [Tests Sandbox](#tests-sandbox)
- [Passage en Production](#passage-en-production)
- [Gestion des erreurs](#gestion-des-erreurs)
- [FAQ](#faq)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Node.js 18+** (ou React Native 0.71+, ou un navigateur moderne)
- **npm** (ou votre gestionnaire de paquets habituel)
- **Un compte développeur MTN MoMo** — [créez-en un gratuitement](https://momodeveloper.mtn.com)
- **Une Primary Key** après souscription à un produit sur le portail (voir [Obtenir vos credentials](#obtenir-vos-credentials))

> **Pas encore de compte ?** Suivez d'abord les étapes 1–3 de [Obtenir vos credentials](#obtenir-vos-credentials), puis revenez ici.

---

## Installation

```bash
npm install mtn-momo-kit
```

Le Kit dépend uniquement de `base-64` (1kB) pour l'encodage Base64 multiplateforme. Les autres APIs (`fetch`, `crypto`) sont natives, disponibles dans Node.js 18+, React Native 0.71+, et tous les navigateurs modernes.

---

## Obtenir vos credentials

Avant d'utiliser le Kit, vous devez obtenir vos credentials API depuis MTN. Suivez ces étapes :

### 1. Créer un compte

Allez sur [momodeveloper.mtn.com](https://momodeveloper.mtn.com) et créez un compte développeur.

### 2. Souscrire à un produit

Connectez-vous, cliquez sur **Products** et abonnez-vous au produit souhaité :

| Produit | Utilité |
|---|---|
| **Collections** | Recevoir des paiements clients |
| **Disbursements** | Envoyer de l'argent (remboursements, reversements) |
| **Remittances** | Transferts internationaux |

> Chaque produit a sa propre **Primary Key**. Abonnez-vous à chaque produit nécessaire.

### 3. Récupérer votre Primary Key

Allez dans votre **Profil** (menu en haut à droite) → descendez tout en bas de la page. Vous verrez les clés de vos produits :

```
Primary Key:    d7de09f262644dfda901161d97d741a6
Secondary Key:  8a3f1b2c3d4e5f6a7b8c9d0e1f2a3b4c
```

| Clé | Usage |
|---|---|
| **Primary Key** → `subscriptionKey` | Utilisée dans votre code |
| **Secondary Key** | Backup pour rotation — mêmes permissions que la Primary |

> La Secondary Key sert à **changer** votre Primary Key sans interruption : basculez sur Secondary, regénérez Primary, puis rebasculez.

**`subscriptionKey` = Primary Key**

### 4. Créer un API User & une API Key

Deux options :

<details>
<summary><b>Option A — Avec le Kit (recommandé)</b></summary>

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

// Créer l'API User
const apiUser = uuid()
await Momo.createApiUser('VOTRE_PRIMARY_KEY', apiUser, 'https://votre-site.com/webhook')
console.log('API User:', apiUser)

// Générer l'API Key
const apiKey = await Momo.generateApiKey('VOTRE_PRIMARY_KEY', apiUser)
console.log('API Key:', apiKey)
```

**`apiUser` = l'UUID généré**
**`apiKey` = la clé retournée par `generateApiKey()`**
</details>

<details>
<summary><b>Option B — Via le portail</b></summary>

1. Allez dans la section **API User** du portail
2. Cliquez sur **Create API User** et générez une API Key
3. Copiez l'UUID de l'API User et l'API Key
</details>

### 5. Prêt !

Vous avez maintenant les trois credentials :

```
subscriptionKey → Primary Key
apiUser         → UUID de l'étape 4
apiKey          → Clé de l'étape 4
```

---

## Démarrage rapide

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo({
  subscriptionKey: 'votre_clé_primaire',           // Clé par défaut
  // Ou des clés spécifiques par produit :
  // collectionSubscriptionKey: '...',
  // disbursementSubscriptionKey: '...',
  // remittanceSubscriptionKey: '...',
  apiUser: 'votre_api_user',
  apiKey: 'votre_api_key',
  environment: 'sandbox',
})

// Consulter le solde
const balance = await momo.collections.getBalance()
console.log(`${balance.availableBalance} ${balance.currency}`)
```

---

## Provisioning

Avant d'utiliser le Kit, vous avez besoin d'un **API User** et d'une **API Key**. En sandbox, vous pouvez les créer directement avec le Kit. En production, MTN les fournit après le KYC.

> ⚠️ **Important** : Chaque produit (Collections, Disbursements, Remittances) a sa propre **Primary Key**. Abonnez-vous à chaque produit séparément sur [momodeveloper.mtn.com](https://momodeveloper.mtn.com). Une Primary Key de Disbursements ne fonctionnera **pas** sur les endpoints Collections (`momo.collections.*`).

### 1. Créer un API User

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

const referenceId = uuid()

await Momo.createApiUser(
  'votre_clé_primaire',
  referenceId,
  'https://votre-domaine.com/webhook', // URL de notification
  'sandbox',                            // 'sandbox' | 'production'
)

console.log('API User créé :', referenceId)
```

| Paramètre | Type | Description |
|---|---|---|
| `subscriptionKey` | `string` | Votre Primary Key (après souscription à un produit) |
| `referenceId` | `string` | UUID v4 — devient votre API User ID |
| `callbackHost` | `string` | URL où MTN envoie les notifications de transaction |
| `environment` | `'sandbox' \| 'production'` | Défaut `'sandbox'` |

### 2. Générer une API Key

```ts
const apiKey = await Momo.generateApiKey(
  'votre_clé_primaire',
  referenceId, // Même UUID que createApiUser
  'sandbox',
)

console.log('API Key :', apiKey)
// Stockez cette clé — elle ne sera plus jamais affichée
```

### Script de provisioning complet

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

async function setup() {
  const ref = uuid()

  // Étape 1 — Créer l'API User
  await Momo.createApiUser('MA_CLÉ_PRIMAIRE', ref, 'https://mon-site.com/webhook')
  console.log('API User :', ref)

  // Étape 2 — Générer l'API Key
  const apiKey = await Momo.generateApiKey('MA_CLÉ_PRIMAIRE', ref)
  console.log('API Key :', apiKey)

  // Étape 3 — Utiliser le Kit
  const momo = new Momo({
    subscriptionKey: 'MA_CLÉ_PRIMAIRE',
    apiUser: ref,
    apiKey,
    environment: 'sandbox',
  })

  const balance = await momo.collections.getBalance()
  console.log('Solde :', balance)
}

setup().catch(console.error)
```

> **Note** : En production, MTN fournit directement l'API User et l'API Key — ignorez les étapes 1 et 2.

---

## Configuration

Créez un fichier `.env` à la racine du projet :

```env
MOMO_SUBSCRIPTION_KEY=votre_clé_primaire
MOMO_API_USER=votre_api_user
MOMO_API_KEY=votre_api_key
MOMO_ENVIRONMENT=sandbox
MOMO_CALLBACK_HOST=https://votre-site.com/webhook
```

### Lecture du `.env` selon la plateforme

<details>
<summary><b>React Native</b> — <code>react-native-dotenv</code></summary>

```bash
npm install react-native-dotenv --save-dev
```

```ts
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
}
```

```ts
import { MOMO_SUBSCRIPTION_KEY, MOMO_API_USER, MOMO_API_KEY } from '@env'
```
</details>

<details>
<summary><b>Expo</b> — <code>expo-constants</code></summary>

```ts
// app.json
{
  "expo": {
    "extra": {
      "momoSubscriptionKey": process.env.MOMO_SUBSCRIPTION_KEY,
      "momoApiUser": process.env.MOMO_API_USER,
      "momoApiKey": process.env.MOMO_API_KEY
    }
  }
}
```

```ts
import Constants from 'expo-constants'

const { momoSubscriptionKey, momoApiUser, momoApiKey } = Constants.expoConfig?.extra ?? {}
```
</details>

<details>
<summary><b>Vite / Web</b> — Variables d'environnement natives</summary>

```env
# .env (doit commencer par VITE_)
VITE_MOMO_SUBSCRIPTION_KEY=xxx
VITE_MOMO_API_USER=xxx
VITE_MOMO_API_KEY=xxx
```

```ts
const momo = new Momo({
  subscriptionKey: import.meta.env.VITE_MOMO_SUBSCRIPTION_KEY,
  apiUser: import.meta.env.VITE_MOMO_API_USER,
  apiKey: import.meta.env.VITE_MOMO_API_KEY,
  environment: import.meta.env.VITE_MOMO_ENVIRONMENT ?? 'sandbox',
})
```
</details>

<details>
<summary><b>Next.js</b> — Variables d'environnement publiques</summary>

```env
# .env.local
NEXT_PUBLIC_MOMO_SUBSCRIPTION_KEY=xxx
NEXT_PUBLIC_MOMO_API_USER=xxx
NEXT_PUBLIC_MOMO_API_KEY=xxx
```

```ts
const momo = new Momo({
  subscriptionKey: process.env.NEXT_PUBLIC_MOMO_SUBSCRIPTION_KEY!,
  apiUser: process.env.NEXT_PUBLIC_MOMO_API_USER!,
  apiKey: process.env.NEXT_PUBLIC_MOMO_API_KEY!,
  environment: 'sandbox',
})
```
</details>

<details>
<summary><b>Node.js</b> — <code>dotenv</code></summary>

```bash
npm install dotenv
```

```ts
import 'dotenv/config'

const momo = new Momo({
  subscriptionKey: process.env.MOMO_SUBSCRIPTION_KEY!,
  apiUser: process.env.MOMO_API_USER!,
  apiKey: process.env.MOMO_API_KEY!,
  environment: process.env.MOMO_ENVIRONMENT ?? 'sandbox',
})
```
</details>

> **Note importante** : Ne commitez jamais votre fichier `.env`. Ajoutez-le à `.gitignore`.

---

## Utilisation

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo({
  subscriptionKey: 'votre_clé_primaire',
  apiUser: 'votre_api_user',
  apiKey: 'votre_api_key',
  environment: 'sandbox', // 'sandbox' | 'production'
})
```

Le constructeur initialise trois modules et supporte des clés par produit :

```ts
const momo = new Momo({
  // Clé unique pour tous les produits
  subscriptionKey: 'primary_key_collections',

  // Ou des clés spécifiques :
  collectionSubscriptionKey: 'primary_key_collections',
  disbursementSubscriptionKey: 'primary_key_disbursements',
  remittanceSubscriptionKey: 'primary_key_remittances',

  apiUser: 'votre_api_user',
  apiKey: 'votre_api_key',
  environment: 'sandbox',
})
```

| Module | Accès | Description |
|---|---|---|
| Collections | `momo.collections` | Paiements entrants (Request to Pay) |
| Disbursements | `momo.disbursements` | Paiements sortants (Transfer) |
| Remittances | `momo.remittances` | Transferts transfrontaliers |

### Collections

Recevoir des paiements depuis vos clients.

```ts
import { v4 as uuid } from 'uuid'

const referenceId = uuid()

// 1. Demander un paiement
await momo.collections.requestToPay(
  {
    amount: '5000',
    currency: 'EUR',
    externalId: 'facture-2024-001',
    payer: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
    payerMessage: 'Paiement facture janvier 2024',
    payeeNote: 'Merci pour votre paiement',
  },
  referenceId,
)

// 2. Vérifier le statut
const statut = await momo.collections.getTransactionStatus(referenceId)
console.log(statut.status) // 'SUCCESSFUL' | 'FAILED' | 'PENDING'

// 3. Consulter le solde
const solde = await momo.collections.getBalance()
console.log(`${solde.availableBalance} ${solde.currency}`)

// 4. Vérifier si un compte est actif
const actif = await momo.collections.isAccountHolderActive('MSISDN', '256772123456')
console.log(actif.result) // true | false
```

### Disbursements

Envoyer de l'argent à vos utilisateurs.

```ts
import { v4 as uuid } from 'uuid'

const referenceId = uuid()

// 1. Effectuer un transfert
await momo.disbursements.transfer(
  {
    amount: '2500',
    currency: 'EUR',
    externalId: 'remb-2024-001',
    payee: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
    payerMessage: 'Remboursement commande #1234',
    payeeNote: 'Votre remboursement a été effectué',
  },
  referenceId,
)

// 2. Vérifier le statut
const statut = await momo.disbursements.getTransactionStatus(referenceId)

// 3. Consulter le solde
const solde = await momo.disbursements.getBalance()

// 4. Valider un compte bénéficiaire
const actif = await momo.disbursements.isAccountHolderActive('MSISDN', '256772123456')
```

### Remittances

Transferts d'argent internationaux.

```ts
const referenceId = uuid()

await momo.remittances.transfer(
  {
    amount: '100000',
    currency: 'EUR',
    externalId: 'transfert-2024-001',
    payee: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
  },
  referenceId,
)

const statut = await momo.remittances.getTransactionStatus(referenceId)
const solde = await momo.remittances.getBalance()
```

---

## Webhooks

MTN MoMo envoie des notifications asynchrones de changement de statut à votre `callbackHost`. Utilisez `Momo.parseWebhookPayload()` pour valider et parser les requêtes entrantes.

```ts
import { Momo } from 'mtn-momo-kit'

// Exemple : endpoint webhook avec Express.js
app.post('/webhook', (req, res) => {
  const payload = Momo.parseWebhookPayload(req.body)

  if (!payload) {
    return res.status(400).send('Payload invalide')
  }

  console.log('Transaction :', payload.referenceId, payload.status)

  switch (payload.status) {
    case 'SUCCESSFUL':
      // Mettre à jour la base, livrer le service, etc.
      break
    case 'FAILED':
      // Notifier l'utilisateur, logique de réessai, etc.
      break
    case 'PENDING':
      // Attendre le statut final
      break
  }

  res.status(200).send('OK')
})
```

### Structure du payload webhook

```ts
interface MomoWebhookPayload {
  referenceId: string      // UUID de référence de la transaction
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  amount?: string
  currency?: string
  financialTransactionId?: string  // ID MTN de la transaction
  externalId?: string              // Votre ID métier
  payer?: Party
  reason?: Record<string, unknown>
  payeeNote?: string
  payerMessage?: string
}
```

---

## Référence API

### Constructeur `Momo`

```ts
constructor(config: MomoConfig)
```

| Propriété | Type | Défaut | Description |
|---|---|---|---|
| `subscriptionKey` | `string` | — | Primary Key par défaut (utilisée pour tous les produits) |
| `collectionSubscriptionKey` | `string` | — | Primary Key pour Collections uniquement (remplace `subscriptionKey`) |
| `disbursementSubscriptionKey` | `string` | — | Primary Key pour Disbursements uniquement (remplace `subscriptionKey`) |
| `remittanceSubscriptionKey` | `string` | — | Primary Key pour Remittances uniquement (remplace `subscriptionKey`) |
| `apiUser` | `string` | — | API User ID (UUID v4) |
| `apiKey` | `string` | — | Clé API générée |
| `environment` | `'sandbox' \| 'production'` | `'sandbox'` | Environnement cible |
| `callbackHost` | `string` | — | URL de callback pour les notifications (optionnel) |

### `Momo.createApiUser()`

```ts
static createApiUser(subscriptionKey, referenceId, callbackHost, environment): Promise<void>
```

Crée un API User dans l'environnement sandbox. Voir [Provisioning](#provisioning).

### `Momo.generateApiKey()`

```ts
static generateApiKey(subscriptionKey, referenceId, environment): Promise<string>
```

Génère une API Key pour un API User existant. Voir [Provisioning](#provisioning).

### `Momo.parseWebhookPayload()`

```ts
static parseWebhookPayload(body: unknown): MomoWebhookPayload | null
```

Valide et parse un payload webhook MTN entrant. Retourne `null` si le payload est invalide. Voir [Webhooks](#webhooks).

### `collections.requestToPay(params, referenceId)`

| Paramètre | Type | Description |
|---|---|---|
| `params.amount` | `string` | Montant (ex: `"5000"`) |
| `params.currency` | `string` | Devise (ex: `"EUR"`, `"XAF"`) |
| `params.externalId` | `string` | Identifiant métier de la transaction |
| `params.payer.partyIdType` | `'MSISDN' \| 'EMAIL' \| 'PARTY_CODE'` | Type d'identifiant du payeur |
| `params.payer.partyId` | `string` | Valeur de l'identifiant (téléphone, email, etc.) |
| `params.payerMessage` | `string` | Message visible par le payeur (optionnel) |
| `params.payeeNote` | `string` | Note interne pour le bénéficiaire (optionnel) |
| `params.callbackUrl` | `string` | URL de callback par transaction (optionnel, remplace `callbackHost`) |
| `referenceId` | `string` | UUID v4 unique pour cette transaction |

**Retour :** `Promise<void>` (statut 202 = acceptée)

### `transfer(params, referenceId)`

Mêmes paramètres que `requestToPay` (sauf `payer` → `payee`).

---

## Tests Sandbox

### Provisionner les credentials avec le Kit

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

async function sandboxSetup() {
  const ref = uuid()

  // 1. Créer l'API User (c'est votre apiUser)
  await Momo.createApiUser(
    'VOTRE_CLÉ_PRIMAIRE',
    ref,
    'https://votre-site.com/webhook',
  )

  // 2. Générer l'API Key
  const apiKey = await Momo.generateApiKey('VOTRE_CLÉ_PRIMAIRE', ref)

  // 3. Initialiser le Kit
  const momo = new Momo({
    subscriptionKey: 'VOTRE_CLÉ_PRIMAIRE',
    apiUser: ref,
    apiKey,
    environment: 'sandbox',
  })

  // 4. Tester
  const balance = await momo.collections.getBalance()
  console.log('Solde sandbox :', balance)
}
```

### Numéros de test

| Numéro | Comportement |
|---|---|
| `256772123456` | Paiement accepté |
| `256772654321` | Paiement refusé |
| `256772999999` | Transaction en attente (timeout) |

---

## Passage en Production

### Prérequis

1. Compléter le processus KYC auprès de MTN
2. Signer le contrat de service
3. Obtenir les credentials **production** (API User, API Key) depuis le portail

### Changer l'environnement

```ts
const momo = new Momo({
  subscriptionKey: 'clé_production',
  apiUser: 'api_user_production',
  apiKey: 'api_key_production',
  environment: 'production',
})
```

### Sandbox vs Production

| Aspect | Sandbox | Production |
|---|---|---|
| URL | `sandbox.momodeveloper.mtn.com` | `momoapi.mtn.com` |
| API User | Auto-créé via `createApiUser()` | Fourni par MTN |
| API Key | Auto-généré via `generateApiKey()` | Fourni par MTN |
| Transactions | Simulées | Réelles |
| Callbacks | Webhook simulé | Webhook réel |
| Limites | Illimitées | Selon contrat |

---

## Gestion des erreurs

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo(config)

try {
  await momo.collections.requestToPay(params, refId)
} catch (error) {
  if (error instanceof Error) {
    console.error('Code:', error.message.split(':')[0])
    console.error('Détail:', error.message)
  }
}
```

### Codes d'erreur HTTP courants

| Code | Cause |
|---|---|
| `400` | Requête invalide (paramètres manquants ou incorrects) |
| `401` | Authentification échouée (token invalide ou expiré) |
| `403` | Accès refusé (vérifiez votre subscription key) |
| `404` | Transaction introuvable |
| `409` | Conflit (ID de référence déjà utilisé) |
| `429` | Trop de requêtes (rate limit) |
| `500` | Erreur interne MTN |

### Gestion du token

Le Kit gère automatiquement l'obtention et le renouvellement du token OAuth2. Il est récupéré de manière **lazy** (au premier appel API) et conservé pour les appels suivants. Aucune action manuelle requise.

---

## FAQ

### Ce Kit fonctionne-t-il en React Native ?

Oui. Il utilise uniquement `fetch` (disponible depuis RN 0.71+) et ne dépend d'aucun module natif Node.js (`fs`, `crypto`, `path`, `stream`).

### Puis-je l'utiliser côté navigateur ?

Oui. Le Kit fonctionne dans tous les navigateurs modernes supportant `fetch`.

### Comment gérer les callbacks/notifications ?

Définissez `callbackHost` lors de la création de l'API User. MTN appellera cette URL pour notifier le statut final de la transaction. Utilisez `Momo.parseWebhookPayload()` pour valider les requêtes entrantes sur votre endpoint webhook.

### Les numéros de test sandbox sont-ils les mêmes pour tous les pays ?

Non. Les numéros de test peuvent varier selon le pays. Consultez la documentation officielle de MTN pour le pays cible.

### Le taux de change est-il inclus ?

Non. Le Kit traite les montants dans la devise spécifiée. La conversion de devise est gérée par MTN selon leur taux en vigueur.

---

## Licence

ISC
