# TESTING: PERFORMANCE
## TARGETS
- Discovery/search usable at 10k+ vendors (search not dropdown).
- FabChat responsive on cheap phones (polling acceptable now; real-time at scale).
- Dashboards load fast with real data (progressive/loading states).

## WHAT TO TEST
- Large result sets (search, discovery, inventory).
- Message threads with many messages.
- Order lists at volume.
- Photo handling (base64 is a known scale risk → Storage).

## GROW TOWARD
Query optimization, pagination, indexing, moving heavy verification/QR to background jobs, CDN for photos.
