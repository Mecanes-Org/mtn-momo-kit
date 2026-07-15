import { encode } from 'base-64'
import type { TokenResponse } from './types'

const BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.momodeveloper.mtn.com',
  production: 'https://momoapi.mtn.com',
}

/**
 * Low-level HTTP client that handles authentication and API calls to MTN MoMo.
 * Manages OAuth2 token acquisition, caching, expiry, and auto-refresh on 401.
 */
export class HttpClient {
  private baseUrl: string
  private subscriptionKey: string
  private token: string = ''
  private tokenExpiry: number = 0
  private apiUser: string
  private apiKey: string
  private environment: string

  private tokenPath: string

  /**
   * @param apiUser - API User UUID (v4)
   * @param apiKey - API Key generated via generateApiKey()
   * @param subscriptionKey - Product Primary Key
   * @param environment - Target environment (sandbox | production)
   * @param tokenPath - OAuth2 token endpoint path (e.g. /collection/token/)
   */
  constructor(apiUser: string, apiKey: string, subscriptionKey: string, environment: string, tokenPath: string) {
    this.apiUser = apiUser
    this.apiKey = apiKey
    this.subscriptionKey = subscriptionKey
    this.environment = environment
    this.baseUrl = BASE_URLS[environment]
    this.tokenPath = tokenPath
  }

  private async ensureToken() {
    if (this.token && Date.now() < this.tokenExpiry) return
    const credentials = this.base64(`${this.apiUser}:${this.apiKey}`)
    const res = await fetch(`${this.baseUrl}${this.tokenPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    })
    if (!res.ok) throw new Error(`Auth failed: ${res.status} ${res.statusText}`)
    const body: TokenResponse = await res.json()
    this.token = body.access_token
    this.tokenExpiry = Date.now() + body.expires_in * 1000
  }

  private base64(str: string): string {
    return encode(str)
  }

  private async headers(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    await this.ensureToken()
    return {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      'X-Target-Environment': this.environment,
      Authorization: `Bearer ${this.token}`,
      ...extra,
    }
  }

  private async fetchWithRetry<T>(path: string, options: RequestInit): Promise<Response> {
    const res = await fetch(`${this.baseUrl}${path}`, options)
    if (res.status === 401) {
      this.token = ''
      this.tokenExpiry = 0
      const h = await this.headers()
      const retryRes = await fetch(`${this.baseUrl}${path}`, { ...options, headers: h })
      if (!retryRes.ok) {
        const err = await retryRes.text().catch(() => retryRes.statusText)
        throw new Error(`MoMo API error ${retryRes.status}: ${err}`)
      }
      return retryRes
    }
    return res
  }

  /**
   * Sends a POST request to the MTN MoMo API.
   * Automatically handles authentication and 401 retry.
   *
   * @param path - API endpoint path (relative to base URL)
   * @param body - Request body (will be JSON-stringified)
   * @param extraHeaders - Additional headers to include
   * @returns Parsed JSON response, or void for 202 (accepted)
   */
  async post<T>(path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const h = await this.headers(extraHeaders)
    const res = await this.fetchWithRetry(path, {
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

  /**
   * Sends a GET request to the MTN MoMo API.
   * Automatically handles authentication and 401 retry.
   *
   * @param path - API endpoint path (relative to base URL)
   * @returns Parsed JSON response
   */
  async get<T>(path: string): Promise<T> {
    const h = await this.headers()
    const res = await this.fetchWithRetry(path, {
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
