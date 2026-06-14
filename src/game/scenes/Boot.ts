import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load assets needed for Preloader scene (e.g., logo, background)
    }

    create() {
        this.scene.start('Preloader');
    }
}
