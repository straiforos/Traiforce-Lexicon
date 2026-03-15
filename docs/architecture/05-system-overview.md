# 05 – System Overview

## High-Level Component Diagram

The following diagram shows all major components of the Traiforce Protocol and their interactions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRAIFORCE PROTOCOL                           │
│                     Full System Component Map                       │
└─────────────────────────────────────────────────────────────────────┘

[ USER PDS ] <───────────(SYNC)───────────> [ ATPROTO RELAY ]
      │                                            │
      │  Stores:                                   │  Serves:
      │  • net.traiforce.actor.profile             │  • feed.item records
      │  • net.traiforce.feed.item                 │  • actor.profile records
      │  • net.traiforce.actor.grant               │  • actor.grant records
      │                                            │
 (GRANT RECORD)                              (ITEM METADATA)
      │                                            │
      │                                            │
      ▼                                            ▼
[ GATEKEEPER ] <──────────────────────── [ CLIENT / APP ]
      │                                            │
      │  Validates:                                │  Performs:
      │  1. Grant exists in PDS                    │  1. Feed discovery
      │  2. T_timestamp signature                  │  2. Pre-flight grant check
      │  3. Grant not expired                      │  3. Challenge signing
      │  4. Issuer signature on grant              │  4. JWT URL fetch
      │                                            │
 (ISSUE JWT)                                 (FETCH CONTENT)
      │                                            │
      │                                            │
      ▼                                            ▼
[ PINATA GATEWAY ] <────────────────── (ENCRYPTED BLOB)
      │
      │  Hosts:
      │  • Encrypted content (contentCid)
      │  • Encrypted profile vault (vaultCid)
      │
      ▼
  (Content delivered to authorized client)
```

---

## Data Flow Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATA FLOWS                               │
│                                                                  │
│  ① SYNC                                                          │
│     User PDS ──────────────────────────────► ATproto Relay       │
│     (all lexicon records replicated to relay for discovery)      │
│                                                                  │
│  ② ITEM METADATA                                                 │
│     ATproto Relay ─────────────────────────► Client/App          │
│     (feed.item with contentCid, blurHash, gatekeeperDid)         │
│                                                                  │
│  ③ GRANT RECORD                                                  │
│     User PDS ──────────────────────────────► Gatekeeper          │
│     (Gatekeeper reads grant to authorize access)                 │
│                                                                  │
│  ④ ACCESS REQUEST                                                │
│     Client/App ────────────────────────────► Gatekeeper          │
│     (DID + signed T_timestamp challenge)                         │
│                                                                  │
│  ⑤ ISSUE JWT                                                     │
│     Gatekeeper ────────────────────────────► Client/App          │
│     (Submarined JWT URL for contentCid)                          │
│                                                                  │
│  ⑥ FETCH CONTENT                                                 │
│     Client/App ────────────────────────────► Pinata Gateway      │
│     (request using JWT URL)                                      │
│                                                                  │
│  ⑦ ENCRYPTED BLOB                                               │
│     Pinata Gateway ────────────────────────► Client/App          │
│     (encrypted content; decrypted client-side)                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT         │  PROTOCOL ROLE                             │
├────────────────────┼───────────────────────────────────────────┤
│  User PDS          │  Source of truth for all lexicon records;  │
│  (ATproto)         │  controls grant issuance and revocation    │
├────────────────────┼───────────────────────────────────────────┤
│  ATproto Relay     │  Aggregates and indexes PDS records;       │
│                    │  enables content discovery across network  │
├────────────────────┼───────────────────────────────────────────┤
│  Client / App      │  User interface; orchestrates the full     │
│                    │  access workflow on behalf of subscriber   │
├────────────────────┼───────────────────────────────────────────┤
│  Gatekeeper        │  Decentralized auth sidecar; validates     │
│                    │  grants + identity; issues JWT URLs        │
├────────────────────┼───────────────────────────────────────────┤
│  Pinata Gateway    │  IPFS content delivery; enforces JWT-based │
│                    │  access control on encrypted blobs         │
└────────────────────┴───────────────────────────────────────────┘
```

---

## Deployment Topology

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    ALICE'S INFRASTRUCTURE                    │
  │                                                              │
  │   ┌──────────────┐      ┌──────────────┐                    │
  │   │  Alice's PDS │      │  Gatekeeper  │                    │
  │   │  (ATproto)   │      │  (sidecar)   │                    │
  │   └──────────────┘      └──────────────┘                    │
  │          │                     │                            │
  │          └──────────┬──────────┘                            │
  │                     │                                       │
  │              ┌──────▼──────┐                                │
  │              │   Pinata    │                                 │
  │              │  Gateway    │                                 │
  │              │ (IPFS host) │                                 │
  │              └─────────────┘                                │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │                  SHARED ATPROTO NETWORK                      │
  │                                                              │
  │   ┌──────────────┐      ┌──────────────┐                    │
  │   │  ATproto     │      │  ATproto     │                    │
  │   │  Relay       │      │  Relay       │                    │
  │   └──────────────┘      └──────────────┘                    │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │                    BOB'S INFRASTRUCTURE                      │
  │                                                              │
  │   ┌──────────────┐      ┌──────────────┐                    │
  │   │  Bob's PDS   │      │  Bob's       │                    │
  │   │  (ATproto)   │      │  Client App  │                    │
  │   └──────────────┘      └──────────────┘                    │
  └──────────────────────────────────────────────────────────────┘
```
