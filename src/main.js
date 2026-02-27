import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.add
      .text(24, 24, 'Mini Granja 2D - Dia 1 OK ✅', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setScrollFactor(0);

    this.add
      .text(24, 64, 'Siguiente paso: movimiento del personaje (Dia 2)', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#a7f3d0',
      })
      .setScrollFactor(0);

    this.cameras.main.setBackgroundColor('#1f2937');
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'app',
  backgroundColor: '#1f2937',
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

new Phaser.Game(config);
