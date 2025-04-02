# Ants Demo

This is a simulation of ants foraging for food.

## Running the simulation

To run the simulation, open `scetch.js` in a browser that supports p5.js.

## Running the tests

This project uses Jest for unit testing. To run the tests:

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the tests:
    ```bash
    npm test
    ```

## Configuration

The simulation behavior can be adjusted by modifying the values within the `simulationConfig` object in `scetch.js`. Here are the key parameters:

**Simulation Parameters:**

*   `NUM_ANTS`: Maximum number of ants.
*   `ANT_SPEED`: Ant movement speed (grid cells per update).
*   `EVAPORATION_RATE`: How quickly pheromones fade (0.0 to 1.0).
*   `DEPOSITION_RATE_EXPLORE`: Pheromone amount deposited by searching ants.
*   `DEPOSITION_RATE_RETURN`: Pheromone amount deposited by returning ants.
*   `PHEROMONE_MAX`: Maximum pheromone strength.
*   `PHEROMONE_DURATION`: How long returning ants deposit pheromones (in updates).
*   `SENSE_RADIUS`: How far ants can sense pheromones (grid cells).
*   `GOAL_SENSE_RADIUS`: How far ants can directly sense the colony/food (grid cells).
*   `SENSE_ANGLE`: Width of ant's sensing field of view (radians).
*   `TURN_ANGLE`: Maximum turning angle per update (radians).
*   `FOLLOW_STRENGTH_WEIGHT`: How strongly ants follow pheromones vs. wander.
*   `RANDOM_TURN_CHANCE`: Probability of a random turn (0.0 to 1.0).
*   `FOOD_DETECTION_RADIUS`: Distance to detect food (grid cells).
*   `COLONY_DETECTION_RADIUS`: Distance to detect colony when returning (grid cells).
*   `ANT_HISTORY_LENGTH`: Number of steps remembered to avoid loops.

**Maze and Grid Settings:**

*   `GRID_COLS`: Number of grid columns.
*   `GRID_ROWS`: Number of grid rows.

**Performance:**

*   `SPAWN_INTERVAL`: Time between spawning new ants (milliseconds).
