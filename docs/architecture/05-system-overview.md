# 05 – System Overview

## High-Level Component Diagram

The following diagram shows all major components of the Traiforce Protocol and their interactions.

```mermaid
graph TB
    PDS["USER PDS<br/>ATproto<br/>---<br/>Stores:<br/>• actor.profile<br/>• feed.item<br/>• actor.grant"]
    Relay["ATPROTO RELAY<br/>---<br/>Serves:<br/>• feed.item records<br/>• actor.profile<br/>• actor.grant"]
    Client["CLIENT / APP<br/>---<br/>1. Feed discovery<br/>2. Pre-flight check<br/>3. Challenge signing<br/>4. JWT URL fetch"]
    GK["GATEKEEPER<br/>---<br/>Validates:<br/>1. Grant exists<br/>2. T_timestamp sig<br/>3. Grant not expired<br/>4. Issuer signature"]
    Pinata["PINATA GATEWAY<br/>---<br/>Hosts:<br/>• Encrypted content<br/>• Encrypted vault"]

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

    PDS -->|"① SYNC<br/>all lexicon records"| Relay
    Relay -->|"② ITEM METADATA<br/>feed.item records"| Client
    PDS -->|"③ GRANT RECORD<br/>read by Gatekeeper"| GK
    Client -->|"④ ACCESS REQUEST<br/>DID + signed challenge"| GK
    GK -->|"⑤ ISSUE JWT<br/>Submarined JWT URL"| Client
    Client -->|"⑥ FETCH CONTENT<br/>JWT URL request"| Pinata
    Pinata -->|"⑦ ENCRYPTED BLOB<br/>decrypted client-side"| Client
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
        APDS["Alice's PDS<br/>ATproto"]
        AGK["Gatekeeper<br/>sidecar"]
        APinata["Pinata Gateway<br/>IPFS host"]
        APDS --> APinata
        AGK --> APinata
    end

    subgraph ATProto["Shared ATproto Network"]
        R1["ATproto Relay"]
        R2["ATproto Relay"]
    end

    subgraph Bob["Bob's Infrastructure"]
        BPDS["Bob's PDS<br/>ATproto"]
        BClient["Bob's Client App"]
    end

    APDS <-->|"SYNC"| R1
    BPDS <-->|"SYNC"| R1
    BClient <-->|"Discovery"| R1
    BClient <-->|"Auth / Access"| AGK
    BClient <-->|"Content fetch"| APinata
```
