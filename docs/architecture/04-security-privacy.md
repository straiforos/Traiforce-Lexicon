# 04 – Security & Privacy

## Overview

The Traiforce Protocol incorporates security and privacy mechanisms to protect user interactions, enable content revocation, and enforce age gating.

---

## 1. Blinded Interactions

### Problem

In a public social graph, "Like" events can reveal which users have access to which private content. An observer could infer subscription relationships by monitoring engagement signals, even without accessing the content itself.

### Solution: Salted Hash Obfuscation

Traiforce obfuscates engagement metadata by storing a salted hash of the interaction rather than a plaintext reference.

```mermaid
flowchart LR
    Like["Like(Alice, ContentURI)"]
    Hash["H( salt || ContentURI )<br/>stored on-chain"]
    Like -->|"salted hash"| Hash
```

> **Stored as** `H( salt || ContentURI )` where `H` is a cryptographic hash function and `salt` is a secret known only to parties with content access. Observers see an opaque hash and cannot determine which content was liked without already knowing the `ContentURI`.

### Verification Flow

```mermaid
flowchart LR
    Store[("Stored:<br/>H(salt || ContentURI)")]

    subgraph Known["Party with access (knows ContentURI)"]
        K1["Compute H(salt || ContentURI)"]
        K2["Compare to stored hash"]
        K3["✓ Verify engagement status"]
        K1 --> K2 --> K3
    end

    subgraph Unknown["Observer (no ContentURI)"]
        U1["Sees: H(salt || ???)"]
        U2["✗ Cannot reverse hash<br/>without ContentURI"]
        U1 --> U2
    end

    Store --> K1
    Store --> U1
```

**Security Property**: Only parties who already have access to the `ContentURI` can verify a specific engagement record. This prevents social graph scraping by third parties.

---

## 2. Content Revocation

Traiforce supports two revocation modes: **immediate** and **scheduled**.

### Immediate Revocation

```mermaid
flowchart TD
    A["Alice deletes actor.grant record from PDS"]
    B["ATproto Relay reflects the deletion"]
    C["Bob requests content — next session"]
    D["Gatekeeper reads PDS<br/>grant record NOT FOUND"]
    E["Gatekeeper returns 403 Forbidden"]
    F["Bob's client displays 'access revoked'"]

    A --> B --> C --> D --> E --> F
```

**Behavior**: Access is denied on the **next token request**. Any previously issued JWT URLs remain valid until they expire naturally (short TTL recommended).

### Scheduled Revocation

```mermaid
flowchart TD
    G["Grant record<br/>subjectDid: did:plc:bob<br/>issuerDid: did:plc:alice<br/>expiry: 2024-12-31T23:59:59Z"]
    R["Bob requests content after expiry date"]
    CH{"now > expiry?"}
    Y["403 Forbidden<br/>grant expired"]
    N["Proceed with JWT issuance"]

    G --> R --> CH
    CH -->|"YES"| Y
    CH -->|"NO"| N
```

**Behavior**: The `expiry` field is checked by the Gatekeeper during **every session handshake**, ensuring time-limited subscriptions are automatically enforced without requiring Alice to manually delete grants.

---

## 3. Key Threat Model

| Threat | Mitigation |
|---|---|
| Social graph scraping | Blinded interactions via salted hash obfuscation |
| Unauthorized content access | Grant verification on every token request; Gatekeeper enforces ACL |
| Identity spoofing | T_timestamp challenge + PDS key signature proves DID ownership |
| Stale access after revocation | Immediate: delete grant record; JWT TTL limits blast radius |
| Subscription over-run | `expiry` field enforced by Gatekeeper on every handshake |
| Pinata API key exposure | Key stays on Gatekeeper; clients only receive short-lived JWT URLs |

---

## 4. Cryptographic Signature Verification

The `net.traiforce.actor.grant` record includes an `issuerDid` and a `signature` field. This allows the Gatekeeper to verify that the grant was created by the legitimate content owner and has not been tampered with.

```mermaid
flowchart TD
    GC["Grant creation by Alice<br/>payload = subjectDid + issuerDid + expiry<br/>signature = sign(payload, alice_private_key)"]
    GV["Grant verification by Gatekeeper<br/>alice_public_key = resolve(issuerDid)<br/>valid = verify(payload, signature, alice_public_key)"]
    RES{"valid?"}
    OK["Proceed with expiry check<br/>and JWT issuance"]
    FAIL["Reject: 403 Forbidden<br/>tampered grant"]

    GC --> GV --> RES
    RES -->|"true"| OK
    RES -->|"false"| FAIL
```

---

## 5. Minor Protection & Age Verification

### Overview

The `net.traiforce.verify.*` lexicons enable age gating without storing any PII on the ATproto PDS.

### Credential Hash Generation

The `credentialHash` field in `net.traiforce.verify.age` is computed by the Hono Gatekeeper during the OIDC callback:

```
credentialHash = SHA-256( HMAC-SHA256(key = TRAIFORCE_SALT, data = provider_sub) )
```

- **`provider_sub`** – the opaque subject identifier from the IAL2 provider's ID token (`sub` claim).
- **`TRAIFORCE_SALT`** – a secret environment variable on the Gatekeeper; never stored in the PDS or client.

```mermaid
flowchart TD
    OC["OIDC callback<br/>code → token exchange"]
    ST["Extract sub from ID token"]
    HM["HMAC-SHA256(key=TRAIFORCE_SALT, data=sub)"]
    SH["SHA-256( HMAC output )"]
    REC["Store credentialHash in<br/>net.traiforce.verify.age record"]

    OC --> ST --> HM --> SH --> REC
```

### Anti-Sybil Property

Because the same `sub` value combined with the same salt always produces the same hash, the Gatekeeper or AppView can detect when a single real-world identity attempts to verify multiple accounts:

```mermaid
flowchart LR
    ID["Real-world identity<br/>(same sub)"]
    A1["Account A<br/>credentialHash = H(salt,sub)"]
    A2["Account B<br/>credentialHash = H(salt,sub)"]
    DUP["Duplicate detected → reject"]

    ID --> A1
    ID --> A2
    A1 -->|"hash collision"| DUP
    A2 -->|"hash collision"| DUP
```

### Blind Verification

The raw `sub` claim is never written to the ATproto PDS. Observers see only an opaque SHA-256 hex string and cannot reverse it to the original identity without knowledge of both the `sub` value and the `TRAIFORCE_SALT`.

| Threat | Mitigation |
|---|---|
| PII exposure on PDS | `credentialHash` stores only a keyed hash; raw `sub` is discarded |
| Multiple accounts per identity | Same `sub` → same hash; duplicates rejected by Gatekeeper |
| Forged attestations | Record is signed by the Gatekeeper's ATproto key; verifiable via `provider`'s public keys |
| Stale verifications | `expiresAt` field enforced on every read; re-verification required periodically |
