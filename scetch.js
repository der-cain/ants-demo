// --- Simulation Parameters ---
let NUM_ANTS = 2500;
let ANT_SPEED = 1; // Grid cells per update step (can be fractional)
let EVAPORATION_RATE = 0.005; // Pheromone decay per frame (multiplicative)
let DEPOSITION_RATE_EXPLORE = 15; // Amount deposited by searching ants
let DEPOSITION_RATE_RETURN = 15; // Amount deposited by returning ants
let PHEROMONE_MAX = 255; // Max strength for visualization mapping
let PHEROMONE_DURATION = 2200; // Max "charge" in frames/updates for depositing return pheromone
let SENSE_RADIUS = 5; // How many cells away ants can sense pheromones (1 = immediate neighbors)
let GOAL_SENSE_RADIUS = 5;
let SENSE_ANGLE = Math.PI / 2.5; // Field of view for sensing (~72 degrees)
let TURN_ANGLE = Math.PI / 6; // How much an ant can turn per step (~30 degrees)
let FOLLOW_STRENGTH_WEIGHT = 5; // How strongly ants follow pheromones vs random walk
let RANDOM_TURN_CHANCE = 0.1; // Chance to make a random turn even when following
let FOOD_DETECTION_RADIUS = 1; // How close ants need to be to detect food (grid cells)
let COLONY_DETECTION_RADIUS = 1; // How close ants need to be to detect food (grid cells)
let ANT_HISTORY_LENGTH = 20; // How many steps an ant remembers to avoid loops

// --- Maze and Grid Settings ---
let GRID_COLS = 50;
let GRID_ROWS = 40;
let CELL_SIZE; // Calculated in setup
let maze = []; // 0 = path, 1 = wall

// --- Pheromone Grids ---
let explorePheromones; // Deposited when searching
let returnPheromones; // Deposited when returning with food

// --- Simulation Objects ---
let ants = [];
let colonyPos;
let foodPos;
let foodFoundCount = 0;

// --- Colors ---
let COLOR_BACKGROUND;
let COLOR_WALL;
let COLOR_PATH;
let COLOR_COLONY;
let COLOR_FOOD;
let COLOR_ANT_SEARCH;
let COLOR_ANT_RETURN;
let COLOR_PHEROMONE_EXPLORE;
let COLOR_PHEROMONE_RETURN;

// --- Performance ---
let lastAntSpawnTime = 0;
let SPAWN_INTERVAL = 100; // Milliseconds between spawning new ants (if below NUM_ANTS)

// ==================================
//         p5.js Functions
// ==================================

function setup() {
  // Calculate cell size based on window dimensions
  let aspectRatio = GRID_COLS / GRID_ROWS;
  let canvasWidth = windowWidth * 0.9;
  let canvasHeight = windowHeight * 0.9;
  if (canvasWidth / canvasHeight > aspectRatio) {
    canvasHeight = windowHeight * 0.9;
    canvasWidth = canvasHeight * aspectRatio;
  } else {
    canvasWidth = windowWidth * 0.9;
    canvasHeight = canvasWidth / aspectRatio;
  }
  CELL_SIZE = floor(canvasWidth / GRID_COLS);
  canvasWidth = CELL_SIZE * GRID_COLS; // Adjust canvas size to fit grid perfectly
  canvasHeight = CELL_SIZE * GRID_ROWS;

  createCanvas(canvasWidth, canvasHeight);
  pixelDensity(1); // Ensure consistent pixel mapping

  // Initialize Colors
  COLOR_BACKGROUND = color(51);
  COLOR_WALL = color(0);
  COLOR_PATH = color(70);
  COLOR_COLONY = color(0, 0, 255, 200); // Blue
  COLOR_FOOD = color(255, 0, 0, 200); // Red
  COLOR_ANT_SEARCH = color(0, 255, 0, 220); // Bright Green
  COLOR_ANT_RETURN = color(255, 255, 0, 220); // Yellow
  COLOR_PHEROMONE_EXPLORE = color(0, 150, 255, 180); // Light Blue
  COLOR_PHEROMONE_RETURN = color(255, 100, 0, 180); // Orange

  // Initialize Maze (using predefined demo maze)
  createPredefinedMaze();

  // Initialize Pheromone Grids
  explorePheromones = createGrid(GRID_COLS, GRID_ROWS, 0);
  returnPheromones = createGrid(GRID_COLS, GRID_ROWS, 0);

  // Set Colony and Food Positions (ensure they are on paths)
  colonyPos = findValidPosition(1, 1); // Try top-left
  foodPos = findValidPosition(GRID_COLS - 2, GRID_ROWS - 2); // Try bottom-right

  if (!colonyPos || !foodPos) {
    console.error("Could not place colony or food on a valid path!");
    noLoop(); // Stop simulation if placement fails
    return;
  }
  console.log(`Colony at: ${colonyPos.x}, ${colonyPos.y}`);
  console.log(`Food at: ${foodPos.x}, ${foodPos.y}`);

  // Initialize Ants at the Colony
  spawnInitialAnts();

  // Set frame rate for smoother animation if needed
  // frameRate(30);
}

function draw() {
  background(COLOR_BACKGROUND);

  updatePheromones();
  drawPheromones();
  drawMaze();
  drawColony();
  drawFood();
  updateAndDrawAnts();
  spawnNewAnts();

  // Display Info (Optional - drawn on canvas as no HTML allowed)
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Ants: ${ants.length}`, 10, 10);
  text(`Food Found: ${foodFoundCount}`, 10, 30);
  //text(`Frame Rate: ${nf(frameRate(), 2, 1)}`, 10, 50);
}

// ==================================
//      Initialization Functions
// ==================================

function createGrid(cols, rows, defaultValue = 0) {
  let grid = new Array(cols);
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      grid[i][j] = defaultValue;
    }
  }
  return grid;
}

// Creates a simple predefined maze for the demo
function createPredefinedMaze() {
  maze = createGrid(GRID_COLS, GRID_ROWS, 0); // Start with all paths

  // Outer walls
  for (let i = 0; i < GRID_COLS; i++) {
    maze[i][0] = 1;
    maze[i][GRID_ROWS - 1] = 1;
  }
  for (let j = 0; j < GRID_ROWS; j++) {
    maze[0][j] = 1;
    maze[GRID_COLS - 1][j] = 1;
  }

  // Simple internal walls to create a basic maze structure
  for (let i = 5; i < GRID_COLS - 5; i++) {
    if (i % 8 < 4) {
      // Create gaps
      maze[i][floor(GRID_ROWS * 0.3)] = 1;
    }
  }
  for (let i = 5; i < GRID_COLS - 5; i++) {
    if ((i + 4) % 8 < 4) {
      // Create gaps offset from the first wall
      maze[i][floor(GRID_ROWS * 0.7)] = 1;
    }
  }
  for (let j = 5; j < GRID_ROWS - 5; j++) {
    if (j % 6 < 3 && j < floor(GRID_ROWS * 0.7) - 2) {
      maze[floor(GRID_COLS * 0.5)][j] = 1;
    }
  }

  // Ensure start/end areas are clear initially (though findValidPosition should handle it)
  maze[1][1] = 0;
  maze[GRID_COLS - 2][GRID_ROWS - 2] = 0;
}

// Finds the nearest valid (non-wall) grid cell to a target
function findValidPosition(targetX, targetY) {
  targetX = constrain(targetX, 0, GRID_COLS - 1);
  targetY = constrain(targetY, 0, GRID_ROWS - 1);

  if (maze[targetX][targetY] === 0) return createVector(targetX, targetY);

  // Spiral search outwards if the target is a wall
  for (let radius = 1; radius < max(GRID_COLS, GRID_ROWS); radius++) {
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        // Only check the perimeter of the current radius square
        if (abs(i) !== radius && abs(j) !== radius) continue;

        let checkX = targetX + i;
        let checkY = targetY + j;

        if (isValidGridPos(checkX, checkY) && maze[checkX][checkY] === 0) {
          return createVector(checkX, checkY);
        }
      }
    }
  }
  return null; // Should not happen in a reasonable maze
}

function spawnInitialAnts() {
  ants = [];
  for (let i = 0; i < NUM_ANTS; i++) {
    ants.push(new Ant(colonyPos.x, colonyPos.y));
  }
  lastAntSpawnTime = millis();
}

function spawnNewAnts() {
  let now = millis();
  if (ants.length < NUM_ANTS && now - lastAntSpawnTime > SPAWN_INTERVAL) {
    ants.push(new Ant(colonyPos.x, colonyPos.y));
    lastAntSpawnTime = now;
  }
}

// ==================================
//      Drawing Functions
// ==================================

function drawMaze() {
  noStroke();
  for (let i = 0; i < GRID_COLS; i++) {
    for (let j = 0; j < GRID_ROWS; j++) {
      if (maze[i][j] === 1) {
        fill(COLOR_WALL);
        rect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      } else {
        // Optionally draw path cells if different from background
        // fill(COLOR_PATH);
        // rect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawPheromones() {
  noStroke();
  for (let i = 0; i < GRID_COLS; i++) {
    for (let j = 0; j < GRID_ROWS; j++) {
      // Draw Explore Pheromones (Blueish)
      if (explorePheromones[i][j] > 0.1) {
        // Threshold to avoid drawing tiny amounts
        let alpha = map(explorePheromones[i][j], 0, PHEROMONE_MAX, 0, 255);
        fill(
          red(COLOR_PHEROMONE_EXPLORE),
          green(COLOR_PHEROMONE_EXPLORE),
          blue(COLOR_PHEROMONE_EXPLORE),
          alpha
        );
        rect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
      // Draw Return Pheromones (Orangeish) - Overlay
      if (returnPheromones[i][j] > 0.1) {
        let alpha = map(returnPheromones[i][j], 0, PHEROMONE_MAX, 0, 255);
        fill(
          red(COLOR_PHEROMONE_RETURN),
          green(COLOR_PHEROMONE_RETURN),
          blue(COLOR_PHEROMONE_RETURN),
          alpha
        );
        rect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
}

function drawColony() {
  fill(COLOR_COLONY);
  noStroke();
  ellipse(
    (colonyPos.x + 0.5) * CELL_SIZE,
    (colonyPos.y + 0.5) * CELL_SIZE,
    CELL_SIZE * 1.5,
    CELL_SIZE * 1.5
  );
}

function drawFood() {
  fill(COLOR_FOOD);
  noStroke();
  ellipse(
    (foodPos.x + 0.5) * CELL_SIZE,
    (foodPos.y + 0.5) * CELL_SIZE,
    CELL_SIZE * 1.5,
    CELL_SIZE * 1.5
  );
}

function updateAndDrawAnts() {
  for (let i = ants.length - 1; i >= 0; i--) {
    // Iterate backwards for safe removal
    ants[i].update();
    ants[i].display();
    // Optional: Remove ants that get stuck or lost for too long?
  }
}

// ==================================
//      Simulation Update Functions
// ==================================

function updatePheromones() {
  for (let i = 0; i < GRID_COLS; i++) {
    for (let j = 0; j < GRID_ROWS; j++) {
      // Evaporation (Multiplicative decay)
      explorePheromones[i][j] *= 1.0 - EVAPORATION_RATE;
      returnPheromones[i][j] *= 1.0 - EVAPORATION_RATE;

      // Clamp to zero if very small to prevent floating point issues
      if (explorePheromones[i][j] < 0.01) explorePheromones[i][j] = 0;
      if (returnPheromones[i][j] < 0.01) returnPheromones[i][j] = 0;

      // --- Diffusion (Optional - can be computationally expensive) ---
      // Simple diffusion: average with neighbors (causes blurring)
      /*
      if (diffusionRate > 0 && (explorePheromones[i][j] > 0 || returnPheromones[i][j] > 0)) {
          diffuseCell(explorePheromones, i, j, diffusionRate);
          diffuseCell(returnPheromones, i, j, diffusionRate);
      }
      */
    }
  }
  // --- Diffusion (More Correct Implementation - requires temporary grid) ---
  /*
    if (diffusionRate > 0) {
        let nextExplore = createGrid(GRID_COLS, GRID_ROWS, 0);
        let nextReturn = createGrid(GRID_COLS, GRID_ROWS, 0);
        applyDiffusion(explorePheromones, nextExplore, diffusionRate);
        applyDiffusion(returnPheromones, nextReturn, diffusionRate);
        explorePheromones = nextExplore;
        returnPheromones = nextReturn;
    }
    */
}

// --- Diffusion Helper Functions (Example - uncomment if needed) ---
/*
function applyDiffusion(currentGrid, nextGrid, rate) {
    for (let i = 1; i < GRID_COLS - 1; i++) {
        for (let j = 1; j < GRID_ROWS - 1; j++) {
            if (maze[i][j] === 1) continue; // Don't diffuse into walls

            let sum = 0;
            let count = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (maze[i + dx][j + dy] === 0) { // Only diffuse from/to path cells
                       sum += currentGrid[i + dx][j + dy];
                       count++;
                    }
                }
            }
             // Simple box blur type diffusion
             // let diffusedValue = currentGrid[i][j] * (1 - rate) + (sum / count) * rate;

            // More physically based (Laplacian) - distribute fraction to neighbors
            let currentValue = currentGrid[i][j];
            let distributedAmount = currentValue * rate;
            let amountToNeighbors = distributedAmount / 8; // Assuming 8 neighbors involved (can refine)

            nextGrid[i][j] += currentValue * (1 - rate); // Keep most of its value

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let ni = i + dx;
                    let nj = j + dy;
                    if (isValidGridPos(ni, nj) && maze[ni][nj] === 0) {
                        nextGrid[ni][nj] += amountToNeighbors; // Add diffused amount to neighbors
                    } else {
                         nextGrid[i][j] += amountToNeighbors; // Reflect back if neighbor is wall/boundary
                    }
                }
            }
            nextGrid[i][j] = min(nextGrid[i][j], PHEROMONE_MAX); // Clamp
        }
    }
     // Handle boundaries separately if needed, or just ignore diffusion there
}
*/

// ==================================
//      Utility Functions
// ==================================

function isValidGridPos(x, y) {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

function gridToPixel(gridX, gridY) {
  return createVector((gridX + 0.5) * CELL_SIZE, (gridY + 0.5) * CELL_SIZE);
}

function pixelToGrid(pixelX, pixelY) {
  return createVector(floor(pixelX / CELL_SIZE), floor(pixelY / CELL_SIZE));
}

// ==================================
//          Ant Class
// ==================================
class Ant {
  constructor(gridX, gridY) {
    this.pos = gridToPixel(gridX, gridY); // Position in pixels
    this.vel = p5.Vector.random2D().mult(ANT_SPEED); // Velocity vector
    this.state = "searching"; // 'searching' or 'returning'
    this.gridPos = createVector(gridX, gridY); // Current grid cell
    this.history = []; // Store recent grid positions {x: col, y: row}
    this.charge = PHEROMONE_DURATION; // Initialize charge to 0 (not returning)
  }

  update() {
    this.updateGridPos();
    this.checkEnvironment();

    this.charge = max(0, this.charge - 1); // Decrement, floor at 0
    
    this.move();
    this.depositPheromone();
    this.addToHistory();
  }

  updateGridPos() {
    let currentGrid = pixelToGrid(this.pos.x, this.pos.y);
    this.gridPos.x = constrain(currentGrid.x, 0, GRID_COLS - 1);
    this.gridPos.y = constrain(currentGrid.y, 0, GRID_ROWS - 1);
  }

  addToHistory() {
    // Only add if grid position changed
    if (
      this.history.length === 0 ||
      this.history[this.history.length - 1].x !== this.gridPos.x ||
      this.history[this.history.length - 1].y !== this.gridPos.y
    ) {
      this.history.push({ x: this.gridPos.x, y: this.gridPos.y });
      if (this.history.length > ANT_HISTORY_LENGTH) {
        this.history.shift(); // Remove oldest entry
      }
    }
  }

  wasRecentlyVisited(gridX, gridY) {
    for (let i = 0; i < this.history.length - 1; i++) {
      // -1 to allow returning to previous step
      if (this.history[i].x === gridX && this.history[i].y === gridY) {
        return true;
      }
    }
    return false;
  }

  checkEnvironment() {
    if (this.state === "searching") {
      // Check for food
      let distToFood = dist(
        this.gridPos.x,
        this.gridPos.y,
        foodPos.x,
        foodPos.y
      );
      if (distToFood <= FOOD_DETECTION_RADIUS) {
        this.state = "returning";
        // Reverse direction roughly
        this.vel.mult(-1);
        this.charge = PHEROMONE_DURATION; // *** Set max charge ***
        // console.log("Ant found food!");
      }
    } else {
      // 'returning' state
      // Check for colony
      let distToColony = dist(
        this.gridPos.x,
        this.gridPos.y,
        colonyPos.x,
        colonyPos.y
      );
      if (distToColony <= COLONY_DETECTION_RADIUS) {
        // Reached colony
        this.state = "searching";
        // Random new direction
        this.vel = p5.Vector.random2D().mult(ANT_SPEED);
        this.charge = PHEROMONE_DURATION; // *** Set max charge ***
        foodFoundCount++;
        // console.log("Ant returned to colony!");
        // Optional: Reset history on return?
        // this.history = [];
      }
    }
  }

  move() {
    let desiredAngle = this.senseAndDecideAngle();

    // Smoothly steer towards the desired angle
    let desiredVel = p5.Vector.fromAngle(desiredAngle);
    let currentAngle = this.vel.heading();

    let angleDiff = desiredAngle - currentAngle;
    // Handle angle wrapping
    while (angleDiff > PI) angleDiff -= TWO_PI;
    while (angleDiff < -PI) angleDiff += TWO_PI;

    // Limit turning rate
    let turn = constrain(angleDiff, -TURN_ANGLE, TURN_ANGLE);
    let newAngle = currentAngle + turn;

    // Add a small chance of random turning
    if (random(1) < RANDOM_TURN_CHANCE) {
      newAngle += random(-TURN_ANGLE * 0.5, TURN_ANGLE * 0.5);
    }

    this.vel = p5.Vector.fromAngle(newAngle).mult(ANT_SPEED);

    // --- Collision Detection and Response ---
    let nextPos = p5.Vector.add(this.pos, this.vel);
    let nextGrid = pixelToGrid(nextPos.x, nextPos.y);

    if (
      isValidGridPos(nextGrid.x, nextGrid.y) &&
      maze[nextGrid.x][nextGrid.y] != 1
    ) {
      // Update position
      this.pos = nextPos;
    } else {
      this.vel = p5.Vector.random2D().mult(ANT_SPEED);
    }

    // Keep ants within bounds (safety net)
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  senseAndDecideAngle() {
    // Determine current target grid position based on state
    let targetGridPos = (this.state === 'searching') ? foodPos : colonyPos;

    // Calculate distance to target (using grid coordinates)
    let distToTarget = dist(this.gridPos.x, this.gridPos.y, targetGridPos.x, targetGridPos.y);

    // Check if target is within direct sense range
    if (distToTarget <= GOAL_SENSE_RADIUS) {
        // Target is close! Override other behaviors.
        let targetPixelPos = gridToPixel(targetGridPos.x, targetGridPos.y);
        // Calculate direct angle from current pixel position to target pixel position
        let directAngle = atan2(targetPixelPos.y - this.pos.y, targetPixelPos.x - this.pos.x);
        return directAngle; // Return the direct angle immediately
    }

    let currentAngle = this.vel.heading();
    let bestAngle = currentAngle; // Default to current direction
    let maxPheromone = -1;

    // Define the pheromone grid to follow based on state
    let targetPheromones =
      this.state === "searching" ? returnPheromones : explorePheromones;
    // When searching, follow 'return' trails (lead to food).
    // When returning, follow 'explore' trails (lead back to colony).

    // Check multiple points in front of the ant
    for (
      let angleOffset = -SENSE_ANGLE / 2;
      angleOffset <= SENSE_ANGLE / 2;
      angleOffset += SENSE_ANGLE / 4
    ) {
      // Check 5 points
      let checkAngle = currentAngle + angleOffset;
      let senseVec = p5.Vector.fromAngle(checkAngle);

      // Check multiple distances along the sense vector
      for (
        let distMultiplier = 0.5;
        distMultiplier <= 1.5;
        distMultiplier += 0.5
      ) {
        let senseDist = CELL_SIZE * SENSE_RADIUS * distMultiplier;
        let checkPos = p5.Vector.add(this.pos, senseVec.mult(senseDist));
        let checkGrid = pixelToGrid(checkPos.x, checkPos.y);

        if (
          isValidGridPos(checkGrid.x, checkGrid.y) &&
          maze[checkGrid.x][checkGrid.y] === 0 &&
          !this.wasRecentlyVisited(checkGrid.x, checkGrid.y)
        ) {
          let pheromoneLevel = targetPheromones[checkGrid.x][checkGrid.y];

          // Weight pheromone level heavily
          let weightedLevel = pheromoneLevel * FOLLOW_STRENGTH_WEIGHT;

          // Add a small random bias to encourage exploration
          weightedLevel += random(0, PHEROMONE_MAX * 0.1);

          if (weightedLevel > maxPheromone) {
            maxPheromone = weightedLevel;
            bestAngle = checkAngle;
          }
        }
      }
    }

    // If no pheromones detected nearby or all paths recently visited, continue somewhat straight with random wobble
    if (maxPheromone <= 0) {
      bestAngle = currentAngle + random(-TURN_ANGLE * 0.5, TURN_ANGLE * 0.5);
    }

    return bestAngle;
  }

  depositPheromone() {
    let gridX = this.gridPos.x;
    let gridY = this.gridPos.y;

    if (this.charge <= 0) {
      return;
    }

    if (isValidGridPos(gridX, gridY)) {
      // Map remaining charge (0 to DURATION) to deposition rate (0 to MAX_RETURN_RATE)
      let currentDepositionRate = map(
        this.charge,
        0,
        PHEROMONE_DURATION,
        0,
        DEPOSITION_RATE_RETURN
      );
      currentDepositionRate = max(0, currentDepositionRate); // Ensure non-negative
      if (this.state === "searching") {
        explorePheromones[gridX][gridY] += currentDepositionRate;
        explorePheromones[gridX][gridY] = min(
          explorePheromones[gridX][gridY],
          PHEROMONE_MAX
        );
      } else {
        // returning
        returnPheromones[gridX][gridY] += currentDepositionRate;
        returnPheromones[gridX][gridY] = min(
          returnPheromones[gridX][gridY],
          PHEROMONE_MAX
        );
      }
    }
  }

  display() {
    push(); // Isolate transformations and styles
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading()); // Point in the direction of velocity

    if (this.state === "searching") {
      fill(COLOR_ANT_SEARCH);
    } else {
      fill(COLOR_ANT_RETURN);
    }
    noStroke();

    // Draw ant shape (e.g., a triangle or ellipse)
    let antSize = CELL_SIZE * 0.6;
    triangle(
      antSize / 2,
      0,
      -antSize / 2,
      -antSize / 3,
      -antSize / 2,
      antSize / 3
    );
    // ellipse(0, 0, antSize, antSize * 0.6); // Alternative ellipse shape

    pop(); // Restore previous drawing state
  }
}
