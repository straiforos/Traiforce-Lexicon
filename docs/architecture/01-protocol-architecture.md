# 01 – Protocol Architecture

## Tripartite Data Model

Traiforce operates on a three-layer architecture where each layer has a distinct responsibility.

```mermaid
graph TD
    subgraph Public["Public Layer — ATproto PDS"]
        P1["Social metadata"]
        P2["Discovery pointers"]
        P3["Permission / grant records"]
    end
    subgraph Gated["Encrypted / Gated Layer — IPFS / Pinata"]
        G1["High-bandwidth media"]
        G2["Sensitive profile data"]
        G3["Encrypted JSON blobs"]
    end
    subgraph Coord["Coordination Layer — Gatekeeper"]
        C1["Validates ATproto permissions"]
        C2["Unlocks IPFS content"]
        C3["Issues JWT URLs"]
    end
    Client(["Client Application"])

    Public --> Client
    Gated  --> Client
    Coord  --> Client
```

## Layer Descriptions

### Public Layer – ATproto PDS

The **Public Layer** lives in the user's Personal Data Server (PDS) on the AT Protocol network.

- **Responsibility**: Store discoverable, public-facing metadata and access-control records.
- **Data types**:
  - Social metadata (display names, avatars, public bios)
  - Discovery pointers referencing encrypted IPFS content
  - Permission/grant records that authorize other users
- **Visibility**: Readable by the AT Protocol Relay network and any client.

### Encrypted / Gated Layer – IPFS via Pinata

The **Encrypted/Gated Layer** stores the actual private content off-chain using IPFS, hosted and pinned through Pinata.

- **Responsibility**: Host high-bandwidth media and sensitive profile information.
- **Data types**:
  - Encrypted JSON blobs (full profile vault)
  - Private images, video, and other media files
- **Access**: Content is only retrievable via Submarined JWT URLs issued by the Gatekeeper.

### Coordination Layer – Gatekeeper

The **Coordination Layer** (Gatekeeper) is a decentralized sidecar service that bridges ATproto permissions with IPFS content delivery.

- **Responsibility**: Authenticate clients, verify on-chain grant records, and provision temporary access URLs.
- **Key operations**:
  1. Receive client access requests
  2. Verify `net.traiforce.actor.grant` records on ATproto
  3. Validate client identity signatures
  4. Use the creator's Pinata API Key to generate Submarined JWT URLs

## Layer Interactions

```mermaid
flowchart TD
    PDS["ATproto PDS\nStores grant records\nnet.traiforce.actor.grant"]
    IPFS["IPFS / Pinata\nStores encrypted blobs\nvaultCid · contentCid"]
    GK["GATEKEEPER\nCoordination Layer"]
    CA["CLIENT APP"]
    PG["PINATA GATEWAY"]

    PDS -->|"grant records"| GK
    IPFS -->|"encrypted blobs"| GK
    GK -->|"Submarined JWT URL"| CA
    CA -->|"Fetch content via JWT URL"| PG
```
