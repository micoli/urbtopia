# Dairy interior

Status: resolved
Blocked by: 01

- Models and Fixture defs: vats, pipes, pasteuriser, conveyors, drawn in Blender.
- Flow Links and an assembly line; cheesemaker carries the Cheese yield, cream maker the Cream yield, technician repairs.
- Done when: yields rise only with the role filled, and tests cover the parts and wear.

## Answer

Done. The Dairy is a Line interior of kind `dairy`: Flow Machines (`dairyMilkVat` at the head of the Line, `dairyPasteurizer`, `dairyCheeseCellar`), a Counter as its Exit, Tank, Pump, Pipes, Drive parts and Conveyors. Its yield is split in two groups of Goods in `interiors.json` (`yieldGroups`: cheese and goatCheese, cream); each Machine raises one group (`yieldGroup`), and the cheesemaker and the cream maker each deliver their group, so `interiorBonusOfBuilding(dairy, item)` is nothing for a group whose role is not hired. Asked about no item (`maxQuantityOf`), it is the best group.
