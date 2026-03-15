# 02 – Lexicon Specifications

## Core ATproto Lexicon Records

The Traiforce Protocol defines three primary lexicon records in the `net.traiforce` namespace.

---

## A. `net.traiforce.actor.profile`

Defines the user's presence on the Traiforce network.

```
┌──────────────────────────────────────────────────────────┐
│              net.traiforce.actor.profile                 │
├──────────────────┬──────────────────────────────────────┤
│  Field           │  Description                         │
├──────────────────┼──────────────────────────────────────┤
│  displayName     │  Public-facing teaser name visible   │
│  (string)        │  to all ATproto users                │
├──────────────────┼──────────────────────────────────────┤
│  vaultCid        │  IPFS CID pointing to an encrypted   │
│  (string)        │  JSON blob of the full profile       │
├──────────────────┼──────────────────────────────────────┤
│  gatewayUrl      │  Address of the user's dedicated     │
│  (string)        │  Pinata Gateway                      │
│                  │  e.g., alice.mypinata.cloud          │
└──────────────────┴──────────────────────────────────────┘
```

**Data Flow:**
```
  User creates profile
        │
        ▼
  Public displayName ──────────────────► ATproto PDS (readable by all)
        │
        ▼
  Full profile JSON ──► encrypted ──► IPFS (vaultCid stored in PDS)
        │
        ▼
  gatewayUrl ─────────────────────────► ATproto PDS (readable by all)
```

---

## B. `net.traiforce.feed.item`

The gated content pointer. References an encrypted piece of content on IPFS with a safe preview.

```
┌──────────────────────────────────────────────────────────┐
│               net.traiforce.feed.item                    │
├──────────────────┬──────────────────────────────────────┤
│  Field           │  Description                         │
├──────────────────┼──────────────────────────────────────┤
│  contentCid      │  IPFS hash of the actual content     │
│  (string)        │  (encrypted, requires authorization) │
├──────────────────┼──────────────────────────────────────┤
│  blurHash        │  L×W representation of the image for │
│  (string)        │  safe public previews without        │
│                  │  exposing the actual content         │
├──────────────────┼──────────────────────────────────────┤
│  gatekeeperDid   │  DID of the Gatekeeper service the   │
│  (string)        │  client must contact for access      │
└──────────────────┴──────────────────────────────────────┘
```

**Data Flow:**
```
  Creator uploads content
        │
        ▼
  Content encrypted ──────────────────► IPFS (contentCid)
        │
        ├── blurHash generated ────────► ATproto PDS (public preview)
        │
        └── contentCid + gatekeeperDid ► ATproto PDS (feed.item record)
```

---

## C. `net.traiforce.actor.grant`

The Access Control List (ACL) entry. Authorizes a specific user to access gated content.

```
┌──────────────────────────────────────────────────────────┐
│              net.traiforce.actor.grant                   │
├──────────────────┬──────────────────────────────────────┤
│  Field           │  Description                         │
├──────────────────┼──────────────────────────────────────┤
│  subjectDid      │  DID of the user being granted       │
│  (string)        │  access to the content               │
├──────────────────┼──────────────────────────────────────┤
│  issuerDid       │  DID of the content creator          │
│  (string)        │  issuing the grant                   │
├──────────────────┼──────────────────────────────────────┤
│  signature       │  Cryptographic signature from        │
│  (string)        │  issuerDid verifying the grant       │
├──────────────────┼──────────────────────────────────────┤
│  expiry          │  Optional expiration timestamp;      │
│  (datetime?)     │  checked by Gatekeeper on every      │
│                  │  session handshake                   │
└──────────────────┴──────────────────────────────────────┘
```

**Data Flow:**
```
  Alice (issuer) decides to grant Bob access
        │
        ▼
  Alice signs grant record with PDS key
        │
        ▼
  grant record published to ATproto PDS
        │
        │       Later: Bob requests access
        │               │
        ▼               ▼
  Gatekeeper reads grant record ──► verifies signature
        │
        ▼
  Access provisioned (JWT URL issued)
```

---

## Lexicon Relationships

```
  net.traiforce.actor.profile          net.traiforce.feed.item
  ┌──────────────────────┐             ┌──────────────────────┐
  │ displayName          │             │ contentCid           │
  │ vaultCid ──────────────► IPFS      │ blurHash             │
  │ gatewayUrl           │             │ gatekeeperDid ──────────► Gatekeeper
  └──────────────────────┘             └──────────────────────┘
             │                                    │
             │                                    │
             └────────────────────────────────────┘
                            │
                            ▼
              net.traiforce.actor.grant
              ┌──────────────────────┐
              │ subjectDid (Bob)     │
              │ issuerDid  (Alice)   │
              │ signature            │
              │ expiry               │
              └──────────────────────┘
                            │
                            ▼
                       Gatekeeper
                  (validates + issues JWT)
```
