---
id: "U-1"
title: "Async cleanup on component unmount"
severity: "P1"
origin: "design"
incident_ref: ""
enforcement: "manual"
scope: "all"
---

# Async Cleanup

Every async operation in UI components (data loading, form submission, API calls) must use an AbortController or mounted ref. When a component unmounts, in-flight fetches must be cancelled — never update state on an unmounted component.

```typescript
// Pattern
useEffect(() => {
  const controller = new AbortController();
  loadData({ signal: controller.signal });
  return () => controller.abort();
}, [deps]);
```

This prevents race conditions, memory leaks, and React state-update-on-unmounted warnings.
