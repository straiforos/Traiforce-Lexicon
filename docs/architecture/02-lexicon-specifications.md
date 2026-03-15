# 02 – Lexicon Specifications

## Core ATproto Lexicon Records

The Traiforce Protocol defines three primary lexicon records in the `net.traiforce` namespace.

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
    DN["displayName → ATproto PDS\nreadable by all"]
    FP["Full profile JSON\n→ encrypted → IPFS\nvaultCid stored in PDS"]
    GU["gatewayUrl → ATproto PDS\nreadable by all"]

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
    ENC["Content encrypted → IPFS\ncontentCid"]
    BH["blurHash generated → ATproto PDS\npublic preview"]
    FI["contentCid + gatekeeperDid → ATproto PDS\nfeed.item record"]

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
    GV["Gatekeeper reads grant record\n→ verifies signature"]
    AP["Access provisioned\nJWT URL issued"]

    AD --> PUB
    PUB --> GV
    BR --> GV
    GV --> AP
```

---

## Lexicon Relationships

```mermaid
graph TD
    AP["net.traiforce.actor.profile\n──────────────────\ndisplayName\nvaultCid\ngatewayUrl"]
    FI["net.traiforce.feed.item\n──────────────────\ncontentCid\nblurHash\ngatekeeperDid"]
    AG["net.traiforce.actor.grant\n──────────────────\nsubjectDid\nissuerDid\nsignature\nexpiry"]
    IPFS[("IPFS")]
    GK["Gatekeeper\nvalidates + issues JWT"]

    AP -->|"vaultCid"| IPFS
    FI -->|"gatekeeperDid"| GK
    AP -->|"issuerDid"| AG
    FI -->|"governs access to"| AG
    AG --> GK
```
