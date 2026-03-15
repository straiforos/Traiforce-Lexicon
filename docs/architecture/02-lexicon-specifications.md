# 02 – Lexicon Specifications

## Core ATproto Lexicon Records

The Traiforce Protocol defines five primary lexicon records in the `net.traiforce` namespace.

---

## A. `net.traiforce.actor.profile`

Defines the user's presence on the Traiforce network.

```mermaid
classDiagram
    class `net.traiforce.actor.profile` {
        +string displayName
        +string vaultCid
        +string gatewayUrl
    }
```

| Field | Type | Description |
|---|---|---|
| `displayName` | string | Public-facing teaser name visible to all ATproto users |
| `vaultCid` | string | IPFS CID pointing to an encrypted JSON blob of the full profile |
| `gatewayUrl` | string | Address of the user's dedicated Pinata Gateway (e.g., `alice.mypinata.cloud`) |

**Data Flow:**

```mermaid
flowchart TD
    UC["User creates profile"]
    DN["displayName → ATproto PDS<br/>readable by all"]
    FP["Full profile JSON<br/>→ encrypted → IPFS<br/>vaultCid stored in PDS"]
    GU["gatewayUrl → ATproto PDS<br/>readable by all"]

    UC --> DN
    UC --> FP
    UC --> GU
```

---

## B. `net.traiforce.feed.item`

The gated content pointer. References an encrypted piece of content on IPFS with a safe preview.

```mermaid
classDiagram
    class `net.traiforce.feed.item` {
        +string contentCid
        +string blurHash
        +string gatekeeperDid
    }
```

| Field | Type | Description |
|---|---|---|
| `contentCid` | string | IPFS hash of the actual content (encrypted, requires authorization) |
| `blurHash` | string | L×W representation of the image for safe public previews |
| `gatekeeperDid` | string | DID of the Gatekeeper service the client must contact for access |

**Data Flow:**

```mermaid
flowchart TD
    CU["Creator uploads content"]
    ENC["Content encrypted → IPFS<br/>contentCid"]
    BH["blurHash generated → ATproto PDS<br/>public preview"]
    FI["contentCid + gatekeeperDid → ATproto PDS<br/>feed.item record"]

    CU --> ENC
    CU --> BH
    CU --> FI
```

---

## C. `net.traiforce.actor.grant`

The Access Control List (ACL) entry. Authorizes a specific user to access gated content.

```mermaid
classDiagram
    class `net.traiforce.actor.grant` {
        +string subjectDid
        +string issuerDid
        +string signature
        +datetime expiry
    }
```

| Field | Type | Description |
|---|---|---|
| `subjectDid` | string | DID of the user being granted access |
| `issuerDid` | string | DID of the content creator issuing the grant |
| `signature` | string | Cryptographic signature from `issuerDid` verifying the grant |
| `expiry` | datetime? | Optional expiration timestamp; checked by Gatekeeper on every session handshake |

**Data Flow:**

```mermaid
flowchart TD
    AD["Alice signs grant record with PDS key"]
    PUB["Grant record published to ATproto PDS"]
    BR["Bob requests access"]
    GV["Gatekeeper reads grant record<br/>→ verifies signature"]
    AP["Access provisioned<br/>JWT URL issued"]

    AD --> PUB
    PUB --> GV
    BR --> GV
    GV --> AP
```

---

## Lexicon Relationships

```mermaid
graph TD
    AP["net.traiforce.actor.profile<br/>---<br/>displayName<br/>vaultCid<br/>gatewayUrl"]
    FI["net.traiforce.feed.item<br/>---<br/>contentCid<br/>blurHash<br/>gatekeeperDid"]
    AG["net.traiforce.actor.grant<br/>---<br/>subjectDid<br/>issuerDid<br/>signature<br/>expiry"]
    VA["net.traiforce.verify.age<br/>---<br/>assertion<br/>provider<br/>credentialHash<br/>expiresAt"]
    VS["net.traiforce.verify.status<br/>---<br/>isVerified<br/>verifiedTier"]
    IPFS[("IPFS")]
    GK["Gatekeeper<br/>validates + issues JWT"]
    AV["AppView (Keyhole.xxx)<br/>blurs / unblurs content"]

    AP -->|"vaultCid"| IPFS
    FI -->|"gatekeeperDid"| GK
    AP -->|"issuerDid"| AG
    FI -->|"governs access to"| AG
    AG --> GK
    VA -->|"drives"| VS
    VS -->|"isVerified"| AV
```

---

## D. `net.traiforce.verify.age`

A cryptographically signed attestation that the account holder has passed IAL2 age verification.
No PII is stored; only opaque hashes and provider metadata are recorded.

```mermaid
classDiagram
    class `net.traiforce.verify.age` {
        +string assertion
        +string provider
        +string credentialHash
        +datetime expiresAt
    }
```

| Field | Type | Description |
|---|---|---|
| `assertion` | token | Age tier: `net.traiforce.verify.age#adult18` or `net.traiforce.verify.age#adult21` |
| `provider` | string | URL or DID of the IAL2 verification provider (e.g. `https://id.me`, `did:web:clear.com`) |
| `credentialHash` | string | Hex SHA-256 of HMAC-SHA256(key=salt, data=provider `sub`). Anti-sybil: one real-world identity → one hash |
| `expiresAt` | datetime | UTC expiry; after this timestamp re-verification is required |

**Data Flow:**

```mermaid
flowchart TD
    OC["User completes OIDC flow<br/>with IAL2 provider"]
    GK["Gatekeeper receives callback<br/>extracts sub claim from ID token"]
    CH["credentialHash = SHA-256( HMAC-SHA256(salt, sub) )<br/>PII never stored"]
    REC["net.traiforce.verify.age record<br/>written to user's PDS"]
    ST["net.traiforce.verify.status record<br/>updated: isVerified=true"]

    OC --> GK --> CH --> REC --> ST
```

---

## E. `net.traiforce.verify.status`

Public-facing age-verification status record.
The Keyhole.xxx AppView reads this record to decide whether to blur or display age-restricted content.

```mermaid
classDiagram
    class `net.traiforce.verify.status` {
        +boolean isVerified
        +string verifiedTier
    }
```

| Field | Type | Description |
|---|---|---|
| `isVerified` | boolean | `true` when a valid, non-expired `net.traiforce.verify.age` record exists |
| `verifiedTier` | token? | Highest confirmed age tier; omitted when `isVerified` is `false` |

**Data Flow:**

```mermaid
flowchart TD
    VA["net.traiforce.verify.age<br/>(Gatekeeper writes after OIDC callback)"]
    VS["net.traiforce.verify.status<br/>isVerified=true<br/>verifiedTier=adult18"]
    AV["AppView (Keyhole.xxx)<br/>reads isVerified"]
    BC["Blur content for<br/>unverified viewers"]
    UC["Show content to<br/>verified viewers"]

    VA -->|"drives"| VS
    VS -->|"isVerified=false"| BC
    VS -->|"isVerified=true"| UC
    AV --> BC
    AV --> UC
```


