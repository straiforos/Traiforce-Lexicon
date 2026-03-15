# 04 – Security & Privacy

## Overview

The Traiforce Protocol incorporates two key security and privacy mechanisms to protect user interactions and enable content revocation.

---

## 1. Blinded Interactions

### Problem

In a public social graph, "Like" events can reveal which users have access to which private content. An observer could infer subscription relationships by monitoring engagement signals, even without accessing the content itself.

### Solution: Salted Hash Obfuscation

Traiforce obfuscates engagement metadata by storing a salted hash of the interaction rather than a plaintext reference.

```mermaid
flowchart LR
    Like["Like(Alice, ContentURI)"]
    Hash["H( salt || ContentURI )\nstored on-chain"]
    Like -->|"salted hash"| Hash
```

> **Stored as** `H( salt || ContentURI )` where `H` is a cryptographic hash function and `salt` is a secret known only to parties with content access. Observers see an opaque hash and cannot determine which content was liked without already knowing the `ContentURI`.

### Verification Flow

```mermaid
flowchart LR
    Store[("Stored:\nH(salt || ContentURI)")]

    subgraph Known["Party with access (knows ContentURI)"]
        K1["Compute H(salt || ContentURI)"]
        K2["Compare to stored hash"]
        K3["✓ Verify engagement status"]
        K1 --> K2 --> K3
    end

    subgraph Unknown["Observer (no ContentURI)"]
        U1["Sees: H(salt || ???)"]
        U2["✗ Cannot reverse hash\nwithout ContentURI"]
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
    D["Gatekeeper reads PDS\ngrant record NOT FOUND"]
    E["Gatekeeper returns 403 Forbidden"]
    F["Bob's client displays 'access revoked'"]

    A --> B --> C --> D --> E --> F
```

**Behavior**: Access is denied on the **next token request**. Any previously issued JWT URLs remain valid until they expire naturally (short TTL recommended).

### Scheduled Revocation

```mermaid
flowchart TD
    G["Grant record\nsubjectDid: did:plc:bob\nissuerDid: did:plc:alice\nexpiry: 2024-12-31T23:59:59Z"]
    R["Bob requests content after expiry date"]
    CH{"now > expiry?"}
    Y["403 Forbidden\ngrant expired"]
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
    GC["Grant creation by Alice\npayload = subjectDid + issuerDid + expiry\nsignature = sign(payload, alice_private_key)"]
    GV["Grant verification by Gatekeeper\nalice_public_key = resolve(issuerDid)\nvalid = verify(payload, signature, alice_public_key)"]
    RES{"valid?"}
    OK["Proceed with expiry check\nand JWT issuance"]
    FAIL["Reject: 403 Forbidden\ntampered grant"]

    GC --> GV --> RES
    RES -->|"true"| OK
    RES -->|"false"| FAIL
```
