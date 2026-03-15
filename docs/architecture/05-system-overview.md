# 05 – System Overview

## High-Level Component Diagram

The following diagram shows all major components of the Traiforce Protocol and their interactions.

```mermaid
graph TB
    PDS["USER PDS\nATproto\n──────────────\nStores:\n• actor.profile\n• feed.item\n• actor.grant"]
    Relay["ATPROTO RELAY\n──────────────\nServes:\n• feed.item records\n• actor.profile\n• actor.grant"]
    Client["CLIENT / APP\n──────────────\n1. Feed discovery\n2. Pre-flight check\n3. Challenge signing\n4. JWT URL fetch"]
    GK["GATEKEEPER\n──────────────\nValidates:\n1. Grant exists\n2. T_timestamp sig\n3. Grant not expired\n4. Issuer signature"]
    Pinata["PINATA GATEWAY\n──────────────\nHosts:\n• Encrypted content\n• Encrypted vault"]

    PDS <-->|"SYNC"| Relay
    Relay -->|"ITEM METADATA"| Client
    PDS -->|"GRANT RECORD"| GK
    Client -->|"ACCESS REQUEST"| GK
    GK -->|"ISSUE JWT"| Client
    Client -->|"FETCH CONTENT"| Pinata
    GK -.->|"Pinata API Key"| Pinata
```

---

## Data Flow Summary

```mermaid
flowchart LR
    PDS["User PDS"]
    Relay["ATproto Relay"]
    GK["Gatekeeper"]
    Client["Client / App"]
    Pinata["Pinata Gateway"]

    PDS -->|"① SYNC\nall lexicon records"| Relay
    Relay -->|"② ITEM METADATA\nfeed.item records"| Client
    PDS -->|"③ GRANT RECORD\nread by Gatekeeper"| GK
    Client -->|"④ ACCESS REQUEST\nDID + signed challenge"| GK
    GK -->|"⑤ ISSUE JWT\nSubmarined JWT URL"| Client
    Client -->|"⑥ FETCH CONTENT\nJWT URL request"| Pinata
    Pinata -->|"⑦ ENCRYPTED BLOB\ndecrypted client-side"| Client
```

---

## Component Responsibilities

| Component | Protocol Role |
|---|---|
| **User PDS** (ATproto) | Source of truth for all lexicon records; controls grant issuance and revocation |
| **ATproto Relay** | Aggregates and indexes PDS records; enables content discovery across network |
| **Client / App** | User interface; orchestrates the full access workflow on behalf of subscriber |
| **Gatekeeper** | Decentralized auth sidecar; validates grants + identity; issues JWT URLs |
| **Pinata Gateway** | IPFS content delivery; enforces JWT-based access control on encrypted blobs |

---

## Deployment Topology

```mermaid
graph TB
    subgraph Alice["Alice's Infrastructure"]
        APDS["Alice's PDS\nATproto"]
        AGK["Gatekeeper\nsidecar"]
        APinata["Pinata Gateway\nIPFS host"]
        APDS --> APinata
        AGK --> APinata
    end

    subgraph ATProto["Shared ATproto Network"]
        R1["ATproto Relay"]
        R2["ATproto Relay"]
    end

    subgraph Bob["Bob's Infrastructure"]
        BPDS["Bob's PDS\nATproto"]
        BClient["Bob's Client App"]
    end

    APDS <-->|"SYNC"| R1
    BPDS <-->|"SYNC"| R1
    BClient <-->|"Discovery"| R1
    BClient <-->|"Auth / Access"| AGK
    BClient <-->|"Content fetch"| APinata
```
