# 04 – Security & Privacy

## Overview

The Traiforce Protocol incorporates two key security and privacy mechanisms to protect user interactions and enable content revocation.

---

## 1. Blinded Interactions

### Problem

In a public social graph, "Like" events can reveal which users have access to which private content. An observer could infer subscription relationships by monitoring engagement signals, even without accessing the content itself.

### Solution: Salted Hash Obfuscation

Traiforce obfuscates engagement metadata by storing a salted hash of the interaction rather than a plaintext reference.

```
  ┌──────────────────────────────────────────────────────────────┐
  │                  BLINDED INTERACTION MODEL                   │
  │                                                              │
  │  Plaintext:  Like(Alice, ContentURI)                         │
  │                                                              │
  │  Stored as:  H( salt || ContentURI )                         │
  │              where H is a cryptographic hash function        │
  │              and salt is a secret known only to parties      │
  │              with content access                             │
  │                                                              │
  │  Result:     Observers see an opaque hash — they cannot      │
  │              determine which content was liked without        │
  │              already knowing the ContentURI                  │
  └──────────────────────────────────────────────────────────────┘
```

### Verification Flow

```
  Party with access               Observer (no access)
         │                               │
         │  Know ContentURI              │  See only:
         │                               │  H(salt || ???)
         ▼                               │
  Compute H(salt || ContentURI)          │
         │                               │
         ▼                               │
  Compare to stored hash                 │  Cannot reverse hash
         │                               │  without ContentURI
         ▼                               │
  ✓ Verify engagement status             │  ✗ Cannot determine
                                         │    who liked what
```

**Security Property**: Only parties who already have access to the `ContentURI` can verify a specific engagement record. This prevents social graph scraping by third parties.

---

## 2. Content Revocation

Traiforce supports two revocation modes: **immediate** and **scheduled**.

### Immediate Revocation

```
  Alice decides to revoke Bob's access
         │
         ▼
  Alice deletes net.traiforce.actor.grant record from PDS
         │
         ▼
  ATproto Relay reflects the deletion
         │
         │       Bob requests content (next session)
         │                │
         ▼                ▼
  Gatekeeper reads PDS ──► grant record NOT FOUND
         │
         ▼
  Gatekeeper returns 403 Forbidden
         │
         ▼
  Bob's client displays "access revoked" or subscribe prompt
```

**Behavior**: Access is denied on the **next token request**. Any previously issued JWT URLs remain valid until they expire naturally (short TTL recommended).

### Scheduled Revocation

```
  Alice creates a grant with an expiry timestamp
  ┌────────────────────────────────────────┐
  │  net.traiforce.actor.grant             │
  │  ─────────────────────────────────     │
  │  subjectDid: did:plc:bob               │
  │  issuerDid:  did:plc:alice             │
  │  signature:  <sig>                     │
  │  expiry:     2024-12-31T23:59:59Z  ◄── │
  └────────────────────────────────────────┘
         │
         │       Bob requests content after expiry date
         │                │
         ▼                ▼
  Gatekeeper reads grant record ──► checks expiry field
         │
         │  now > expiry ?
         │
         ├── YES ──► 403 Forbidden ("grant expired")
         │
         └── NO  ──► proceed with JWT issuance
```

**Behavior**: The `expiry` field is checked by the Gatekeeper during **every session handshake**, ensuring time-limited subscriptions are automatically enforced without requiring Alice to manually delete grants.

---

## 3. Key Threat Model

```
  ┌────────────────────────────────────────────────────────────────┐
  │                        THREAT MODEL                           │
  ├────────────────────────┬───────────────────────────────────────┤
  │  Threat                │  Mitigation                          │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Social graph          │  Blinded interactions via salted      │
  │  scraping              │  hash obfuscation                    │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Unauthorized content  │  Grant verification on every token   │
  │  access                │  request; Gatekeeper enforces ACL    │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Identity spoofing     │  T_timestamp challenge + PDS key     │
  │                        │  signature proves DID ownership      │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Stale access after    │  Immediate: delete grant record;     │
  │  revocation            │  JWT TTL limits blast radius         │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Subscription          │  expiry field enforced by            │
  │  over-run              │  Gatekeeper on every handshake       │
  ├────────────────────────┼───────────────────────────────────────┤
  │  Pinata API key        │  Key stays on Gatekeeper; clients    │
  │  exposure              │  only receive short-lived JWT URLs   │
  └────────────────────────┴───────────────────────────────────────┘
```

---

## 4. Cryptographic Signature Verification

The `net.traiforce.actor.grant` record includes an `issuerDid` and a `signature` field. This allows the Gatekeeper to verify that the grant was created by the legitimate content owner and has not been tampered with.

```
  Grant creation (by Alice):
  ─────────────────────────
  payload = { subjectDid, issuerDid, expiry, ... }
  signature = sign(payload, alice_private_key)

  Grant verification (by Gatekeeper):
  ────────────────────────────────────
  alice_public_key = resolve(issuerDid)  // via ATproto DID resolution
  valid = verify(payload, signature, alice_public_key)

  If valid == false  ──► reject with 403 (tampered grant)
  If valid == true   ──► proceed with expiry check and JWT issuance
```
