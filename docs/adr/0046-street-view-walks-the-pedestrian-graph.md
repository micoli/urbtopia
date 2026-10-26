# Street view moves along the pedestrian graph, not freely

The player can leave the isometric camera and stand on a sidewalk at eye level, as in Google Street View. A perspective camera sits on a node of the pedestrian graph and moves node to node along its edges. Dragging looks around, W or a tap on a ring on the ground steps to the neighbour node closest to the gaze, and Escape returns to the isometric camera, which was only suspended.

The player chooses where to stand: the Street view button arms a drop, and the next tap on the isometric map places the view on the nearest node within 6 tiles. Each ring on the ground is a jump of up to 3 nodes in a straight line, stopping at a branch or a bend, so rings stay well apart.

Street view is a camera mode, not a tool: it never changes the city, and the build menu and floating badges are hidden while it lasts.

## Why

- The pedestrian graph already says where a person can stand: sidewalks, crossings, roundabout rings, pedestrian ways and bridges. Free walking would need collisions against building models, which have no collision geometry and whose size is only measured from their bounding box.
- Nodes keep the walker on the pavement and on crossings, the places the city is drawn to be seen from.
- Looking by drag and stepping by tap work the same with a mouse and on a phone, with no pointer lock and no virtual joystick.
- A light linear fog hides the edge of the map. It costs almost nothing on a phone, within the lighting budget of ADR 0034, which excludes shadow maps and post-processing.

## Consequences

- The player cannot cross a road anywhere or enter a building: only graph edges can be walked.
- Pedestrians and vehicles are the same low-detail models as in the isometric view and look crude up close.
- The camera ignores the isometric controller's input while street view is on, and the city is rendered from whichever camera is active.

## Alternatives rejected

- Free first-person walking with pointer lock: needs collisions that do not exist and a different control scheme on touch.
- A fixed camera following a vehicle or a pedestrian: a show, not an exploration.
- A sky dome and shadows for a more realistic horizon: more cost than the fog for little gain in a first version.
