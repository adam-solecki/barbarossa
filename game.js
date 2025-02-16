// game.js

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: 1280,  // 20 columns * 64 pixels
  height: 960,  // 15 rows * 64 pixels
  backgroundColor: '#e0e0e0', // Light gray background
  parent: 'game-container',   // Attach the canvas to our div container
  scene: [MainScene]
};

const game = new Phaser.Game(config);

// Main game scene
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    // Large map grid settings
    this.gridSize = 64;
    this.cols = 20;
    this.rows = 15;
    // Regions on the Eastern Front (adjust positions as needed)
    this.regions = [
      { name: "Leningrad", x: 2, y: 1 },
      { name: "Moscow", x: 10, y: 8 },
      { name: "Stalingrad", x: 12, y: 12 },
      { name: "Kiev", x: 6, y: 5 },
      { name: "Smolensk", x: 8, y: 4 },
      { name: "Sevastopol", x: 16, y: 10 }
    ];
    // Turn and weather management
    this.currentTurn = 'Germany';
    this.turnPhase = 'movement';
    this.weather = 'Summer';
    // Game entities (units, etc.)
    this.units = [];
    this.selectedUnit = null;
    this.fogOfWarGraphics = null;
    this.unitGraphics = null;
  }

  preload() {
    // Preload assets if needed
  }

  create() {
    // Draw the grid and region labels
    this.drawGrid();
    this.drawRegions();

    // Initialize units on the board (positions should be adjusted to the larger map)
    this.createUnits();

    // Create a graphics layer for Fog of War
    this.fogOfWarGraphics = this.add.graphics();
    this.drawUnits();
    this.updateFogOfWar();

    // Input handler for pointer clicks
    this.input.on('pointerdown', this.handlePointerDown, this);

    // Update the status text on the info panel
    this.updateStatusText();
  }

  // Draw the grid on the canvas
  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x333333, 1);
    // Draw vertical lines
    for (let i = 0; i <= this.cols; i++) {
      graphics.moveTo(i * this.gridSize, 0);
      graphics.lineTo(i * this.gridSize, this.rows * this.gridSize);
    }
    // Draw horizontal lines
    for (let j = 0; j <= this.rows; j++) {
      graphics.moveTo(0, j * this.gridSize);
      graphics.lineTo(this.cols * this.gridSize, j * this.gridSize);
    }
    graphics.strokePath();
  }

  // Draw region labels on the map
  drawRegions() {
    this.regions.forEach(region => {
      // Position the label with some padding inside the cell
      this.add.text(
        region.x * this.gridSize + 5, 
        region.y * this.gridSize + 5, 
        region.name, 
        { font: "14px Arial", fill: "#000" }
      );
    });
  }

  // Create sample units on the board
  createUnits() {
    // Germany unit (e.g., Panzer)
    this.units.push({
      id: 'g1',
      team: 'Germany',
      type: 'Panzer',
      x: 3,
      y: 2,
      health: 100,
      range: 2
    });
    // Russia unit (e.g., T-34)
    this.units.push({
      id: 'r1',
      team: 'Russia',
      type: 'T-34',
      x: this.cols - 4,
      y: this.rows - 3,
      health: 100,
      range: 2
    });
  }

  // Handle mouse/pointer clicks on the grid
  handlePointerDown(pointer) {
    const gridX = Math.floor(pointer.x / this.gridSize);
    const gridY = Math.floor(pointer.y / this.gridSize);

    // Check if a unit of the current team was clicked for selection
    let clickedUnit = this.units.find(
      (u) => u.x === gridX && u.y === gridY && u.team === this.currentTurn
    );
    if (clickedUnit) {
      this.selectedUnit = clickedUnit;
      console.log(`Selected unit: ${clickedUnit.id}`);
      return;
    }

    // If a unit is selected, attempt movement
    if (this.selectedUnit) {
      const distance = Math.abs(this.selectedUnit.x - gridX) + Math.abs(this.selectedUnit.y - gridY);
      if (distance <= 1) { // Allow movement by 1 cell
        const occupied = this.units.some(u => u.x === gridX && u.y === gridY);
        if (!occupied) {
          this.selectedUnit.x = gridX;
          this.selectedUnit.y = gridY;
          console.log(`Moved unit ${this.selectedUnit.id} to (${gridX}, ${gridY})`);

          // Check for adjacent enemy for combat
          let enemy = this.units.find(
            (u) =>
              u.team !== this.selectedUnit.team &&
              Math.abs(u.x - gridX) + Math.abs(u.y - gridY) === 1
          );
          if (enemy) {
            this.handleCombat(this.selectedUnit, enemy);
          }

          this.drawUnits();
          this.updateFogOfWar();
          this.endTurn();
          this.updateStatusText();
        }
      }
    }
  }

  // Handle basic combat between two units
  handleCombat(attacker, defender) {
    console.log(`Combat: ${attacker.id} attacks ${defender.id}`);
    let baseDamage = 30;
    if (this.weather === 'Winter' && attacker.team === 'Germany') {
      baseDamage -= 10;
    }
    defender.health -= baseDamage;
    console.log(`${defender.id} health: ${defender.health}`);
    if (defender.health <= 0) {
      console.log(`${defender.id} destroyed`);
      this.units = this.units.filter(u => u.id !== defender.id);
    }
  }

  // Update Fog of War based on current team's units
  updateFogOfWar() {
    this.fogOfWarGraphics.clear();
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let visible = false;
        this.units.filter(u => u.team === this.currentTurn).forEach(unit => {
          const dist = Math.abs(unit.x - i) + Math.abs(unit.y - j);
          if (dist <= unit.range) {
            visible = true;
          }
        });
        if (!visible) {
          this.fogOfWarGraphics.fillStyle(0x000000, 0.5);
          this.fogOfWarGraphics.fillRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
        }
      }
    }
  }

  // Draw units on the grid
  drawUnits() {
    if (this.unitGraphics) {
      this.unitGraphics.clear();
    } else {
      this.unitGraphics = this.add.graphics();
    }
    this.units.forEach(unit => {
      const color = (unit.team === 'Germany') ? 0xff0000 : 0x0000ff;
      this.unitGraphics.fillStyle(color, 1);
      this.unitGraphics.fillCircle(
        unit.x * this.gridSize + this.gridSize / 2,
        unit.y * this.gridSize + this.gridSize / 2,
        this.gridSize / 3
      );
      this.unitGraphics.lineStyle(1, 0xffffff);
      this.unitGraphics.strokeCircle(
        unit.x * this.gridSize + this.gridSize / 2,
        unit.y * this.gridSize + this.gridSize / 2,
        this.gridSize / 3
      );
    });
  }

  // End turn and update state
  endTurn() {
    this.currentTurn = (this.currentTurn === 'Germany') ? 'Russia' : 'Germany';
    if (this.currentTurn === 'Germany') {
      if (this.weather === 'Summer') {
        this.weather = 'Fall';
      } else if (this.weather === 'Fall') {
        this.weather = 'Winter';
      } else {
        this.weather = 'Summer';
      }
    }
    this.selectedUnit = null;
  }

  // Update the status text in the HTML info panel
  updateStatusText() {
    const statusText = document.getElementById('status-text');
    statusText.textContent = `Turn: ${this.currentTurn} (${this.turnPhase}) - Weather: ${this.weather}`;
  }

  update(time, delta) {
    // Game loop updates if necessary
  }
}
