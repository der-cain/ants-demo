// Import the functions, class, and config to be tested
const sketch = require("../scetch.js");
const {
  simulationConfig, // Import the config object
  createGrid,
  findValidPosition,
  isValidGridPos,
  gridToPixel,
  pixelToGrid,
  Ant,
  generateMaze // Import the new function
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
    if (Array.isArray(arg1)) {
        // Handle random(array) -> return random element
        if (arg1.length === 0) return undefined;
        const index = Math.floor(Math.random() * arg1.length);
        return arg1[index];
    } else if (arg1 === undefined) {
        // Handle random() -> return float 0..1
        return Math.random();
    } else if (arg2 === undefined) {
        // Handle random(max) -> return float 0..max
        return Math.random() * arg1;
    } else {
        // Handle random(min, max) -> return float min..max
        return Math.random() * (arg2 - arg1) + arg1;
    }
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

// New describe block for Initialization and Update functions
describe("Initialization and Update Functions", () => {
  // Import functions needed within this block if not already top-level
  const { createPredefinedMaze, updatePheromones, spawnInitialAnts, spawnNewAnts } = sketch;

  beforeEach(() => {
    // Reset config to defaults or known state before each test
    simulationConfig.GRID_COLS = 10;
    simulationConfig.GRID_ROWS = 8;
    simulationConfig.CELL_SIZE = 10;
    simulationConfig.maze = createGrid(10, 8, 0);
    simulationConfig.explorePheromones = createGrid(10, 8, 0);
    simulationConfig.returnPheromones = createGrid(10, 8, 0);
    simulationConfig.EVAPORATION_RATE = 0.1; // Use a simple rate for testing
    simulationConfig.NUM_ANTS = 50; // Smaller number for testing spawns
    simulationConfig.SPAWN_INTERVAL = 100;
    simulationConfig.colonyPos = { x: 1, y: 1 };
    simulationConfig.ants = [];
    simulationConfig.lastAntSpawnTime = 0;

    // Mock p5 functions needed by these specific tests
    global.millis = jest.fn().mockReturnValue(0); // Default mock for millis
  });

  test("createPredefinedMaze sets up walls in simulationConfig.maze", () => {
    // Override dimensions for a clearer check
    simulationConfig.GRID_COLS = 5;
    simulationConfig.GRID_ROWS = 4;
    createPredefinedMaze();

    const maze = simulationConfig.maze;
    expect(maze.length).toBe(5);
    expect(maze[0].length).toBe(4);
    // Check corners (should be walls)
    expect(maze[0][0]).toBe(1);
    expect(maze[4][0]).toBe(1);
    expect(maze[0][3]).toBe(1);
    expect(maze[4][3]).toBe(1);
    // Check a point on the outer wall
    expect(maze[2][0]).toBe(1);
    expect(maze[0][2]).toBe(1);
    // Check colony/food start points (should be clear)
    expect(maze[1][1]).toBe(0);
    expect(maze[3][2]).toBe(0); // GRID_COLS - 2, GRID_ROWS - 2
    // Check an internal point (might be wall or path depending on logic)
    // This part of the maze generation is simple, maybe less critical to test exactly
    // expect(maze[2][1]).toBe(0); // Example check for an internal path
  });

  test("updatePheromones decreases pheromone levels", () => {
    simulationConfig.explorePheromones[1][1] = 100;
    simulationConfig.returnPheromones[2][2] = 50;
    simulationConfig.explorePheromones[3][3] = 0.005; // Below threshold
    simulationConfig.EVAPORATION_RATE = 0.1; // 10% evaporation

    updatePheromones();

    expect(simulationConfig.explorePheromones[1][1]).toBeCloseTo(90); // 100 * (1 - 0.1)
    expect(simulationConfig.returnPheromones[2][2]).toBeCloseTo(45); // 50 * (1 - 0.1)
    expect(simulationConfig.explorePheromones[3][3]).toBe(0); // Clamped to 0
    expect(simulationConfig.returnPheromones[1][1]).toBe(0); // Unchanged
  });

  test("spawnInitialAnts creates NUM_ANTS / 10 ants at colony", () => {
    simulationConfig.NUM_ANTS = 60; // Expect 6 ants
    simulationConfig.colonyPos = { x: 2, y: 3 };
    const expectedAntCount = simulationConfig.NUM_ANTS / 10;
    global.millis.mockReturnValue(1234); // Set specific time

    spawnInitialAnts();

    expect(simulationConfig.ants.length).toBe(expectedAntCount);
    // Check if the first ant is roughly at the colony pixel position
    const expectedPixelPos = gridToPixel(simulationConfig.colonyPos.x, simulationConfig.colonyPos.y);
    expect(simulationConfig.ants[0].pos.x).toBeCloseTo(expectedPixelPos.x);
    expect(simulationConfig.ants[0].pos.y).toBeCloseTo(expectedPixelPos.y);
    expect(simulationConfig.lastAntSpawnTime).toBe(1234);
  });

  test("spawnNewAnts adds an ant if count is low and interval passed", () => {
    simulationConfig.NUM_ANTS = 10;
    simulationConfig.SPAWN_INTERVAL = 100;
    simulationConfig.lastAntSpawnTime = 500;
    simulationConfig.ants = new Array(5); // Start with 5 ants
    global.millis.mockReturnValue(650); // Current time (150ms passed > 100ms interval)

    spawnNewAnts();

    expect(simulationConfig.ants.length).toBe(6);
    expect(simulationConfig.lastAntSpawnTime).toBe(650); // Should update spawn time
  });

  test("spawnNewAnts does not add ant if count is max", () => {
    simulationConfig.NUM_ANTS = 10;
    simulationConfig.SPAWN_INTERVAL = 100;
    simulationConfig.lastAntSpawnTime = 500;
    simulationConfig.ants = new Array(10); // Start with max ants
    global.millis.mockReturnValue(650); // Interval passed, but count is max

    spawnNewAnts();

    expect(simulationConfig.ants.length).toBe(10);
    expect(simulationConfig.lastAntSpawnTime).toBe(500); // Should NOT update spawn time
  });

    test("spawnNewAnts does not add ant if interval has not passed", () => {
    simulationConfig.NUM_ANTS = 10;
    simulationConfig.SPAWN_INTERVAL = 100;
    simulationConfig.lastAntSpawnTime = 500;
    simulationConfig.ants = new Array(5); // Start with 5 ants
    global.millis.mockReturnValue(550); // Current time (only 50ms passed < 100ms interval)

    spawnNewAnts();

    expect(simulationConfig.ants.length).toBe(5);
    expect(simulationConfig.lastAntSpawnTime).toBe(500); // Should NOT update spawn time
  });

});

// New describe block for Maze Generation
describe("Maze Generation", () => {
  test("generateMaze returns correct structure", () => {
    const result = generateMaze(10, 8); // Example dimensions
    expect(result).toHaveProperty('grid');
    expect(result).toHaveProperty('finalCols');
    expect(result).toHaveProperty('finalRows');
    expect(Array.isArray(result.grid)).toBe(true);
    expect(typeof result.finalCols).toBe('number');
    expect(typeof result.finalRows).toBe('number');
  });

  test("generateMaze returns odd dimensions >= 3", () => {
    const result1 = generateMaze(10, 8); // Even inputs
    expect(result1.finalCols % 2).toBe(1);
    expect(result1.finalRows % 2).toBe(1);
    expect(result1.finalCols).toBeGreaterThanOrEqual(3);
    expect(result1.finalRows).toBeGreaterThanOrEqual(3);
    expect(result1.finalCols).toBe(9); // 10 -> 9
    expect(result1.finalRows).toBe(7); // 8 -> 7

    const result2 = generateMaze(11, 9); // Odd inputs
    expect(result2.finalCols).toBe(11);
    expect(result2.finalRows).toBe(9);

    const result3 = generateMaze(2, 2); // Small inputs
    expect(result3.finalCols).toBe(3);
    expect(result3.finalRows).toBe(3);
  });

  test("generateMaze grid dimensions match final dimensions", () => {
    const result = generateMaze(15, 13);
    expect(result.grid.length).toBe(result.finalCols);
    expect(result.grid[0].length).toBe(result.finalRows);
  });

  test("generateMaze has wall borders", () => {
    const result = generateMaze(7, 5);
    const { grid, finalCols, finalRows } = result;
    // Check top/bottom borders
    for (let i = 0; i < finalCols; i++) {
      expect(grid[i][0]).toBe(1);
      expect(grid[i][finalRows - 1]).toBe(1);
    }
    // Check left/right borders
    for (let j = 0; j < finalRows; j++) {
      expect(grid[0][j]).toBe(1);
      expect(grid[finalCols - 1][j]).toBe(1);
    }
  });

  test("generateMaze ensures start/end points are paths", () => {
    const result = generateMaze(9, 9);
    const { grid, finalCols, finalRows } = result;
    expect(grid[1][1]).toBe(0); // Start point
    expect(grid[finalCols - 2][finalRows - 2]).toBe(0); // End point
  });

  test("generateMaze contains both paths and walls", () => {
    const result = generateMaze(11, 11);
    const { grid, finalCols, finalRows } = result;
    let hasPath = false;
    let hasWall = false;
    for (let i = 0; i < finalCols; i++) {
      for (let j = 0; j < finalRows; j++) {
        if (grid[i][j] === 0) hasPath = true;
        if (grid[i][j] === 1) hasWall = true;
      }
    }
    expect(hasPath).toBe(true);
    expect(hasWall).toBe(true);
  });

  // Optional: More advanced test - check connectivity (requires pathfinding)
  // test("generateMaze creates a connected maze", () => { ... });
});
