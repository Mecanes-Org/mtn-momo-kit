# MTN MoMo SDK

Universal TypeScript SDK for the MTN Mobile Money (MoMo) API. Compatible with **Node.js**, **React Native**, **Expo**, and **browsers (Vite, Next.js, etc.)**.

## Table of Contents

- [Installation](#installation)
- [Getting your credentials](#getting-your-credentials)
- [Quick Start](#quick-start)
- [Provisioning](#provisioning)
  - [Create an API User](#1-create-an-api-user)
  - [Generate an API Key](#2-generate-an-api-key)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Collections](#collections)
  - [Disbursements](#disbursements)
  - [Remittances](#remittances)
- [Webhooks](#webhooks)
- [API Reference](#api-reference)
- [Sandbox Testing](#sandbox-testing)
- [Going to Production](#going-to-production)
- [Error Handling](#error-handling)
- [FAQ](#faq)

---

## Prerequisites

Before you start, make sure you have:

- **Node.js 18+** (or React Native 0.71+, or a modern browser)
- **npm** (or your package manager of choice)
- **An MTN MoMo developer account** — [create one for free](https://momodeveloper.mtn.com)
- **A Primary Key** from subscribing to a product on the portal (see [Getting your credentials](#getting-your-credentials))

> **Don't have an account yet?** Follow steps 1–3 in [Getting your credentials](#getting-your-credentials) first, then come back here.

---

## Installation

```bash
npm install mtn-momo-kit
```

The SDK only depends on `base-64` (1kB) for cross-platform Base64 encoding. All other APIs used (`fetch`, `crypto`) are native, available in Node.js 18+, React Native 0.71+, and all modern browsers.

---

## Getting your credentials

Before using the SDK, you need to get your API credentials from MTN. Follow these steps:

### 1. Create an account

Go to [momodeveloper.mtn.com](https://momodeveloper.mtn.com) and create a developer account.

### 2. Subscribe to a product

Once logged in, click on **Products** and subscribe to the product you need:

| Product | Use case |
|---|---|
| **Collections** | Receive payments from customers |
| **Disbursements** | Send money to users (refunds, payouts) |
| **Remittances** | Cross-border transfers |

> Each product has its own **Primary Key**. Subscribe to each one you need.

### 3. Get your Primary Key

After subscribing, go to your **Profile** (top-right menu) → scroll down to the bottom of the page. You will see your product keys:

```
Primary Key:    d7de09f262644dfda901161d97d741a6
Secondary Key:  8a3f1b2c3d4e5f6a7b8c9d0e1f2a3b4c
```

| Key | Usage |
|---|---|
| **Primary Key** → `subscriptionKey` | Used in your code |
| **Secondary Key** | Backup for key rotation — same permissions as Primary |

> The Secondary Key exists so you can **rotate** your Primary Key without downtime: switch to Secondary, regenerate Primary, then switch back.

**`subscriptionKey` = Primary Key**

### 4. Create an API User & Key

You have two options:

<details>
<summary><b>Option A — With the SDK (recommended)</b></summary>

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

// Create API User
const apiUser = uuid()
await Momo.createApiUser('YOUR_PRIMARY_KEY', apiUser, 'https://your-site.com/webhook')
console.log('API User:', apiUser)

// Generate API Key
const apiKey = await Momo.generateApiKey('YOUR_PRIMARY_KEY', apiUser)
console.log('API Key:', apiKey)
```

**`apiUser` = the UUID you generated**
**`apiKey` = the key returned by `generateApiKey()`**
</details>

<details>
<summary><b>Option B — Via the Portal</b></summary>

1. Go to **API User** section in the portal
2. Click **Create API User** and generate an API Key
3. Copy both the API User UUID and the API Key
</details>

### 5. You're ready!

You now have all three credentials:

```
subscriptionKey → Primary Key
apiUser         → UUID from step 4
apiKey          → Key from step 4
```

---

## Quick Start

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo({
  subscriptionKey: 'your_primary_key',           // Default key for all products
  // Or per-product keys:
  // collectionSubscriptionKey: '...',
  // disbursementSubscriptionKey: '...',
  // remittanceSubscriptionKey: '...',
  apiUser: 'your_api_user',
  apiKey: 'your_api_key',
  environment: 'sandbox',
})

// Check your balance
const balance = await momo.collections.getBalance()
console.log(`${balance.availableBalance} ${balance.currency}`)
```

---

## Provisioning

Before using the SDK, you need an **API User** and an **API Key**. In the sandbox environment, you can create them directly with the SDK. In production, MTN provides them after KYC.

> ⚠️ **Important**: Each product (Collections, Disbursements, Remittances) has its own **Primary Key**. Subscribe to each product separately on [momodeveloper.mtn.com](https://momodeveloper.mtn.com). A Disbursements Primary Key will **not** work on Collections endpoints (`momo.collections.*`).

### 1. Create an API User

```ts
import { Momo } from 'mtn-momo-kit'

const referenceId = uuid()

await Momo.createApiUser(
  'your_primary_key',
  referenceId,
  'https://your-domain.com/webhook', // Callback URL for notifications
  'sandbox',                          // 'sandbox' | 'production'
)

console.log('API User created:', referenceId)
```

| Parameter | Type | Description |
|---|---|---|
| `subscriptionKey` | `string` | Your product Primary Key |
| `referenceId` | `string` | UUID v4 — becomes your API User ID |
| `callbackHost` | `string` | URL where MTN sends transaction notifications |
| `environment` | `'sandbox' \| 'production'` | Defaults to `'sandbox'` |

### 2. Generate an API Key

```ts
const apiKey = await Momo.generateApiKey(
  'your_primary_key',
  referenceId, // Same UUID used for createApiUser
  'sandbox',
)

console.log('API Key:', apiKey)
// Store this key securely — it won't be shown again
```

### Full provisioning script

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

async function setup() {
  const ref = uuid()

  // Step 1 — Create API User
  await Momo.createApiUser('YOUR_SUBSCRIPTION_KEY', ref, 'https://your-site.com/webhook')
  console.log('API User:', ref)

  // Step 2 — Generate API Key
  const apiKey = await Momo.generateApiKey('YOUR_SUBSCRIPTION_KEY', ref)
  console.log('API Key:', apiKey)

  // Step 3 — Use the SDK
  const momo = new Momo({
    subscriptionKey: 'YOUR_SUBSCRIPTION_KEY',
    apiUser: ref,
    apiKey,
    environment: 'sandbox',
  })

  const balance = await momo.collections.getBalance()
  console.log('Balance:', balance)
}

setup().catch(console.error)
```

> **Note**: In production, MTN provides the API User and API Key directly — skip steps 1 and 2.

---

## Configuration

Create a `.env` file at your project root:

```env
MOMO_SUBSCRIPTION_KEY=your_primary_key
MOMO_API_USER=your_api_user
MOMO_API_KEY=your_api_key
MOMO_ENVIRONMENT=sandbox
MOMO_CALLBACK_HOST=https://your-site.com/webhook
```

### Reading `.env` by platform

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
<summary><b>Vite / Web</b> — Native environment variables</summary>

```env
# .env (must start with VITE_)
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
<summary><b>Next.js</b> — Public environment variables</summary>

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

> **Important**: Never commit your `.env` file. Add it to `.gitignore`.

---

## Usage

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo({
  subscriptionKey: 'your_primary_key',
  apiUser: 'your_api_user',
  apiKey: 'your_api_key',
  environment: 'sandbox', // 'sandbox' | 'production'
})
```

The constructor initializes three modules and supports per-product Primary Keys:

```ts
const momo = new Momo({
  // Single key for all products
  subscriptionKey: 'primary_key_collections',

  // Or specific keys per product:
  collectionSubscriptionKey: 'primary_key_collections',
  disbursementSubscriptionKey: 'primary_key_disbursements',
  remittanceSubscriptionKey: 'primary_key_remittances',

  apiUser: 'your_api_user',
  apiKey: 'your_api_key',
  environment: 'sandbox',
})
```

| Module | Access | Description |
|---|---|---|
| Collections | `momo.collections` | Incoming payments (Request to Pay) |
| Disbursements | `momo.disbursements` | Outgoing payments (Transfer) |
| Remittances | `momo.remittances` | Cross-border transfers |

### Collections

Receive payments from your customers.

```ts
import { v4 as uuid } from 'uuid'

const referenceId = uuid()

// 1. Request a payment
await momo.collections.requestToPay(
  {
    amount: '5000',
    currency: 'EUR',
    externalId: 'invoice-2024-001',
    payer: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
    payerMessage: 'Payment for January 2024 invoice',
    payeeNote: 'Thank you for your payment',
  },
  referenceId,
)

// 2. Check transaction status
const status = await momo.collections.getTransactionStatus(referenceId)
console.log(status.status) // 'SUCCESSFUL' | 'FAILED' | 'PENDING'

// 3. Check balance
const balance = await momo.collections.getBalance()
console.log(`${balance.availableBalance} ${balance.currency}`)

// 4. Check if an account is active
const active = await momo.collections.isAccountHolderActive('MSISDN', '256772123456')
console.log(active.result) // true | false
```

### Disbursements

Send money to your users.

```ts
import { v4 as uuid } from 'uuid'

const referenceId = uuid()

// 1. Make a transfer
await momo.disbursements.transfer(
  {
    amount: '2500',
    currency: 'EUR',
    externalId: 'refund-2024-001',
    payee: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
    payerMessage: 'Refund for order #1234',
    payeeNote: 'Your refund has been processed',
  },
  referenceId,
)

// 2. Check transaction status
const status = await momo.disbursements.getTransactionStatus(referenceId)

// 3. Check balance
const balance = await momo.disbursements.getBalance()

// 4. Validate a recipient account
const active = await momo.disbursements.isAccountHolderActive('MSISDN', '256772123456')
```

### Remittances

International money transfers.

```ts
const referenceId = uuid()

await momo.remittances.transfer(
  {
    amount: '100000',
    currency: 'EUR',
    externalId: 'transfer-2024-001',
    payee: {
      partyIdType: 'MSISDN',
      partyId: '256772123456',
    },
  },
  referenceId,
)

const status = await momo.remittances.getTransactionStatus(referenceId)
const balance = await momo.remittances.getBalance()
```

---

## Webhooks

MTN MoMo sends asynchronous notifications about transaction status changes to your `callbackHost`. Use `Momo.parseWebhookPayload()` to validate and parse incoming requests.

```ts
import { Momo } from 'mtn-momo-kit'

// Example: Express.js webhook endpoint
app.post('/webhook', (req, res) => {
  const payload = Momo.parseWebhookPayload(req.body)

  if (!payload) {
    return res.status(400).send('Invalid payload')
  }

  console.log('Transaction:', payload.referenceId, payload.status)

  switch (payload.status) {
    case 'SUCCESSFUL':
      // Update your database, deliver goods, etc.
      break
    case 'FAILED':
      // Notify the user, retry logic, etc.
      break
    case 'PENDING':
      // Wait for final status
      break
  }

  res.status(200).send('OK')
})
```

### Webhook payload structure

```ts
interface MomoWebhookPayload {
  referenceId: string      // Transaction reference UUID
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING'
  amount?: string
  currency?: string
  financialTransactionId?: string  // MTN transaction ID
  externalId?: string              // Your business ID
  payer?: Party
  reason?: Record<string, unknown>
  payeeNote?: string
  payerMessage?: string
}
```

---

## API Reference

### `Momo` constructor

```ts
constructor(config: MomoConfig)
```

| Property | Type | Default | Description |
|---|---|---|---|
| `subscriptionKey` | `string` | — | Default Primary Key (used for all products if no specific key is set) |
| `collectionSubscriptionKey` | `string` | — | Primary Key for Collections only (overrides `subscriptionKey`) |
| `disbursementSubscriptionKey` | `string` | — | Primary Key for Disbursements only (overrides `subscriptionKey`) |
| `remittanceSubscriptionKey` | `string` | — | Primary Key for Remittances only (overrides `subscriptionKey`) |
| `apiUser` | `string` | — | API user ID (UUID v4) |
| `apiKey` | `string` | — | Generated API key |
| `environment` | `'sandbox' \| 'production'` | `'sandbox'` | Target environment |
| `callbackHost` | `string` | — | Callback URL for notifications (optional) |

### `Momo.createApiUser()`

```ts
static createApiUser(subscriptionKey, referenceId, callbackHost, environment): Promise<void>
```

Creates an API User in the sandbox environment. See [Provisioning](#provisioning).

### `Momo.generateApiKey()`

```ts
static generateApiKey(subscriptionKey, referenceId, environment): Promise<string>
```

Generates an API Key for an existing API User. See [Provisioning](#provisioning).

### `Momo.parseWebhookPayload()`

```ts
static parseWebhookPayload(body: unknown): MomoWebhookPayload | null
```

Validates and parses an incoming MTN webhook payload. Returns `null` for invalid payloads. See [Webhooks](#webhooks).

### `collections.requestToPay(params, referenceId)`

| Parameter | Type | Description |
|---|---|---|
| `params.amount` | `string` | Amount (e.g. `"5000"`) |
| `params.currency` | `string` | Currency (e.g. `"EUR"`, `"XAF"`) |
| `params.externalId` | `string` | Business transaction ID |
| `params.payer.partyIdType` | `'MSISDN' \| 'EMAIL' \| 'PARTY_CODE'` | Payer identifier type |
| `params.payer.partyId` | `string` | Identifier value (phone number, email, etc.) |
| `params.payerMessage` | `string` | Message visible to the payer (optional) |
| `params.payeeNote` | `string` | Internal note for the payee (optional) |
| `params.callbackUrl` | `string` | URL for per-transaction callback (optional, overrides `callbackHost`) |
| `referenceId` | `string` | Unique UUID v4 for this transaction |

**Returns:** `Promise<void>` (status 202 = accepted)

### `transfer(params, referenceId)`

Same parameters as `requestToPay` (except `payer` → `payee`).

---

## Sandbox Testing

### Provision credentials with the SDK

```ts
import { v4 as uuid } from 'uuid'
import { Momo } from 'mtn-momo-kit'

async function sandboxSetup() {
  const ref = uuid()

  // 1. Create API User (this is your apiUser)
  await Momo.createApiUser(
    'YOUR_SUBSCRIPTION_KEY',
    ref,
    'https://your-site.com/webhook',
  )

  // 2. Generate API Key
  const apiKey = await Momo.generateApiKey('YOUR_SUBSCRIPTION_KEY', ref)

  // 3. Initialize the SDK
  const momo = new Momo({
    subscriptionKey: 'YOUR_SUBSCRIPTION_KEY',
    apiUser: ref,
    apiKey,
    environment: 'sandbox',
  })

  // 4. Test
  const balance = await momo.collections.getBalance()
  console.log('Sandbox balance:', balance)
}
```

### Test numbers

| Number | Behavior |
|---|---|
| `256772123456` | Payment accepted |
| `256772654321` | Payment rejected |
| `256772999999` | Transaction pending (timeout) |

---

## Going to Production

### Prerequisites

1. Complete the KYC process with MTN
2. Sign the service agreement
3. Get **production** credentials (API User, API Key) from the portal

### Switch environment

```ts
const momo = new Momo({
  subscriptionKey: 'prod_subscription_key',
  apiUser: 'prod_api_user',
  apiKey: 'prod_api_key',
  environment: 'production',
})
```

### Sandbox vs Production

| Aspect | Sandbox | Production |
|---|---|---|
| URL | `sandbox.momodeveloper.mtn.com` | `momoapi.mtn.com` |
| API User | Self-created via `createApiUser()` | Provided by MTN |
| API Key | Self-generated via `generateApiKey()` | Provided by MTN |
| Transactions | Simulated | Real |
| Callbacks | Simulated webhook | Real webhook |
| Limits | Unlimited | Per contract |

---

## Error Handling

```ts
import { Momo } from 'mtn-momo-kit'

const momo = new Momo(config)

try {
  await momo.collections.requestToPay(params, refId)
} catch (error) {
  if (error instanceof Error) {
    console.error('Code:', error.message.split(':')[0])
    console.error('Detail:', error.message)
  }
}
```

### Common HTTP error codes

| Code | Cause |
|---|---|
| `400` | Invalid request (missing or incorrect parameters) |
| `401` | Authentication failed (invalid or expired token) |
| `403` | Access denied (check your subscription key) |
| `404` | Transaction not found |
| `409` | Conflict (reference ID already used) |
| `429` | Too many requests (rate limit) |
| `500` | MTN internal error |

### Token management

The SDK automatically handles OAuth2 token acquisition and renewal. The token is fetched **lazily** (on the first API call) and cached for subsequent requests. No manual action required.

---

## FAQ

### Does this SDK work with React Native?

Yes. It only uses `fetch` (available since RN 0.71+) and `base-64` (cross-platform Base64). No dependency on Node.js native modules (`fs`, `crypto`, `path`, `stream`).

### Can I use it in a browser?

Yes. The SDK works in all modern browsers that support `fetch`.

### How do I handle callbacks/notifications?

Set `callbackHost` when creating the API User. MTN will call this URL to notify the final transaction status. Use `Momo.parseWebhookPayload()` to validate incoming requests on your webhook endpoint.

### Are sandbox test numbers the same for all countries?

No. Test numbers may vary by country. Check the official MTN documentation for your target country.

### Is the exchange rate included?

No. The SDK processes amounts in the specified currency. Currency conversion is handled by MTN at their current rate.

---

## License

ISC
