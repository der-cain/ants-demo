// Import the functions to be tested
const {
  createGrid,
  findValidPosition,
  isValidGridPos,
  gridToPixel,
  pixelToGrid,
} = require("../scetch.js");

// Mock p5.js functions
global.createVector = (x, y) => ({ x, y });
global.constrain = (x, min, max) => Math.min(Math.max(x, min), max);
global.floor = (x) => Math.floor(x);
global.dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

describe("Utility Functions", () => {
  test("createGrid creates a 2D array with the specified dimensions and default value", () => {
    const grid = createGrid(3, 4, 0);
    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(4);
    expect(grid[1][2]).toBe(0);
  });

  test("isValidGridPos returns true for valid grid positions", () => {
    global.GRID_COLS = 10;
    global.GRID_ROWS = 8;
    expect(isValidGridPos(5, 4)).toBe(true);
  });

  test("isValidGridPos returns false for invalid grid positions", () => {
    global.GRID_COLS = 10;
    global.GRID_ROWS = 8;
    expect(isValidGridPos(-1, 4)).toBe(false);
    expect(isValidGridPos(10, 4)).toBe(false);
    expect(isValidGridPos(5, -1)).toBe(false);
    expect(isValidGridPos(5, 8)).toBe(false);
  });

  test("gridToPixel converts grid coordinates to pixel coordinates", () => {
    global.CELL_SIZE = 20;
    const pixelPos = gridToPixel(2, 3);
    expect(pixelPos.x).toBe(50);
    expect(pixelPos.y).toBe(70);
  });

  test("pixelToGrid converts pixel coordinates to grid coordinates", () => {
    global.CELL_SIZE = 20;
    const gridPos = pixelToGrid(50, 70);
    expect(gridPos.x).toBe(2);
    expect(gridPos.y).toBe(3);
  });

  test("findValidPosition returns the target position if it is not a wall", () => {
    global.maze = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    global.GRID_COLS = 3;
    global.GRID_ROWS = 3;
    const validPos = findValidPosition(1, 1);
    expect(validPos.x).toBe(1);
    expect(validPos.y).toBe(1);
  });

  test("findValidPosition finds the nearest valid position if the target is a wall", () => {
    global.maze = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];
    global.GRID_COLS = 3;
    global.GRID_ROWS = 3;
    const validPos = findValidPosition(1, 1);
    expect(validPos.x).toBe(0); // or 2, depending on search order
    expect(validPos.y).toBe(1);
  });
});

describe("Ant Class", () => {
  beforeEach(() => {
    // Mock necessary p5.js functions and variables
    global.p5 = {
      Vector: {
        random2D: () => {
          const angle = Math.random() * 2 * Math.PI;
          return { 
            x: Math.cos(angle), 
            y: Math.sin(angle), 
            mult: (scalar) => ({ x: Math.cos(angle) * scalar, y: Math.sin(angle) * scalar }) 
          };
        },
        add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
        fromAngle: (angle) => ({ x: Math.cos(angle), y: Math.sin(angle), mult: (scalar) => ({ x: Math.cos(angle) * scalar, y: Math.sin(angle) * scalar }) }),
      },
    };
    global.ANT_SPEED = 1;
    global.CELL_SIZE = 10;
    global.GRID_COLS = 10;
    global.GRID_ROWS = 8;
    global.width = global.CELL_SIZE * global.GRID_COLS;
    global.height = global.CELL_SIZE * global.GRID_ROWS;
    global.PHEROMONE_DURATION = 100;
    global.DEPOSITION_RATE_RETURN = 1;
    global.explorePheromones = createGrid(global.GRID_COLS, global.GRID_ROWS, 0);
    global.returnPheromones = createGrid(global.GRID_COLS, global.GRID_ROWS, 0);
    global.isValidGridPos = (x, y) => x >= 0 && x < global.GRID_COLS && y >= 0 && y < global.GRID_ROWS;
    global.maze = createGrid(global.GRID_COLS, global.GRID_ROWS, 0);
  });

  test("Ant constructor initializes ant properties", () => {
    const Ant = require("../scetch.js").Ant;
    const ant = new Ant(2, 3);
    expect(ant.pos.x).toBe(25);
    expect(ant.pos.y).toBe(35);
    expect(ant.vel.x).toBe(1);
    expect(ant.vel.y).toBe(0);
    expect(ant.state).toBe("searching");
    expect(ant.gridPos.x).toBe(2);
    expect(ant.gridPos.y).toBe(3);
    expect(ant.history).toEqual([]);
    expect(ant.charge).toBe(100);
  });

  test("Ant update method updates ant properties", () => {
    const Ant = require("../scetch.js").Ant;
    const ant = new Ant(2, 3);
    ant.update();
    expect(ant.pos.x).toBeGreaterThan(25);
    expect(ant.pos.y).toBe(35); // Since vel.y is 0
    expect(ant.gridPos.x).toBe(3); // Since it moves right
    expect(ant.gridPos.y).toBe(3);
    expect(ant.history.length).toBe(1);
    expect(ant.charge).toBe(99);
  });

  test("Ant move method updates ant position", () => {
    const Ant = require("../scetch.js").Ant;
    const ant = new Ant(2, 3);
    ant.move();
    expect(ant.pos.x).toBeGreaterThan(25);
    expect(ant.pos.y).toBe(35); // Since vel.y is 0
  });

  test("Ant depositPheromone method deposits pheromones", () => {
    const Ant = require("../scetch.js").Ant;
    const ant = new Ant(2, 3);
    ant.depositPheromone();
    expect(global.explorePheromones[2][3]).toBeGreaterThan(0);
  });
});
