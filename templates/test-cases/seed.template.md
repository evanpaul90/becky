# Seed — Authentication & Setup

This seed must be executed before any test suite. It establishes the authenticated session.

## Environment
- Base URL: `http://localhost:3000`
<!-- Update these for your project -->
<!-- - Auth provider: Clerk / NextAuth / Supabase Auth -->
<!-- - Test user: owner@yourproject.com -->

## Auth Setup Steps
1. NAVIGATE to `http://localhost:3000`
2. IF sign-in page appears:
   - Fill email/username field
   - Fill password field
   - Click sign-in button
3. VERIFY: Authenticated app loads (dashboard, home page, etc.)
4. AUTH CONFIRMED — proceed to test suite

## Dynamic Values
When test cases say:
- `[today + N days]` → compute the ISO date string (YYYY-MM-DD) for N days from now
- `[timestamp]` → use `Date.now()` for uniqueness
- `[uuid]` → generate a random UUID
