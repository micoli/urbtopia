# Transit fleet, Vehicles and Service vehicles

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

`transitVehicle` (mode bus, brt or train; propulsion electric or coal; cost, capacity, speed, power from `TRANSIT`; model from `TRAIN_MODELS`, `BUS_MODEL`), `trafficVehicle` (`VEHICLE_MODELS`, spawn weight, recolor variants), `serviceVehicle` (`SERVICE_VEHICLE_MODELS`, Service category). Bus stop, BRT station and Railway station buildings get their kind.

## Comments

Delivered (2026-10-10):

- `transitVehicle` collection: the bus (model) and the BRT and trains (propulsion, price, power, coal, operating cost, emissions, lead and trailing models). `TRANSIT` reads it; coal and compatible lines follow propulsion and mode instead of vehicle ids.
- Bus stop, BRT station and Railway station are a `transitStop` kind with their mode; the BRT and rail network cost, speed and capacity sit on their stations, their unlock is the station's.
- `trafficVehicle` (seven cars, spawn weight) and `serviceVehicle` (the vehicle each Public facility sends, by facility id) collections; the scene reads their models. Car and train models are now Model ids.
- Not done: recolor variants of traffic vehicles (the game recolors none today).
