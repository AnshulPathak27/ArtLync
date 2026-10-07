# Security Documentation

This document describes the End-to-End Encryption (E2EE) implementation for chat messages and deliverable files in the AI Creator Marketplace (P3 feature).

## Overview

The marketplace implements client-side E2EE for:
- Direct messages between brands and creators
- Deliverable files shared during engagements

The server **never sees plaintext** — it only stores and relays ciphertext. This is a structural property of the data flow, not an access-control promise.

---

## Cryptographic Design

### Key Generation (at Signup)

1. Browser generates ECDH key pair via Web Crypto API:
   ```javascript
   const keyPair = await crypto.subtle.generateKey(
     { name: "ECDH", namedCurve: "P-256" },
     true, // extractable
     ["deriveKey", "deriveBits"]
   )
   ```
2. Public key sent to server, stored on User record
3. Private key stored in IndexedDB (never leaves browser)

### Shared Key Derivation (per Conversation/Engagement)

For each conversation between User A and User B:

```javascript
// Both parties independently derive the same shared key
const sharedKey = await crypto.subtle.deriveKey(
  {
    name: "ECDH",
    public: otherPartyPublicKey  // imported via crypto.subtle.importKey
  },
  myPrivateKey,
  { name: "AES-GCM", length: 256 },
  false, // not extractable
  ["encrypt", "decrypt"]
)
```

Both sides derive **identical** AES-256-GCM key — it is never transmitted.

### Message Encryption

```javascript
// Encrypt
const iv = crypto.getRandomValues(new Uint8Array(12))  // 96-bit IV
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  sharedKey,
  new TextEncoder().encode(plaintext)
)

// Send to server: { ciphertext: base64(ciphertext), iv: base64(iv) }
```

### File Encryption (Deliverables)

```javascript
// Same shared key per engagement
const fileBuffer = await file.arrayBuffer()
const iv = crypto.getRandomValues(new Uint8Array(12))
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  engagementSharedKey,
  fileBuffer
)

// Upload ciphertext + IV to storage
// Store { storageKey, iv, filename } in DeliverableFile table
```

---

## Data Flow

### Sending a Message

```
[Sender Browser]          [Server]           [Recipient Browser]
     │                      │                      │
     │── Encrypt with       │                      │
     │   shared key ──────▶│                      │
     │                      │── Store ciphertext──▶│
     │                      │                      │
     │                      │◀─── Fetch ciphertext│
     │                      │                      │
     │                      │                      │── Decrypt with
     │                      │                      │    shared key
```

### Sharing a Deliverable File

```
[Uploader Browser]        [Server/Storage]      [Recipient Browser]
     │                      │                      │
     │── Encrypt file       │                      │
     │   with engagement    │                      │
     │   shared key ───────▶│                      │
     │                      │── Store ciphertext──▶│
     │                      │                      │
     │                      │◀─── Download         │
     │                      │                      │
     │                      │                      │── Decrypt with
     │                      │                      │    engagement shared key
```

---

## What the Server Sees

| Data | Server Access |
|------|---------------|
| User public keys | ✅ Plaintext (needed for key derivation) |
| Message ciphertext | ✅ Base64-encoded ciphertext + IV |
| Deliverable ciphertext | ✅ Encrypted blobs in object storage |
| Message plaintext | ❌ Never |
| File plaintext | ❌ Never |
| Private keys | ❌ Never (stored in IndexedDB) |

The server is **structurally unable** to decrypt content — it lacks the private keys required for ECDH shared secret derivation.

---

## Threat Model

### Protected Against
- Server compromise (database leak → only ciphertext exposed)
- Malicious admin/insider (cannot decrypt without private keys)
- Network interception (TLS + application-layer encryption)
- Storage provider breach (R2/S3 only holds ciphertext)

### Not Protected Against
- Client-side malware/keyloggers (private keys in browser)
- Compromised user device (IndexedDB accessible)
- Man-in-the-middle during initial public key exchange (mitigated by TLS)
- Metadata analysis (who talks to whom, when, message sizes)
- Quantum attacks (ECDH P-256 not post-quantum secure)

---

## Limitations & Caveats

### Hackathon Scope
This is a **demonstration** of client-side E2EE suitable for a prototype. It demonstrates the core cryptographic flow but has not undergone security audit.

### Production Requirements
A production system should use:

1. **Audited Protocol:** Signal Protocol (Double Ratchet) or libsodium
2. **Key Rotation:** Periodic re-keying, forward secrecy
3. **Key Backup/Recovery:** Secure key escrow or social recovery
4. **Device Management:** Multiple device sync, revocation
5. **Post-Quantum:** Hybrid KEM (e.g., Kyber + ECDH)
6. **Formal Verification:** Protocol verification (ProVerif, Tamarin)
7. **Penetration Testing:** Third-party security assessment

### Do Not Use This Implementation For
- Real sensitive communications without audit
- Compliance-critical data (HIPAA, GDPR, etc.)
- High-value intellectual property transfer
- Any scenario requiring provable security guarantees

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/app/api/conversations/[id]/messages/route.ts` | Message relay (ciphertext only) |
| `src/app/api/engagements/[id]/deliverables/route.ts` | Deliverable upload/download |
| `src/app/messages/page.tsx` | Chat UI with client-side crypto |
| `src/app/engagements/[id]/deliverables/page.tsx` | File upload/download UI |
| `src/lib/crypto.ts` | (Recommended) Centralized crypto utilities |

---

## Testing Encryption

To verify encryption works:

1. Open two browser windows (incognito + normal)
2. Log in as Brand in one, Creator in other
3. Start conversation via bid acceptance
4. Send messages, upload files
5. Check database:
   ```sql
   SELECT ciphertext, iv FROM "Message" WHERE "conversationId" = '...';
   -- ciphertext should be base64, not readable
   ```
6. Check object storage:
   - Downloaded files should be undecryptable without shared key

---

## Conclusion

This implementation demonstrates a working E2EE flow where the server never handles plaintext. It proves the architectural pattern but **should not be considered production-ready without significant hardening and audit**.

For production, use established libraries:
- **Signal Protocol:** `@signalapp/libsignal-client`
- **Libsodium:** `libsodium-wrappers` or `tweetnacl`
- **OpenPGP:** `openpgp.js`
- **WebCrypto Wrapper:** `@peculiar/webcrypto`