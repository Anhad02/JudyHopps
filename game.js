// ─────────────────────────────────────────────────────────────
// Judy Hopps – Tilemap with Mario (physics enabled)
// ─────────────────────────────────────────────────────────────

const MAP_WIDTH  = 240 * 16;   // 3840 px
const MAP_HEIGHT = 26  * 16;   // 416 px

// ───────────────────────────────────────────────────────────────
// Start Menu Scene
// ───────────────────────────────────────────────────────────────
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Load all game assets here so they're ready when game starts
        this.load.tilemapTiledJSON('map', 'assets/tileMapNew.tmj');
        this.load.image('tileset', 'assets/tileset.png');
        this.load.image('mario', 'assets/mario.png');
        this.load.spritesheet('ice_agent', 'assets/ICE_agent.png', {
            frameWidth: 72,
            frameHeight: 72
        });
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('lock', 'assets/lock.png');
        this.load.image('key', 'assets/key.png');
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#87ceeb');

        // Title text
        this.add.text(400, 150, 'Judy Hopps', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Start button
        const startButton = this.add.text(400, 280, 'Start Game', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#4a90d9',
            padding: { x: 30, y: 15 },
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Button hover effects
        startButton.on('pointerover', () => {
            startButton.setStyle({ backgroundColor: '#6ab0f9' });
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ backgroundColor: '#4a90d9' });
        });

        // Start game on click
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Instructions
        this.add.text(400, 370, 'Use arrow keys to move and jump', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }
}

// ───────────────────────────────────────────────────────────────
// Main Game Scene
// ───────────────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game variables
        this.player = null;
        this.cursors = null;
        this.groundGroup = null;
        this.platformsGroup = null;
        this.leapBarsGroup = null;
        this.lockedBarsGroup = null;
        this.enemies = null;
        this.bullets = null;

        // Call the original create logic
        createGame.call(this);
    }

    update() {
        updateGame.call(this);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 416,
    backgroundColor: '#87ceeb',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);

// Game variables (used by GameScene)
let player;
let cursors;
let groundGroup;
let platformsGroup;
let leapBarsGroup;
let lockedBarsGroup;
let keyLockGroup;
let enemies;
let bullets;

// ───────────────────────────────────────────────────────────────
function createGame() {
    // ── Tilemap ───────────────────────────────────────────────
    const map = this.make.tilemap({ key: 'map' });

    // Add all tileset images to the map (they all use the same tileset.png)
    const tiles1 = map.addTilesetImage('tileset', 'tileset');
    const tiles2 = map.addTilesetImage('tileset2', 'tileset');
    const tiles3 = map.addTilesetImage('tileset3', 'tileset');
    
    // Array of all tilesets for layer creation
    const allTiles = [tiles1, tiles2, tiles3];

    // Create visible tile layers with all tilesets
    map.createLayer('Background', allTiles, 0, 0);
    map.createLayer('Graphic', allTiles, 0, 0);

    // ── Physics world bounds ──────────────────────────────────
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // ── Ground collision from object layer ────────────────────
    groundGroup = this.physics.add.staticGroup();

    const groundObjs = map.getObjectLayer('ground').objects;
    groundObjs.forEach(obj => {
        const rect = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height,
            0x000000, 0   // invisible
        );
        this.physics.add.existing(rect, true);
        groundGroup.add(rect);
    });

    // ── Platforms from object layer ───────────────────────────
    platformsGroup = this.physics.add.staticGroup();

    const platformObjs = map.getObjectLayer('platforms').objects;
    platformObjs.forEach(obj => {
        if (!obj.visible) return;
        const rect = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height,
            0x000000, 0
        );
        this.physics.add.existing(rect, true);
        platformsGroup.add(rect);
    });

    // ── Leap bars from object layer ───────────────────────────
    leapBarsGroup = this.physics.add.staticGroup();

    const leapObjs = map.getObjectLayer('leap_bars').objects;
    leapObjs.forEach(obj => {
        if (obj.width === 0 || obj.height === 0) return;  // skip empty objects
        const rect = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height,
            0x000000, 0
        );
        this.physics.add.existing(rect, true);
        leapBarsGroup.add(rect);
    });

    // ── Locked bars from object layer ─────────────────────────
    lockedBarsGroup = this.physics.add.staticGroup();

    const lockedBarsLayer = map.getObjectLayer('locked_bars');
    if (lockedBarsLayer) {
        lockedBarsLayer.objects.forEach(obj => {
            if (obj.width === 0 || obj.height === 0) return;  // skip empty objects
            const rect = this.add.rectangle(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                obj.width,
                obj.height,
                0x000000, 0
            );
            this.physics.add.existing(rect, true);
            lockedBarsGroup.add(rect);
        });
    }

    // ── Key/Lock images from object layer (with collision) ─────
    keyLockGroup = this.physics.add.staticGroup();  // For locks only (blocking)
    
    // Store all key/lock sprites and colliders for later destruction
    const keyLockSprites = [];
    const lockColliders = [];  // Only lock colliders (for blocking collision)
    let keySprite = null;      // Reference to the key sprite
    let keyCollider = null;    // Reference to the key's collider (for overlap, not blocking)
    
    const keyLockLayer = map.getObjectLayer('keyLock');
    if (keyLockLayer) {
        keyLockLayer.objects.forEach(obj => {
            if (!obj.visible) return;
            // Determine which image to use based on gid
            // gid 2773 = lock, gid 2774 = key
            const isKey = (obj.gid === 2774);
            const imageKey = isKey ? 'key' : 'lock';
            // Tile objects in Tiled have their y at the bottom, so adjust
            const xPos = obj.x + obj.width / 2;
            const yPos = obj.y - obj.height / 2;
            
            // Create a visible sprite (non-physics) for the image
            const sprite = this.add.image(xPos, yPos, imageKey);
            sprite.setDisplaySize(obj.width, obj.height);
            keyLockSprites.push(sprite);
            
            if (isKey) {
                // Key: create a collider for overlap detection only (not blocking)
                keySprite = sprite;
                const collider = this.add.rectangle(xPos, yPos, obj.width, obj.height, 0x000000, 0);
                this.physics.add.existing(collider, true);
                keyCollider = collider;
            } else {
                // Lock: create a blocking collision rectangle
                const collider = this.add.rectangle(xPos, yPos, obj.width, obj.height, 0x000000, 0);
                this.physics.add.existing(collider, true);
                keyLockGroup.add(collider);
                lockColliders.push(collider);
            }
        });
    }
    
    // Store references on the scene for access in collision handler
    this.keyLockSprites = keyLockSprites;
    this.lockColliders = lockColliders;
    this.keySprite = keySprite;
    this.keyCollider = keyCollider;

    // ── Player (Mario) ────────────────────────────────────────
    player = this.physics.add.sprite(350, MAP_HEIGHT - 100, 'mario');
    player.setDisplaySize(18, 26);  // 10% smaller than 20x29
    player.body.setSize(player.width * 0.6, player.height * 0.9);
    player.body.setOffset(player.width * 0.2, player.height * 0.1);
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    // ── Collisions ────────────────────────────────────────────
    this.physics.add.collider(player, groundGroup);
    this.physics.add.collider(player, platformsGroup);
    this.physics.add.collider(player, leapBarsGroup);
    this.physics.add.collider(player, lockedBarsGroup);
    this.physics.add.collider(player, keyLockGroup);
    
    // ── Key pickup - when Mario touches the key, all key/lock objects disappear
    if (this.keyCollider) {
        this.physics.add.overlap(player, this.keyCollider, collectKey, null, this);
    }

    // ── Camera follows player ─────────────────────────────────
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);   // Zoom in 2x so less map is visible

    // ── Controls ──────────────────────────────────────────────
    cursors = this.input.keyboard.createCursorKeys();

    // ── Enemy Animations ────────────────────────────────────────
    // Frames 0-5: front, 6-11: left, 12-17: right, 18-23: back
    this.anims.create({
        key: 'enemy_front',
        frames: this.anims.generateFrameNumbers('ice_agent', { start: 0, end: 5 }),
        frameRate: 2,
        repeat: -1
    });
    this.anims.create({
        key: 'enemy_left',
        frames: this.anims.generateFrameNumbers('ice_agent', { start: 6, end: 11 }),
        frameRate: 2,
        repeat: -1
    });
    this.anims.create({
        key: 'enemy_right',
        frames: this.anims.generateFrameNumbers('ice_agent', { start: 12, end: 17 }),
        frameRate: 2,
        repeat: -1
    });
    this.anims.create({
        key: 'enemy_back',
        frames: this.anims.generateFrameNumbers('ice_agent', { start: 18, end: 23 }),
        frameRate: 2,
        repeat: -1
    });

    // ── Create Enemies ──────────────────────────────────────────
    enemies = this.physics.add.group();

    // Spawn enemies at specific coordinates (y=368 is just above ground level)
    // Ground level enemies
    createPatrolEnemy(this, 700, 368, 30);
    createPatrolEnemy(this, 750, 368, 30);
    
    // Enemies on parkour platforms
    createPatrolEnemy(this, 1096, 305, 20);  // parkour1 (x=1072, y=320, width=48) - centered on platform
    createPatrolEnemy(this, 1008, 240, 25);  // parkour2 (x=976, y=255, width=64) - centered on platform
    createPatrolEnemy(this, 1160, 225, 20);  // parkour3 (x=1135, y=240, width=49) - centered on platform

    // Enemies on locked_bars area (leftTop, key, rightTop platforms)
    createPatrolEnemy(this, 1520, 289, 10);  // leftTop (x=1504, y=304, width=32) - centered on platform
    createPatrolEnemy(this, 1552, 289, 10);  // key (x=1536, y=304, width=32) - centered on platform
    createPatrolEnemy(this, 1584, 289, 10);  // rightTop (x=1568, y=304, width=32) - centered on platform
    
    // Enemies on left and right platforms
    createPatrolEnemy(this, 1464, 225, 15);  // leftPlatform (x=1440, y=240, width=48) - centered on platform
    createPatrolEnemy(this, 1640, 225, 15);  // rightPlatform (x=1616, y=240, width=48) - centered on platform

    // Enemy collides with ground, platforms, and locked bars
    this.physics.add.collider(enemies, groundGroup);
    this.physics.add.collider(enemies, platformsGroup);
    this.physics.add.collider(enemies, lockedBarsGroup);

    // ── Create Bullets Group ──────────────────────────────────────
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 50
    });

    // ── Bullet hits player ──────────────────────────────────────────
    this.physics.add.overlap(player, bullets, hitPlayer, null, this);

    // ── Player stomps on enemy ──────────────────────────────────────
    this.physics.add.overlap(player, enemies, playerEnemyCollision, null, this);
}

// ───────────────────────────────────────────────────────────────
// Collect Key - destroys all key and lock objects
// ───────────────────────────────────────────────────────────────
function collectKey(player, keyCollider) {
    // Get the scene reference
    const scene = player.scene;
    
    // Destroy all key/lock sprites (both key and lock images)
    scene.keyLockSprites.forEach(sprite => {
        sprite.destroy();
    });
    
    // Destroy all lock colliders
    scene.lockColliders.forEach(collider => {
        collider.destroy();
    });
    
    // Destroy the key collider
    if (scene.keyCollider) {
        scene.keyCollider.destroy();
    }
    
    // Clear the arrays and references
    scene.keyLockSprites = [];
    scene.lockColliders = [];
    scene.keySprite = null;
    scene.keyCollider = null;
}

// ───────────────────────────────────────────────────────────────
// Player Hit by Bullet
// ───────────────────────────────────────────────────────────────
function hitPlayer(player, bullet) {
    // Deactivate the bullet that hit the player
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body.stop();

    // Clear ALL active bullets to prevent respawn loops
    bullets.getChildren().forEach(b => {
        if (b.active) {
            b.setActive(false);
            b.setVisible(false);
            b.body.stop();
        }
    });

    // Respawn player at starting position
    player.setPosition(350, MAP_HEIGHT - 100);
    player.setVelocity(0, 0);
}

// ───────────────────────────────────────────────────────────────
// Player-Enemy Collision (stomp to kill)
// ───────────────────────────────────────────────────────────────
function playerEnemyCollision(player, enemy) {
    // Check if player is falling down onto the enemy (stomping)
    // Player's bottom should be near enemy's top, and player should be moving downward
    const playerBottom = player.body.y + player.body.height;
    const enemyTop = enemy.body.y;
    const stompThreshold = 10;  // pixels of tolerance

    if (player.body.velocity.y > 0 && playerBottom <= enemyTop + stompThreshold) {
        // Player stomped on enemy - kill the enemy
        enemy.destroy();
        
        // Give player a small bounce after stomping
        player.setVelocityY(-200);
    }
    // No respawn on side/below collision - only bullets cause respawn
}

// ───────────────────────────────────────────────────────────────
function updateGame() {
    const speed = 140;
    const jumpVelocity = -350;

    // Horizontal movement
    if (cursors.left.isDown) {
        player.setVelocityX(-speed);
        player.setFlipX(true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(speed);
        player.setFlipX(false);
    } else {
        player.setVelocityX(0);
    }

    // Jump (only when standing on ground/platform)
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(jumpVelocity);
    }

    // Update enemy patrols
    enemies.getChildren().forEach(enemy => {
        updateEnemyPatrol(enemy);
    });

    // Update bullets (cleanup off-screen bullets)
    updateBullets();
}

// ───────────────────────────────────────────────────────────────
// Enemy Patrol System
// ───────────────────────────────────────────────────────────────

function createPatrolEnemy(scene, x, y, patrolRange) {
    const enemy = scene.physics.add.sprite(x, y, 'ice_agent');
    enemy.setScale(0.4);  // Scale down to 40% of original size
    enemy.setBounce(0);
    enemy.setCollideWorldBounds(true);
    enemy.body.setAllowGravity(false);  // No gravity - enemy stays at spawn position
    // Refresh body to match scaled size
    enemy.refreshBody();

    // Randomize starting direction and timing
    const startDirection = Math.random() < 0.5 ? 1 : -1;
    const startState = Math.random() < 0.3 ? (Math.random() < 0.5 ? 'looking_front' : 'looking_back') : 'walking';
    const randomOffset = Math.random() * 2000;  // Random timer offset so they're out of sync

    // Store patrol data on the enemy
    enemy.patrolData = {
        spawnX: x,
        spawnY: y,
        range: patrolRange,
        speed: 50,
        direction: startDirection,           // 1 = right, -1 = left (randomized)
        state: startState,                   // Start in random state
        stateTimer: randomOffset,            // Random offset so enemies are out of sync
        walkDuration: 2000,                  // Walk for 2 seconds before looking around
        lookDuration: 1000,                  // Look for 1 second
        lastDirection: startDirection,       // Remember direction before looking
        shootCooldown: 0,                     // Time until next shot allowed
        shootDelay: 2000                      // Time between shots (2 seconds)
    };

    // Play appropriate starting animation
    if (startState === 'walking') {
        enemy.play(startDirection === 1 ? 'enemy_right' : 'enemy_left');
    } else {
        enemy.play(startState === 'looking_front' ? 'enemy_front' : 'enemy_back');
    }
    enemies.add(enemy);

    return enemy;
}

function updateEnemyPatrol(enemy) {
    const data = enemy.patrolData;
    if (!data) return;

    const speed = data.speed;
    const minX = data.spawnX - data.range;
    const maxX = data.spawnX + data.range;
    const deltaTime = enemy.scene.game.loop.delta;

    // Update state timer
    data.stateTimer += deltaTime;

    // Update shoot cooldown
    if (data.shootCooldown > 0) {
        data.shootCooldown -= deltaTime;
    }

    if (data.state === 'walking') {
        // Move in current direction
        enemy.setVelocityX(speed * data.direction);

        // Check bounds and reverse direction
        if (enemy.x >= maxX && data.direction === 1) {
            data.direction = -1;
            enemy.play('enemy_left');
        } else if (enemy.x <= minX && data.direction === -1) {
            data.direction = 1;
            enemy.play('enemy_right');
        }

        // Fire bullet while walking (facing left or right) - only if both enemy and player are on screen
        if (data.shootCooldown <= 0) {
            const camera = enemy.scene.cameras.main;
            const enemyOnScreen = camera.worldView.contains(enemy.x, enemy.y);
            const playerOnScreen = camera.worldView.contains(player.x, player.y);
            
            if (enemyOnScreen && playerOnScreen) {
                fireEnemyBullet(enemy, data.direction);
                data.shootCooldown = data.shootDelay;
            }
        }

        // After walking for a while, stop and look around
        if (data.stateTimer >= data.walkDuration) {
            data.stateTimer = 0;
            data.lastDirection = data.direction;
            data.state = Math.random() < 0.5 ? 'looking_front' : 'looking_back';
            enemy.setVelocityX(0);
            enemy.play(data.state === 'looking_front' ? 'enemy_front' : 'enemy_back');
        }
    } else if (data.state === 'looking_front' || data.state === 'looking_back') {
        // Stay still while looking
        enemy.setVelocityX(0);

        // After looking, resume walking
        if (data.stateTimer >= data.lookDuration) {
            data.stateTimer = 0;
            data.state = 'walking';
            data.direction = data.lastDirection;
            enemy.play(data.direction === 1 ? 'enemy_right' : 'enemy_left');
        }
    }
}

// ───────────────────────────────────────────────────────────────
// Enemy Bullet System
// ───────────────────────────────────────────────────────────────

function fireEnemyBullet(enemy, direction) {
    const bullet = bullets.get(enemy.x, enemy.y);
    if (!bullet) return;  // Pool exhausted

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(0.02);  // Scale down bullet to fit game aesthetics
    bullet.body.setAllowGravity(false);

    // Set bullet velocity based on direction
    const bulletSpeed = 200;
    bullet.setVelocityX(bulletSpeed * direction);

    // Flip bullet sprite based on direction (left-facing needs to be flipped)
    bullet.setFlipX(direction === -1);

    // Destroy bullet after it travels off screen or after a timeout
    enemy.scene.time.delayedCall(3000, () => {
        if (bullet.active) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.stop();
        }
    });
}

function updateBullets() {
    bullets.getChildren().forEach(bullet => {
        if (bullet.active) {
            // Deactivate bullets that go off the map
            if (bullet.x < 0 || bullet.x > MAP_WIDTH || bullet.y < 0 || bullet.y > MAP_HEIGHT) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.body.stop();
            }
        }
    });
}
