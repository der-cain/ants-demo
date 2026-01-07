
const sketch = require("../scetch.js");
const { simulationConfig, setup, drawPheromones } = sketch;

// Mock p5 functions required for setup and drawPheromones
global.createVector = (x, y) => ({ x, y });
global.floor = (x) => Math.floor(x);
global.color = (r, g, b, a) => ({ r, g, b, a }); // Mock color object
global.red = (c) => c.r;
global.green = (c) => c.g;
global.blue = (c) => c.b;
global.map = (value, start1, stop1, start2, stop2) => start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
global.constrain = (n, low, high) => Math.max(Math.min(n, high), low);
global.fill = jest.fn();
global.rect = jest.fn();
global.noStroke = jest.fn();
global.createCanvas = jest.fn();
global.pixelDensity = jest.fn();
global.windowWidth = 1000;
global.windowHeight = 1000;
global.millis = () => 0;

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

describe("drawPheromones", () => {
  test("drawPheromones uses global colors correctly", () => {
    // 1. Call setup to initialize globals inside scetch.js
    setup();

    // 2. Setup the pheromone grid so drawPheromones actually draws something.
    const cols = simulationConfig.GRID_COLS;
    const rows = simulationConfig.GRID_ROWS;

    // Reset mocks
    global.fill.mockClear();

    // Set a value in explorePheromones
    simulationConfig.explorePheromones[0][0] = 255; // Max value

    // 3. Call drawPheromones
    drawPheromones();

    // 4. Verify fill was called with the expected color from setup()
    // In setup(): COLOR_PHEROMONE_EXPLORE = color(0, 150, 255, 180);
    // map(255, 0, 255, 0, 255) -> 255 alpha
    // fill(0, 150, 255, 255)

    expect(global.fill).toHaveBeenCalledWith(0, 150, 255, 255);

    // Test return pheromone
    global.fill.mockClear();
    simulationConfig.returnPheromones[0][0] = 255;
    drawPheromones();

    // In setup(): COLOR_PHEROMONE_RETURN = color(255, 100, 0, 180);
    expect(global.fill).toHaveBeenCalledWith(255, 100, 0, 255);
  });
});
