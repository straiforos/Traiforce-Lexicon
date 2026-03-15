# 05 – System Overview

## High-Level Component Diagram

The following diagram shows all major components of the Traiforce Protocol and their interactions.

```mermaid
graph TB
    PDS["USER PDS<br/>ATproto<br/>---<br/>Stores:<br/>• actor.profile<br/>• feed.item<br/>• actor.grant<br/>• verify.age<br/>• verify.status"]
    Relay["ATPROTO RELAY<br/>---<br/>Serves:<br/>• feed.item records<br/>• actor.profile<br/>• actor.grant<br/>• verify.status"]
    Client["CLIENT / APP<br/>---<br/>1. Feed discovery<br/>2. Age-verification check<br/>3. Pre-flight check<br/>4. Challenge signing<br/>5. JWT URL fetch"]
    AV["APPVIEW (Keyhole.xxx)<br/>---<br/>Reads:<br/>• verify.status<br/>Enforces:<br/>• Blur / unblur age-restricted content"]
    GK["GATEKEEPER<br/>---<br/>Validates:<br/>1. Grant exists<br/>2. T_timestamp sig<br/>3. Grant not expired<br/>4. Issuer signature<br/>5. verify.status (age-gated content)"]
    Pinata["PINATA GATEWAY<br/>---<br/>Hosts:<br/>• Encrypted content<br/>• Encrypted vault"]

    PDS <-->|"SYNC"| Relay
    Relay -->|"ITEM METADATA"| Client
    Relay -->|"VERIFY STATUS"| AV
    PDS -->|"GRANT RECORD"| GK
    Client -->|"ACCESS REQUEST"| GK
    GK -->|"ISSUE JWT"| Client
    Client -->|"FETCH CONTENT"| Pinata
    GK -.->|"Pinata API Key"| Pinata
    AV -->|"BLUR / UNBLUR"| Client
```

---

## Data Flow Summary

```mermaid
flowchart LR
    PDS["User PDS"]
    Relay["ATproto Relay"]
    AV["AppView (Keyhole.xxx)"]
    GK["Gatekeeper"]
    Client["Client / App"]
    Pinata["Pinata Gateway"]

    PDS -->|"① SYNC<br/>all lexicon records"| Relay
    Relay -->|"② ITEM METADATA<br/>feed.item records"| Client
    Relay -->|"③ VERIFY STATUS<br/>verify.status records"| AV
    AV -->|"④ BLUR / UNBLUR<br/>age-restricted content"| Client
    PDS -->|"⑤ GRANT RECORD<br/>read by Gatekeeper"| GK
    Client -->|"⑥ ACCESS REQUEST<br/>DID + signed challenge"| GK
    GK -->|"⑦ ISSUE JWT<br/>Submarined JWT URL"| Client
    Client -->|"⑧ FETCH CONTENT<br/>JWT URL request"| Pinata
    Pinata -->|"⑨ ENCRYPTED BLOB<br/>decrypted client-side"| Client
```

---

## Component Responsibilities

| Component | Protocol Role |
|---|---|
| **User PDS** (ATproto) | Source of truth for all lexicon records (`actor.profile`, `feed.item`, `actor.grant`, `verify.age`, `verify.status`); controls grant issuance and revocation |
| **ATproto Relay** | Aggregates and indexes PDS records; enables content discovery and age-verification status checks across network |
| **AppView** (Keyhole.xxx) | Reads `verify.status` records to enforce age gating; blurs age-restricted content for unverified viewers |
| **Client / App** | User interface; orchestrates the full access workflow on behalf of subscriber |
| **Gatekeeper** | Decentralized auth sidecar; validates grants, checks age-verification status for age-gated content, and issues JWT URLs |
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

    subgraph AppViewInfra["AppView Infrastructure"]
        AV["Keyhole.xxx AppView<br/>Reads verify.status<br/>Enforces age gating"]
    end

    subgraph Bob["Bob's Infrastructure"]
        BPDS["Bob's PDS<br/>ATproto"]
        BClient["Bob's Client App"]
    end

    APDS <-->|"SYNC"| R1
    BPDS <-->|"SYNC"| R1
    BClient <-->|"Discovery"| R1
    R1 -->|"verify.status"| AV
    AV -->|"Blur / unblur"| BClient
    BClient <-->|"Auth / Access"| AGK
    BClient <-->|"Content fetch"| APinata
```
