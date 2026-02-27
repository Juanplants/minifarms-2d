import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#1f2937');

    this.worldWidth = 2200;
    this.worldHeight = 1400;

    // Estado base del jugador/economía (Día 5)
    this.money = 0;
    this.xp = 0;
    this.seeds = 3;

    this.cropConfig = {
      growMs: 5000, // 5 segundos demo
      rewardMoney: 12,
      rewardXp: 8,
    };

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

    // Input movimiento
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Input acción
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Cámara
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(260, 160);

    // Obstáculos simples
    this.obstacles = this.physics.add.staticGroup();
    const obstacleData = [
      { x: 520, y: 360, w: 140, h: 48 },
      { x: 820, y: 520, w: 200, h: 48 },
      { x: 1180, y: 280, w: 64, h: 220 },
      { x: 1460, y: 760, w: 260, h: 64 },
    ];

    obstacleData.forEach(({ x, y, w, h }) => {
      const block = this.add.rectangle(x, y, w, h, 0x4b5563);
      this.physics.add.existing(block, true);
      this.obstacles.add(block);
    });

    this.physics.add.collider(this.player, this.obstacles);

    // Parcela de prueba
    this.plot = {
      x: 980,
      y: 760,
      width: 84,
      height: 84,
      state: 'vacia',
      plantedAt: null,
    };

    this.plotRect = this.add
      .rectangle(this.plot.x, this.plot.y, this.plot.width, this.plot.height, 0x8b5a2b)
      .setStrokeStyle(2, 0xd6b98c);

    // HUD
    this.titleText = this.add
      .text(16, 16, 'Dia 5: Loop agricola minimo (E)', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setScrollFactor(0);

    this.statsText = this.add
      .text(16, 40, '', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#a7f3d0',
      })
      .setScrollFactor(0);

    this.stateText = this.add
      .text(16, 64, 'Estado parcela: vacia', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#fcd34d',
      })
      .setScrollFactor(0);

    this.feedbackText = this.add
      .text(16, 88, 'Acercate y presiona E para sembrar', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f9fafb',
      })
      .setScrollFactor(0);

    this.updatePlotVisual();
    this.updateStatsText();
  }

  update() {
    this.handleMovement();
    this.updatePlotGrowth();

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.tryInteractPlot();
    }
  }

  handleMovement() {
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

  tryInteractPlot() {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.plot.x, this.plot.y);
    const interactionRadius = 90;

    if (dist > interactionRadius) {
      this.feedbackText.setText('Muy lejos de la parcela. Acercate un poco mas.');
      return;
    }

    // Sembrar
    if (this.plot.state === 'vacia') {
      if (this.seeds <= 0) {
        this.feedbackText.setText('No tienes semillas. No puedes sembrar.');
        return;
      }

      this.seeds -= 1;
      this.plot.state = 'sembrada';
      this.plot.plantedAt = this.time.now;
      this.feedbackText.setText('Sembraste 1 semilla 🌱');
      this.updatePlotVisual();
      this.updateStatsText();
      return;
    }

    // Aún en crecimiento
    if (this.plot.state === 'sembrada') {
      this.feedbackText.setText('Aun creciendo... espera unos segundos.');
      return;
    }

    // Cosechar
    if (this.plot.state === 'lista') {
      this.plot.state = 'vacia';
      this.plot.plantedAt = null;

      this.money += this.cropConfig.rewardMoney;
      this.xp += this.cropConfig.rewardXp;

      this.feedbackText.setText(
        `Cosecha exitosa +${this.cropConfig.rewardMoney} monedas, +${this.cropConfig.rewardXp} XP ✅`
      );

      this.updatePlotVisual();
      this.updateStatsText();
    }
  }

  updatePlotGrowth() {
    if (this.plot.state !== 'sembrada' || this.plot.plantedAt == null) {
      this.stateText.setText(`Estado parcela: ${this.plot.state}`);
      return;
    }

    const elapsed = this.time.now - this.plot.plantedAt;
    const remaining = Math.max(0, this.cropConfig.growMs - elapsed);

    if (remaining <= 0) {
      this.plot.state = 'lista';
      this.plot.plantedAt = null;
      this.feedbackText.setText('La parcela esta lista para cosechar ✅');
      this.updatePlotVisual();
      this.stateText.setText('Estado parcela: lista');
      return;
    }

    const sec = Math.ceil(remaining / 1000);
    this.stateText.setText(`Estado parcela: sembrada (${sec}s)`);
  }

  updatePlotVisual() {
    if (this.plot.state === 'vacia') {
      this.plotRect.fillColor = 0x8b5a2b; // marrón
    } else if (this.plot.state === 'sembrada') {
      this.plotRect.fillColor = 0x16a34a; // verde
    } else {
      this.plotRect.fillColor = 0xf59e0b; // lista para cosecha
    }

    this.stateText.setText(`Estado parcela: ${this.plot.state}`);
  }

  updateStatsText() {
    this.statsText.setText(`Monedas: ${this.money} | XP: ${this.xp} | Semillas: ${this.seeds}`);
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