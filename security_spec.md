# Security Spec

## 1. Data Invariants
- Each user only has access to their own sub-collections under `/users/{userId}/*`.
- Only authenticated users can read, write, update, or delete documents within their own `/users/{userId}` branch.
- Document IDs must conform to regex `^[a-zA-Z0-9_\-]+$` and length <= 128 chars.
- Incoming payloads must match entity schemas (strings bounded, array size bounded <= 50).

## 2. The Dirty Dozen Attack Payloads
1. Cross-User Read: User A attempting `get /users/userB/medicines/med1` -> PERMISSION_DENIED.
2. Cross-User Write: User A attempting `set /users/userB/medicines/med1` -> PERMISSION_DENIED.
3. Unauthenticated Read: Anonymous non-auth client attempting `list /users/userA/medicines` -> PERMISSION_DENIED.
4. Oversized ID Injection: Attempting doc ID with 500 characters -> PERMISSION_DENIED.
5. Malicious Regex ID: Attempting doc ID with `../../path_traversal` -> PERMISSION_DENIED.
6. Shadow Field Injection on Medicine: Attempting write with arbitrary system keys -> Blocked by validation.
7. Unbounded Array Attack: Attempting times array with 200 items -> PERMISSION_DENIED.
8. Negative stock numbers: Total units cannot be manipulated without validation.
9. Cross-User Log Injection: User A attempting to insert fake dose logs into User B's log collection -> PERMISSION_DENIED.
10. Prescription Modification: Non-owner trying to delete another user's prescription -> PERMISSION_DENIED.
11. Settings Overwrite: Non-owner attempting to modify alert configs for another user -> PERMISSION_DENIED.
12. Blanket List scraping without Auth -> PERMISSION_DENIED.
