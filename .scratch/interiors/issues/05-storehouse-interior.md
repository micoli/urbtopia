# Storehouse interior

Status: resolved
Blocked by: 01

- Models and Fixture defs: shelves, pallets, dock, forklift, conveyors, drawn in Blender.
- Assembly line from the entry dock to the shelves; stocker carries the capacity part, capped by Tier and added to the base capacity; technician repairs.
- Done when: capacities still add up across Storehouses, an empty interior keeps the current capacity, and a sale is still refused when storage could not hold what is stored.

## Answer

Done. The Storehouse is a Line interior of kind `storehouse` (no Flow): `storehouseDock` at the head of the Line, `storehouseHoist`, Conveyors, `storehouseRack` as its Exit (each linked rack adds `capacity`, saturating towards the cap of the Tier in `interiors.json`), Drive parts and walls. The stocker delivers the capacity part: `storageCapacity` multiplies what each Storehouse holds by `1 + capacity bonus × Fill rate`, so the capacities still add up across Storehouses, nothing changes without a stocker or with a cut Line, and a sale is still refused when storage could not hold what is stored.
