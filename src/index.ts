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

// Re-export schema utilities
export { schemas } from './types/lexicons'

// ────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ────────────────────────────────────────────────────────────────────────────

import { createHmac } from 'crypto'

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
