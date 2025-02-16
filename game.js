// game.js

// Configuration for the Phaser game
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#f0f0f0',
  scene: [MainScene]
};

const game = new Phaser.Game(config);

// Main Scene for the game
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    // Grid settings
    this.gridSize = 64;
    this.cols = 12;
    this.rows = 9;
    // Turn and weather management
    this.currentTurn = 'Germany'; // Starting turn
    this.turnPhase = 'movement'; // Phases can be expanded: movement, combat, reinforcement
    this.weather = 'Summer'; // Weather stages: Summer, Fall, Winter
    // Game entities
    this.units = [];
    this.selectedUnit = null;
    this.fogOfWarGraphics = null;
    this.unitGraphics = null;
  }

  preload() {
    // Preload assets here if you have any (e.g., images for units or terrain)
  }

  create() {
    // Draw the game grid (using square grid for simplicity)
    this.drawGrid();

    // Initialize units on the board
    this.createUnits();

    // Create a graphics layer for the Fog of War
    this.fogOfWarGraphics = this.add.graphics();
    this.updateFogOfWar();

    // Input handler for pointer clicks
    this.input.on('pointerdown', this.handlePointerDown, this);

    // Display text to show current turn and weather
    this.turnText = this.add.text(
      10,
      10,
      `Turn: ${this.currentTurn} (${this.turnPhase}) - Weather: ${this.weather}`,
      { font: '16px Arial', fill: '#000' }
    );
  }

  // Draw a grid on the canvas
  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x000000, 1);
    for (let i = 0; i <= this.cols; i++) {
      graphics.moveTo(i * this.gridSize, 0);
      graphics.lineTo(i * this.gridSize, this.rows * this.gridSize);
    }
    for (let j = 0; j <= this.rows; j++) {
      graphics.moveTo(0, j * this.gridSize);
      graphics.lineTo(this.cols * this.gridSize, j * this.gridSize);
    }
    graphics.strokePath();
  }

  // Create sample units for each team
  createUnits() {
    // Germany unit (e.g., Panzer)
    this.units.push({
      id: 'g1',
      team: 'Germany',
      type: 'Panzer',
      x: 1,
      y: 1,
      health: 100,
      range: 2 // Vision range for Fog of War
    });
    // Russia unit (e.g., T-34)
    this.units.push({
      id: 'r1',
      team: 'Russia',
      type: 'T-34',
      x: this.cols - 2,
      y: this.rows - 2,
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

    // If a unit is selected, check if the clicked cell is within movement range
    if (this.selectedUnit) {
      const distance = Math.abs(this.selectedUnit.x - gridX) + Math.abs(this.selectedUnit.y - gridY);
      if (distance <= 1) { // Allow movement by 1 cell
        // Ensure the destination is not occupied
        const occupied = this.units.some(u => u.x === gridX && u.y === gridY);
        if (!occupied) {
          // Move the unit
          this.selectedUnit.x = gridX;
          this.selectedUnit.y = gridY;
          console.log(`Moved unit ${this.selectedUnit.id} to (${gridX}, ${gridY})`);

          // Check for enemy unit adjacent to the moved unit and trigger combat if found
          let enemy = this.units.find(
            (u) =>
              u.team !== this.selectedUnit.team &&
              Math.abs(u.x - gridX) + Math.abs(u.y - gridY) === 1
          );
          if (enemy) {
            this.handleCombat(this.selectedUnit, enemy);
          }

          // Update fog of war visibility after movement
          this.updateFogOfWar();
          // End the turn after movement and any combat
          this.endTurn();
        }
      }
    }
  }

  // Handle basic combat between two units
  handleCombat(attacker, defender) {
    console.log(`Combat: ${attacker.id} attacks ${defender.id}`);
    let baseDamage = 30;
    // Example weather effect: in Winter, German units suffer attrition damage
    if (this.weather === 'Winter' && attacker.team === 'Germany') {
      baseDamage -= 10;
    }
    defender.health -= baseDamage;
    console.log(`${defender.id} health is now ${defender.health}`);
    if (defender.health <= 0) {
      console.log(`${defender.id} has been destroyed!`);
      // Remove the destroyed unit
      this.units = this.units.filter(u => u.id !== defender.id);
    }
  }

  // Update the Fog of War layer based on the current player's units
  updateFogOfWar() {
    // Clear previous fog
    this.fogOfWarGraphics.clear();
    // Loop through each cell in the grid
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let visible = false;
        // Check if any unit from the current team can see the cell
        this.units
          .filter(u => u.team === this.currentTurn)
          .forEach(unit => {
            const dist = Math.abs(unit.x - i) + Math.abs(unit.y - j);
            if (dist <= unit.range) {
              visible = true;
            }
          });
        // Cover non-visible cells with a semi-transparent overlay
        if (!visible) {
          this.fogOfWarGraphics.fillStyle(0x000000, 0.5);
          this.fogOfWarGraphics.fillRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
        }
      }
    }
    // Redraw units on top of the fog
    this.drawUnits();
  }

  // Draw units on the grid (simple circles to represent units)
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
    });
  }

  // End the turn and update game state
  endTurn() {
    // Toggle turn between Germany and Russia
    this.currentTurn = (this.currentTurn === 'Germany') ? 'Russia' : 'Germany';
    // Update weather every full round (when turn switches back to Germany)
    if (this.currentTurn === 'Germany') {
      if (this.weather === 'Summer') {
        this.weather = 'Fall';
      } else if (this.weather === 'Fall') {
        this.weather = 'Winter';
      } else {
        this.weather = 'Summer';
      }
    }
    // Reset selected unit for the next turn
    this.selectedUnit = null;
    this.turnText.setText(`Turn: ${this.currentTurn} (${this.turnPhase}) - Weather: ${this.weather}`);
  }

  update(time, delta) {
    // Game loop update (if needed for animations or AI)
  }
}
