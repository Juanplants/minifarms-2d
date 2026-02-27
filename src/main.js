import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1f2937');

    this.worldWidth = 2200;
    this.worldHeight = 1400;

    // Mundo y cámara
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setZoom(1.0);

    // Grid visual
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x374151, 1);
    for (let x = 0; x <= this.worldWidth; x += 64) grid.lineBetween(x, 0, x, this.worldHeight);
    for (let y = 0; y <= this.worldHeight; y += 64) grid.lineBetween(0, y, this.worldWidth, y);

    // Jugador
    const playerRect = this.add.rectangle(320, 240, 28, 28, 0x22d3ee);
    this.physics.add.existing(playerRect);
    this.player = playerRect;
    this.player.body.setCollideWorldBounds(true);

    // Input: flechas + WASD
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Cámara con deadzone (sin zoom dinámico)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(260, 160);

    // Obstáculos sólidos
    this.obstacles = this.physics.add.staticGroup();

    const obstacleData = [
      { x: 520, y: 360, w: 140, h: 48 },
      { x: 820, y: 520, w: 200, h: 48 },
      { x: 1180, y: 280, w: 64, h: 220 },
      { x: 1460, y: 760, w: 260, h: 64 },
      { x: 420, y: 920, w: 300, h: 48 },
      { x: 1780, y: 460, w: 64, h: 260 },
    ];

    obstacleData.forEach(({ x, y, w, h }) => {
      const block = this.add.rectangle(x, y, w, h, 0x4b5563);
      this.physics.add.existing(block, true); // true = static body
      this.obstacles.add(block);
    });

    // Colisión jugador vs obstáculos
    this.physics.add.collider(this.player, this.obstacles);

    // HUD temporal
    this.add
      .text(16, 16, 'Dia 3: Colisiones del mundo', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setScrollFactor(0);

    this.add
      .text(16, 40, 'Mover: WASD/flechas | Gris = obstaculos solidos', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#a7f3d0',
      })
      .setScrollFactor(0);
  }

  update() {
    const speed = 190;
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const up = this.cursors.up.isDown || this.keys.w.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const vec = new Phaser.Math.Vector2(vx, vy);
    if (vec.lengthSq() > 0) vec.normalize().scale(speed);

    this.player.body.setVelocity(vec.x, vec.y);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [MainScene],
};

new Phaser.Game(config);