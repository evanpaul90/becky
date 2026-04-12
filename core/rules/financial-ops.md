---
id: "D-4"
title: "Financial operations must never fail silently"
severity: "P0"
origin: "incident"
incident_ref: "2026-04-05 folio ₹0 incident — catch blocks returned null, callers assumed success"
enforcement: "manual"
scope: "all"
---

# Financial Operations — Fail Loud

Any function that creates charges, records payments, settles folios, or generates invoices MUST propagate errors to the caller. Never swallow errors with `catch { return null }`.

```typescript
// BAD — caller gets null, assumes success, folio stays at ₹0
} catch (err) {
    console.error("postFolioItem failed:", err);
    return null;
}

// GOOD — caller knows it failed, can show error to user
} catch (err) {
    console.error("postFolioItem failed:", err);
    throw new Error(`Failed to post charge: ${err instanceof Error ? err.message : 'Unknown error'}`);
}
```

For non-blocking operations (audit logging, analytics tracking), silent catch is acceptable. For financial operations, it is not.

The distinction: if a silent failure means money is wrong, the operation must throw.
