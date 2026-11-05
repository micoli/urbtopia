# 05: Public transport or car, whichever is faster

Status: done
Blocked by: 04

**What to build:** For the third pass, each Citizen compares the car and public transport Travel time; the shorter wins, a tie goes to public transport, a line without spare capacity sends the Citizen to the car, a mode that does not exist for the Home leaves the other. The fixed 70% Rider share goes.

- [ ] `TRANSIT_ELIGIBLE_SHARE` is removed; the Rider share is an output limited by line capacity.
- [ ] A Home without road access rides or walks; a workplace without Road access is reached by public transport or on foot.
- [ ] Riders keep making their Service trips by public transport.
- [ ] Cyclist Riders still take two places per line (ADR 0038).
- [ ] Vitest: fast Metro beats a long road; slow bus loses to a short road; full line falls back to the car; tie goes to public transport.
- [ ] Transport, climate and Traffic figures read the new Riders without a second source.

## Comments

- Mode choice is in the third pass of `assignJobs`; `TRANSIT_ELIGIBLE_SHARE` is gone. Riders' trips are the Jobs they fill, so their Service trips are the shops they work in.
