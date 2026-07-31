# Changelog

## 0.1.2

- Add `.npmignore` to exclude source files and test files from published package
- Clean up orphaned files in `dist/`
- Add npm badges (version, downloads, license) to README
- Expand keywords in package.json
- Rename "SDK" to "Kit" in documentation
- Add complete `.env` variable documentation
- Fix `.env` variable fallback in test scripts
- Add `LICENSE` and `CHANGELOG` files

## 0.1.1

- Add keywords to package.json
- Fix repository URLs

## 0.1.0

- Initial release
- Collections: requestToPay, getTransactionStatus, getBalance, isAccountHolderActive, getBasicUserInfo
- Disbursements: transfer, getTransactionStatus, getBalance, isAccountHolderActive, getBasicUserInfo
- Remittances: transfer, getTransactionStatus, getBalance, getBasicUserInfo
- Static methods: createApiUser, generateApiKey, parseWebhookPayload
- OAuth2 token management
- Webhook payload validation
