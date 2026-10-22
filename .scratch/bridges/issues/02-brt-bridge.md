# BRT Bridge

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

A BRT corridor can be carried by a Bridge over Road, BRT or Railway tiles.

## Acceptance criteria

- [ ] Same placement rules with a BRT corridor at each outer end; joins the BRT graph only.
- [ ] Lines and Transfers cross it; no station on it.
- [ ] `validNetworkCrossings` ignores tiles beneath a span.
- [ ] Price with the BRT coefficient.
