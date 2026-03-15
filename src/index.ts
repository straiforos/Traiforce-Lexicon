/**
 * @straiforos/traiforce-sdk
 *
 * TypeScript SDK for the Traiforce Protocol ATproto lexicons.
 *
 * Lexicon types are generated via `npm run gen` from the definitions in the
 * `lexicons/` directory and then re-exported from this entry point.
 */

// Re-export all generated lexicon type namespaces
export * as NetTraiforceActorGrant from './types/types/net/traiforce/actor/grant'
export * as NetTraiforceActorProfile from './types/types/net/traiforce/actor/profile'
export * as NetTraiforceFeedItem from './types/types/net/traiforce/feed/item'
export * as NetTraiforceVerifyAge from './types/types/net/traiforce/verify/age'
export * as NetTraiforceVerifyStatus from './types/types/net/traiforce/verify/status'

// Re-export schema utilities
export { schemas } from './types/lexicons'

// ────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ────────────────────────────────────────────────────────────────────────────

import { createHmac, createHash } from 'crypto'

/**
 * Computes a blinded (obfuscated) hash of a private-like interaction using
 * HMAC-SHA-256.
 *
 * The Traiforce Protocol stores engagement metadata as an opaque hash rather
 * than a plaintext content reference so that observers cannot infer
 * subscription relationships from the public social graph.
 *
 * ```
 * blindedHash = HMAC-SHA256(key = creatorDid, data = contentUri)
 * ```
 *
 * Only parties who already know both the `creatorDid` and the `contentUri`
 * can reproduce and verify the hash.
 *
 * @param creatorDid - DID of the content creator (used as the HMAC key).
 * @param contentUri - AT-URI or IPFS CID of the gated content (used as the HMAC data).
 * @returns A lowercase hex-encoded HMAC-SHA-256 digest.
 *
 * @example
 * ```ts
 * import { getBlindedHash } from '@straiforos/traiforce-sdk'
 *
 * const hash = getBlindedHash('did:plc:alice', 'ipfs://bafybeiabc123')
 * // store `hash` on the ATproto PDS instead of the raw contentUri
 * ```
 */
export function getBlindedHash(creatorDid: string, contentUri: string): string {
  return createHmac('sha256', creatorDid).update(contentUri).digest('hex')
}

/**
 * Generates the `credentialHash` field for a `net.traiforce.verify.age` record.
 *
 * The hash is derived from the identity provider's opaque subject identifier
 * (the `sub` claim returned in the OIDC token) combined with a platform-level
 * salt.  This design provides two properties:
 *
 * 1. **Blind verification** – the raw `sub` value (and therefore the user's
 *    real-world identity) is never stored on the ATproto PDS.
 * 2. **Anti-sybil** – because the same `sub` always produces the same hash,
 *    a single real-world identity cannot successfully verify more than one
 *    account (duplicate `credentialHash` values can be detected by the
 *    Gatekeeper or AppView).
 *
 * ## Hono Gatekeeper – OIDC callback flow
 *
 * ```
 * POST /callback?code=<auth_code>
 *   1. Exchange `code` for tokens at the provider's token endpoint.
 *   2. Decode the ID token and extract the `sub` claim.
 *   3. credentialHash = SHA-256( HMAC-SHA256(key = TRAIFORCE_SALT, data = sub) )
 *      – implemented as getCredentialHash(sub, TRAIFORCE_SALT)
 *   4. Build and sign the net.traiforce.verify.age record using the user's
 *      ATproto session.
 *   5. Write the record to the user's PDS via com.atproto.repo.putRecord.
 *   6. Write/update the net.traiforce.verify.status record to isVerified=true.
 * ```
 *
 * The `TRAIFORCE_SALT` is a secret known only to the Gatekeeper.  It must be
 * stored in an environment variable and must never be committed to source
 * control.
 *
 * ```
 * credentialHash = SHA-256( HMAC-SHA256(key = salt, data = providerSubjectId) )
 * ```
 *
 * @param providerSubjectId - The `sub` claim from the OIDC ID token issued by
 *   the IAL2 verification provider (e.g. ID.me).
 * @param salt - A secret server-side salt known only to the Traiforce
 *   Gatekeeper service (stored in an environment variable, never in source).
 * @returns A lowercase hex-encoded SHA-256 digest suitable for use as the
 *   `credentialHash` field in a `net.traiforce.verify.age` record.
 *
 * @example
 * ```ts
 * import { getCredentialHash } from '@straiforos/traiforce-sdk'
 *
 * // Inside the Hono OIDC callback handler:
 * const sub = idToken.sub           // e.g. "idme|abc123…"
 * const salt = process.env.TRAIFORCE_SALT!
 * const credentialHash = getCredentialHash(sub, salt)
 * // Write credentialHash to the net.traiforce.verify.age record on the PDS.
 * ```
 */
export function getCredentialHash(providerSubjectId: string, salt: string): string {
  const inner = createHmac('sha256', salt).update(providerSubjectId).digest()
  return createHash('sha256').update(inner).digest('hex')
}
