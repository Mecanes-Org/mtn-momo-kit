import type { TokenResponse } from './types'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.momodeveloper.mtn.com',
  production: 'https://momoapi.mtn.com',
}

export class HttpClient {
  private baseUrl: string
  private subscriptionKey: string
  private token: string = ''
  private apiUser: string
  private apiKey: string

  constructor(apiUser: string, apiKey: string, subscriptionKey: string, environment: string) {
    this.apiUser = apiUser
    this.apiKey = apiKey
    this.subscriptionKey = subscriptionKey
    this.baseUrl = BASE_URLS[environment]
  }

  private async ensureToken() {
    if (this.token) return
    const credentials = this.base64(`${this.apiUser}:${this.apiKey}`)
    const res = await fetch(`${this.baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    })
    if (!res.ok) throw new Error(`Auth failed: ${res.status} ${res.statusText}`)
    const body: TokenResponse = await res.json()
    this.token = body.access_token
  }

  private base64(str: string): string {
    if (typeof btoa === 'function') return btoa(str)
    return Buffer.from(str, 'utf-8').toString('base64')
  }

  private async headers(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    await this.ensureToken()
    return {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      Authorization: `Bearer ${this.token}`,
      ...extra,
    }
  }

  async post<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const h = await this.headers(extraHeaders)
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`MoMo API error ${res.status}: ${err}`)
    }
    if (res.status === 202) return undefined as T
    return res.json()
  }

  async get<T>(path: string): Promise<T> {
    const h = await this.headers()
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: h,
    })
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText)
      throw new Error(`MoMo API error ${res.status}: ${err}`)
    }
    return res.json()
  }
}
