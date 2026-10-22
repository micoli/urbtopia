# Protect what lies beneath

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

Demolition and construction rules around a span.

## Acceptance criteria

- [ ] Demolishing the last infrastructure tile under a span is refused.
- [ ] A network built under an existing span must cross it perpendicularly; building along it is refused.
- [ ] Demolishing the Bridge refunds at `sellRefundRatio` and frees the ramps.
