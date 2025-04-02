// Import the functions, class, and config to be tested
const sketch = require("../scetch.js");
const {
  simulationConfig, // Import the config object
  createGrid,
  findValidPosition,
  isValidGridPos,
  gridToPixel,
  pixelToGrid,
  Ant
} = sketch;

// Mock p5.js global functions NEEDED by the imported sketch functions
// These need to be global because the sketch functions expect them in the global scope
global.createVector = (x, y) => ({ x, y });
global.constrain = (x, min, max) => Math.min(Math.max(x, min), max);
global.floor = (x) => Math.floor(x);
global.dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
global.map = (value, start1, stop1, start2, stop2) => {
  if (stop1 === start1) return start2;
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
};
global.max = Math.max;
global.min = Math.min;
global.abs = Math.abs;
global.random = (arg1, arg2) => {
    if (arg1 === undefined) return Math.random();
    if (arg2 === undefined) return Math.random() * arg1;
    return Math.random() * (arg2 - arg1) + arg1;
};
global.PI = Math.PI;
global.TWO_PI = Math.PI * 2;
global.atan2 = Math.atan2;
// Mock p5.Vector methods - needed by Ant class
global.p5 = {
    Vector: {
        random2D: () => {
            const angle = Math.random() * 2 * Math.PI;
            const vec = { x: Math.cos(angle), y: Math.sin(angle) };
            vec.mult = (scalar) => ({ ...vec, x: vec.x * scalar, y: vec.y * scalar, mult: vec.mult, heading: vec.heading });
            vec.heading = () => Math.atan2(vec.y, vec.x);
            return vec;
        },
        add: (v1, v2) => {
            const vec = { x: v1.x + v2.x, y: v1.y + v2.y };
            vec.mult = (scalar) => ({ ...vec, x: vec.x * scalar, y: vec.y * scalar, mult: vec.mult, heading: vec.heading });
            vec.heading = () => Math.atan2(vec.y, vec.x);
            return vec;
        },
        fromAngle: (angle) => {
            const vec = { x: Math.cos(angle), y: Math.sin(angle) };
            vec.mult = (scalar) => ({ ...vec, x: vec.x * scalar, y: vec.y * scalar, mult: vec.mult, heading: vec.heading });
            vec.heading = () => Math.atan2(vec.y, vec.x);
            return vec;
        },
    },
};
// Mock width/height needed by Ant.move boundary check
global.width = undefined;
global.height = undefined;

// No need for setupGlobals function anymore

describe("Utility Functions", () => {
  beforeEach(() => {
    // Set config values for utility tests
    simulationConfig.GRID_COLS = 10;
    simulationConfig.GRID_ROWS = 8;
    simulationConfig.CELL_SIZE = 20;
    // Initialize maze using imported createGrid
    simulationConfig.maze = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
    // Ensure pheromone grids exist if any utility function unexpectedly needs them
    simulationConfig.explorePheromones = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
    simulationConfig.returnPheromones = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
  });

  test("createGrid creates a 2D array with the specified dimensions and default value", () => {
    const grid = createGrid(3, 4, 0);
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(4);
    expect(grid[1][2]).toBe(0);
  });

  test("isValidGridPos returns true for valid grid positions", () => {
    // Uses config set in beforeEach
    expect(isValidGridPos(5, 4)).toBe(true);
    expect(isValidGridPos(0, 0)).toBe(true);
    expect(isValidGridPos(9, 7)).toBe(true); // Max valid index
  });

  test("isValidGridPos returns false for invalid grid positions", () => {
    // Uses config set in beforeEach
    expect(isValidGridPos(-1, 4)).toBe(false);
    expect(isValidGridPos(10, 4)).toBe(false); // x === GRID_COLS
    expect(isValidGridPos(5, -1)).toBe(false);
    expect(isValidGridPos(5, 8)).toBe(false);  // y === GRID_ROWS
  });

  test("gridToPixel converts grid coordinates to pixel coordinates", () => {
    // Uses config set in beforeEach
    const pixelPos = gridToPixel(2, 3);
    expect(pixelPos.x).toBe(50); // (2 + 0.5) * 20
    expect(pixelPos.y).toBe(70); // (3 + 0.5) * 20
  });

  test("pixelToGrid converts pixel coordinates to grid coordinates", () => {
    // Uses config set in beforeEach
    const gridPos = pixelToGrid(50, 70);
    expect(gridPos.x).toBe(2); // floor(50 / 20)
    expect(gridPos.y).toBe(3); // floor(70 / 20)
  });

  test("findValidPosition returns the target position if it is not a wall", () => {
    // Override config for this specific test
    simulationConfig.GRID_COLS = 3;
    simulationConfig.GRID_ROWS = 3;
    simulationConfig.maze = createGrid(3, 3, 0);
    const validPos = findValidPosition(1, 1);
    expect(validPos.x).toBe(1);
    expect(validPos.y).toBe(1);
  });

  test("findValidPosition finds the nearest valid position if the target is a wall", () => {
    // Override config for this specific test
    simulationConfig.GRID_COLS = 3;
    simulationConfig.GRID_ROWS = 3;
    simulationConfig.maze = createGrid(3, 3, 0);
    simulationConfig.maze[1][1] = 1; // Place wall at target

    const validPos = findValidPosition(1, 1);
    const neighbors = [
        {x:0, y:0}, {x:1, y:0}, {x:2, y:0},
        {x:0, y:1},             {x:2, y:1},
        {x:0, y:2}, {x:1, y:2}, {x:2, y:2}
    ];
    expect(neighbors).toContainEqual(validPos);
  });
});

describe("Ant Class", () => {
  beforeEach(() => {
    // Set config values for Ant tests
    simulationConfig.GRID_COLS = 10;
    simulationConfig.GRID_ROWS = 8;
    simulationConfig.CELL_SIZE = 10;
    simulationConfig.ANT_SPEED = 1;
    simulationConfig.PHEROMONE_DURATION = 5000;
    simulationConfig.DEPOSITION_RATE_EXPLORE = 15;
    simulationConfig.DEPOSITION_RATE_RETURN = 15;
    simulationConfig.PHEROMONE_MAX = 255;
    simulationConfig.FOOD_DETECTION_RADIUS = 1;
    simulationConfig.COLONY_DETECTION_RADIUS = 1;
    simulationConfig.ANT_HISTORY_LENGTH = 20;
    simulationConfig.TURN_ANGLE = Math.PI / 6;
    simulationConfig.RANDOM_TURN_CHANCE = 0.1;
    simulationConfig.SENSE_ANGLE = Math.PI / 2.5;
    simulationConfig.SENSE_RADIUS = 5;
    simulationConfig.FOLLOW_STRENGTH_WEIGHT = 5;
    simulationConfig.GOAL_SENSE_RADIUS = 5;

    // Initialize grids and positions in config
    simulationConfig.maze = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
    simulationConfig.explorePheromones = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
    simulationConfig.returnPheromones = createGrid(simulationConfig.GRID_COLS, simulationConfig.GRID_ROWS, 0);
    simulationConfig.colonyPos = { x: 1, y: 1 };
    simulationConfig.foodPos = { x: simulationConfig.GRID_COLS - 2, y: simulationConfig.GRID_ROWS - 2 };
    simulationConfig.foodFoundCount = 0;
    simulationConfig.ants = []; // Reset ants array

    // Set mock global width/height based on config for Ant boundary checks
    global.width = simulationConfig.CELL_SIZE * simulationConfig.GRID_COLS;
    global.height = simulationConfig.CELL_SIZE * simulationConfig.GRID_ROWS;
  });

  test("Ant constructor initializes ant properties", () => {
    // Uses config set in beforeEach (CELL_SIZE=10)
    const ant = new Ant(2, 3);
    expect(ant.pos.x).toBe(25); // (2 + 0.5) * 10
    expect(ant.pos.y).toBe(35); // (3 + 0.5) * 10
    expect(typeof ant.vel.x).toBe('number');
    expect(typeof ant.vel.y).toBe('number');
    expect(ant.state).toBe("searching");
    expect(ant.gridPos.x).toBe(2);
    expect(ant.gridPos.y).toBe(3);
    expect(ant.history).toEqual([]);
    expect(ant.charge).toBe(simulationConfig.PHEROMONE_DURATION);
  });

  test("Ant update method updates ant properties", () => {
    const ant = new Ant(2, 3);
    const initialCharge = ant.charge;
    // Store initial position to check it changes
    const initialPos = { x: ant.pos.x, y: ant.pos.y };
    ant.update();
    expect(ant.pos.x).not.toBe(initialPos.x);
    expect(ant.pos.y).not.toBe(initialPos.y);
    expect(typeof ant.gridPos.x).toBe('number');
    expect(typeof ant.gridPos.y).toBe('number');
    expect(ant.history.length).toBeGreaterThan(0);
    expect(ant.charge).toBe(initialCharge - 1);
  });

  test("Ant move method updates ant position", () => {
    const ant = new Ant(2, 3);
    const initialPos = { x: ant.pos.x, y: ant.pos.y };
    ant.move();
    expect(ant.pos.x).not.toBe(initialPos.x);
    expect(ant.pos.y).not.toBe(initialPos.y);
  });

  test("Ant depositPheromone method deposits explore pheromones when searching", () => {
    const ant = new Ant(2, 3);
    ant.state = 'searching';
    ant.charge = 1000;
    ant.updateGridPos(); // Update gridPos based on initial position
    ant.depositPheromone();
    const expectedDeposition = map(1000, 0, simulationConfig.PHEROMONE_DURATION, 0, simulationConfig.DEPOSITION_RATE_EXPLORE);
    // Check the config's pheromone grid
    expect(simulationConfig.explorePheromones[2][3]).toBeCloseTo(expectedDeposition);
    expect(simulationConfig.returnPheromones[2][3]).toBe(0);
  });

  test("Ant depositPheromone method deposits return pheromones when returning", () => {
    const ant = new Ant(4, 5);
    ant.state = 'returning';
    ant.charge = 2500;
    ant.updateGridPos();
    ant.depositPheromone();
    const expectedDeposition = map(2500, 0, simulationConfig.PHEROMONE_DURATION, 0, simulationConfig.DEPOSITION_RATE_RETURN);
    expect(simulationConfig.returnPheromones[4][5]).toBeCloseTo(expectedDeposition);
    expect(simulationConfig.explorePheromones[4][5]).toBe(0);
  });

 test("Ant checkEnvironment switches state when finding food", () => {
    // Modify config for this test
    simulationConfig.foodPos = { x: 3, y: 3 };
    const ant = new Ant(3, 3); // Ant starts exactly at food
    ant.state = 'searching';
    ant.updateGridPos(); // Sync gridPos
    ant.checkEnvironment();
    expect(ant.state).toBe('returning');
    expect(ant.charge).toBe(simulationConfig.PHEROMONE_DURATION);
  });

  test("Ant checkEnvironment switches state when returning to colony", () => {
    // Modify config for this test
    simulationConfig.colonyPos = { x: 1, y: 1 };
    const ant = new Ant(1, 1); // Ant starts exactly at colony
    ant.state = 'returning';
    ant.updateGridPos(); // Sync gridPos
    ant.checkEnvironment();
    expect(ant.state).toBe('searching');
    expect(ant.charge).toBe(simulationConfig.PHEROMONE_DURATION);
    // Check if foodFoundCount was incremented in the config
    expect(simulationConfig.foodFoundCount).toBe(1);
  });
});
