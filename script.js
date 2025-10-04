class GliderRunGame {
    constructor() {
        this.gameContainer = document.getElementById("game-container");
        this.player = document.getElementById("player");
        this.scoreDisplay = document.getElementById("score");
        this.gameOverScreen = document.getElementById("game-over");
        this.startScreen = document.getElementById("start-screen");
        this.finalScoreDisplay = document.getElementById("final-score");
        this.restartButton = document.getElementById("restart-button");
        this.startButton = document.getElementById("start-button");
        this.shareTwitterButton = document.getElementById("share-twitter-button");
        this.instructionsDisplay = document.getElementById("instructions");
        this.backgroundMusic = document.getElementById("background-music");

        this.score = 0;
        this.isJumping = false;
        this.isGliding = false;
        this.playerBottom = 80;
        this.playerLeft = 120;
        this.playerVelocityY = 0;
        this.gravity = 0.4; // Reduced gravity for better control
        this.jumpForce = 18; // Increased jump force for more immediate and powerful jumps
        this.glideGravityFactor = 0.1; // Better gliding effect
        this.maxJumpHeight = 250; // Increased max height for emerald positioning

        this.obstacles = [];
        this.emeralds = [];
        this.gameSpeed = 2.0; // Even slower initial speed for easier gameplay
        this.isGameOver = false;
        this.gameStarted = false;
        this.gameRunning = false;
        this.keyPressed = false;
        this.gameTime = 0; // Track game time for difficulty progression

        this.gameInterval = null;
        this.obstacleInterval = null;
        this.emeraldInterval = null;

        this.init();
    }

    init() {
        this.startButton.addEventListener("click", () => this.startGame());
        this.restartButton.addEventListener("click", () => this.restartGame());
        this.shareTwitterButton.addEventListener("click", () => this.shareToTwitter());
        
        // Improved key handling for instant response
        document.addEventListener("keydown", (e) => this.handleKeyDown(e));
        document.addEventListener("keyup", (e) => this.handleKeyUp(e));
        
        // Touch events for mobile with instant response
        this.gameContainer.addEventListener("touchstart", (e) => this.handleTouchStart(e));
        this.gameContainer.addEventListener("touchend", (e) => this.handleTouchEnd(e));
        
        // Show start screen initially
        this.showStartScreen();
    }

    showStartScreen() {
        this.startScreen.classList.remove("hidden");
        this.gameOverScreen.classList.add("hidden");
        this.instructionsDisplay.classList.add("hidden");
        this.scoreDisplay.style.display = "none";
        this.player.style.display = "none";
    }

    startGame() {
        this.score = 0;
        this.gameTime = 0;
        this.scoreDisplay.textContent = "Emeralds: " + this.score;
        this.playerBottom = 80;
        this.playerLeft = 120;
        this.playerVelocityY = 0;
        this.isJumping = false;
        this.isGliding = false;
        this.isGameOver = false;
        this.gameStarted = true;
        this.gameRunning = true;
        this.gameSpeed = 2.0; // Start slower for easier gameplay
        this.keyPressed = false;
        
        // Hide start screen and show game elements
        this.startScreen.classList.add("hidden");
        this.gameOverScreen.classList.add("hidden");
        this.instructionsDisplay.classList.remove("hidden");
        this.scoreDisplay.style.display = "block";
        this.player.style.display = "block";
        
        // Start background music
        if (this.backgroundMusic) {
            this.backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        }

        // Clear existing game objects
        this.obstacles.forEach(obs => obs.element.remove());
        this.emeralds.forEach(em => em.element.remove());
        this.obstacles = [];
        this.emeralds = [];

        // Reset player position and appearance
        this.player.style.bottom = this.playerBottom + "px";
        this.player.style.left = this.playerLeft + "px";
        this.player.className = "";

        // Clear existing intervals
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.obstacleInterval) clearInterval(this.obstacleInterval);
        if (this.emeraldInterval) clearInterval(this.emeraldInterval);

        // Start game loops with much easier initial settings
        this.gameInterval = setInterval(() => this.gameLoop(), 1000 / 60); // 60 FPS
        this.obstacleInterval = setInterval(() => this.generateObstacle(), 6500); // Even longer initial spacing for easier start
        this.emeraldInterval = setInterval(() => this.generateEmerald(), 2000);


        // Hide instructions after 4 seconds
        setTimeout(() => {
            if (this.instructionsDisplay) {
                this.instructionsDisplay.classList.add("hidden");
            }
        }, 4000);
    }

    restartGame() {
        this.startGame();
    }

    gameLoop() {
        if (this.isGameOver || !this.gameRunning) return;

        this.gameTime += 1/60; // Increment game time

        // Progressive difficulty increase (much slower)
        this.updateDifficulty();

        // Apply physics to player with responsive movement
        this.updatePlayerPhysics();

        // Update obstacles
        this.updateObstacles();

        // Update emeralds
        this.updateEmeralds();
    }

    updateDifficulty() {
        // Very gradual increase in speed and obstacle frequency
        const baseSpeed = 2.0;
        const maxSpeed = 4.5;
        const speedIncrease = Math.min((this.gameTime / 90) * 2.5, maxSpeed - baseSpeed); // Even slower progression
        this.gameSpeed = baseSpeed + speedIncrease;

        // Adjust obstacle generation frequency based on game time (much more gradual)
        if (this.gameTime > 45 && this.obstacleInterval._idleTimeout > 5500) {
            clearInterval(this.obstacleInterval);
            this.obstacleInterval = setInterval(() => this.generateObstacle(), 5500);
        } else if (this.gameTime > 90 && this.obstacleInterval._idleTimeout > 4500) {
            clearInterval(this.obstacleInterval);
            this.obstacleInterval = setInterval(() => this.generateObstacle(), 4500);
        }
    }

    updatePlayerPhysics() {
        // Apply gravity with responsive movement
        if (this.isGliding) {
            this.playerVelocityY -= this.gravity * this.glideGravityFactor;
        } else {
            this.playerVelocityY -= this.gravity;
        }

        // Update position
        this.playerBottom += this.playerVelocityY;

        // Ground collision with responsive landing
        if (this.playerBottom <= 80) {
            this.playerBottom = 80;
            this.playerVelocityY = 0;
            
            if (this.isJumping || this.isGliding) {
                this.isJumping = false;
                this.isGliding = false;
                this.player.classList.remove("player-jumping", "player-gliding");
            }
        }

        // Direct, immediate visual position update
        this.player.style.bottom = this.playerBottom + "px";
    }

    updateObstacles() {
        this.obstacles.forEach((obstacle, index) => {
            obstacle.left -= this.gameSpeed;
            obstacle.element.style.left = obstacle.left + "px";

            if (obstacle.left < -obstacle.element.offsetWidth) {
                obstacle.element.remove();
                this.obstacles.splice(index, 1);
                return;
            }

            if (this.checkCollision(obstacle)) {
                this.endGame();
            }
        });
    }

    updateEmeralds() {
        this.emeralds.forEach((emerald, index) => {
            emerald.left -= this.gameSpeed;
            emerald.element.style.left = emerald.left + "px";

            if (emerald.left < -emerald.element.offsetWidth) {
                emerald.element.remove();
                this.emeralds.splice(index, 1);
                return;
            }

            if (this.checkEmeraldCollection(emerald)) {
                this.collectEmerald(emerald, index);
            }
        });
    }

    checkCollision(obstacle) {
        // Even more forgiving collision detection
        const playerRect = {
            left: this.playerLeft + 30, // Very forgiving collision margins
            right: this.playerLeft + 70,
            top: this.playerBottom + 30,
            bottom: this.playerBottom + 70
        };

        const obstacleRect = {
            left: obstacle.left + 15, // Add more margin to obstacles
            right: obstacle.left + obstacle.element.offsetWidth - 15,
            top: 80,
            bottom: 80 + obstacle.height
        };

        return playerRect.left < obstacleRect.right &&
               playerRect.right > obstacleRect.left &&
               playerRect.top < obstacleRect.bottom &&
               playerRect.bottom > obstacleRect.top;
    }

    checkEmeraldCollection(emerald) {
        // More generous emerald collection
        const playerRect = {
            left: this.playerLeft + 5,
            right: this.playerLeft + 95,
            top: this.playerBottom + 5,
            bottom: this.playerBottom + 95
        };

        const emeraldRect = {
            left: emerald.left,
            right: emerald.left + 50,
            top: emerald.bottom,
            bottom: emerald.bottom + 60
        };

        return playerRect.left < emeraldRect.right &&
               playerRect.right > emeraldRect.left &&
               playerRect.top < emeraldRect.bottom &&
               playerRect.bottom > emeraldRect.top;
    }

    collectEmerald(emerald, index) {
        this.score++;
        this.scoreDisplay.textContent = "Emeralds: " + this.score;
        
        emerald.element.classList.add("collected-emerald");
        
        setTimeout(() => {
            if (emerald.element.parentNode) {
                emerald.element.remove();
            }
        }, 500);
        
        this.emeralds.splice(index, 1);
    }

    jump() {
        // Instant, responsive jumping
        if (!this.isJumping && this.playerBottom <= 80) {
            this.isJumping = true;
            this.playerVelocityY = this.jumpForce; // Immediate jump force application
            this.player.classList.add("player-jumping");
        }
    }

    startGlide() {
        if (this.isJumping && !this.isGliding && this.playerBottom > 80) {
            this.isGliding = true;
            this.player.classList.remove("player-jumping");
            this.player.classList.add("player-gliding");
        }
    }

    stopGlide() {
        if (this.isGliding) {
            this.isGliding = false;
            this.player.classList.remove("player-gliding");
        }
    }

    handleKeyDown(e) {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove keyPressed check for instant response
            if (!this.isGameOver && this.gameRunning) {
                if (!this.isJumping && this.playerBottom <= 80) {
                    this.jump(); // Instant jump
                } else if (this.isJumping && !this.isGliding) {
                    this.startGlide();
                }
            }
        }
    }

    handleKeyUp(e) {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            
            if (!this.isGameOver && this.gameRunning) {
                this.stopGlide();
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        
        // Instant touch response
        if (!this.isGameOver && this.gameRunning) {
            if (!this.isJumping && this.playerBottom <= 80) {
                this.jump(); // Instant jump
            } else if (this.isJumping && !this.isGliding) {
                this.startGlide();
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        
        if (!this.isGameOver && this.gameRunning) {
            this.stopGlide();
        }
    }

    generateObstacle() {
        if (this.isGameOver || !this.gameRunning) return;

        const obstacle = document.createElement("div");
        obstacle.classList.add("obstacle");
        const obstacleLeft = this.gameContainer.offsetWidth;
        const obstacleHeight = Math.random() * 25 + 40; // Even smaller obstacles for easier gameplay
        obstacle.style.height = obstacleHeight + "px";
        obstacle.style.left = obstacleLeft + "px";
        this.gameContainer.appendChild(obstacle);
        this.obstacles.push({ element: obstacle, left: obstacleLeft, height: obstacleHeight });
    }

    generateEmerald() {
        if (this.isGameOver || !this.gameRunning) return;

        const emerald = document.createElement("div");
        emerald.classList.add("emerald");
        const emeraldLeft = this.gameContainer.offsetWidth;
        
        // Position emeralds within 1-2 jump heights above the ground
        const minEmeraldBottom = this.playerBottom + 50; // Slightly higher for easier collection
        const maxEmeraldBottom = this.playerBottom + this.maxJumpHeight - 30;
        const emeraldBottom = Math.random() * (maxEmeraldBottom - minEmeraldBottom) + minEmeraldBottom;
        
        emerald.style.left = emeraldLeft + "px";
        emerald.style.bottom = emeraldBottom + "px";
        this.gameContainer.appendChild(emerald);
        this.emeralds.push({ element: emerald, left: emeraldLeft, bottom: emeraldBottom });
    }

    endGame() {
        this.isGameOver = true;
        this.gameRunning = false;
        
        clearInterval(this.gameInterval);
        clearInterval(this.obstacleInterval);
        clearInterval(this.emeraldInterval);

        this.finalScoreDisplay.textContent = this.score;
        this.gameOverScreen.classList.remove("hidden");
        this.player.style.display = "none"; // Hide player on game over
    }

    shareToTwitter() {
        const gameUrl = window.location.href;
        const scoreText = `I just scored ${this.score} emeralds in Glider Run! 🎮✨ Can you beat my score?`;
        const hashtags = "GliderRun,WebGame,Gaming";
        const via = "Ramx_ai"; // This will automatically tag @Ramx_ai
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(scoreText)}&url=${encodeURIComponent(gameUrl)}&hashtags=${encodeURIComponent(hashtags)}&via=${encodeURIComponent(via)}`;
        
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }
}

// Initialize game when page loads
window.addEventListener("load", () => {
    new GliderRunGame();
});
