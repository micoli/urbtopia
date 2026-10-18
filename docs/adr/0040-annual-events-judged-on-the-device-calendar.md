---
status: accepted
---

# Annual events judged on the device calendar

An Annual event is open for building from 21 days before its anchor date to 14 days after it. Whether a window is open is decided from the date of the player's device, never from a server, and never from the game's own time. Three choices are hard to reverse and look odd without context.

**Device date, not server clock.** Events (the Challenge kind) are judged by the server clock because they pay Medals. An Annual event item is cosmetic and bought with Urbs, so changing the device date to build one out of season harms nobody and is accepted, like the client trust of ADR-0025 and ADR-0031. A server clock would add a dependency to a feature that must keep working offline and signed out.

**A pure window, an injected `now`.** The core still never reads the clock (ADR-0002). A pure function `annualEventWindow(event, year)` computes the window from the event's data (a fixed day, Easter, or a weekday in a range), and the build command receives `now` like every other command and refuses a placement outside any window. A Time skip moves `lastSeen` and `timeOffset` but not the date of the device, so it never opens or closes a window. Windows are evaluated for the previous, current and next year because a window can span the new year.

**Placed items outlive their window.** An Annual event item is never Retired when its window closes: its id lives in saves (ADR-0021), it keeps working in the cities that have it, and it can be moved and demolished. Only new placements are refused. Removing the item or granting it a lifetime was rejected: a player would lose what they paid 700 to 1500 Urbs for.

The definitions of the events are data, one file each in `assets/defs/annualEvents/`, validated by a generated schema like the other Game objects (ADR-0021). The dismissal of the notice is kept in the browser per event and per year, outside the save and the Cloud save.
