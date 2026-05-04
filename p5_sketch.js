let stars = [];
let planet;
let planetTexture;

let cameraX = 0;
let cameraY = 0;
const parallaxStrength = 0.1; // How much the background moves relative to player

function preload() {
  // You can load an image for the planet texture here if you have one.
  // For now, we'll just draw a simple colored sphere.
  // planetTexture = loadImage('path/to/your/planet_texture.jpg');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.position(0, 0);
  canvas.style('z-index', '-1'); // Place canvas behind other content
  canvas.id('p5BackgroundCanvas'); // Ensure the canvas has the correct ID

  // Initialize stars
  for (let i = 0; i < 800; i++) {
    stars.push({
      x: random(-width / 2, width / 2),
      y: random(-height / 2, height / 2),
      z: random(width),
      pz: random(width) // Previous z for star trails
    });
  }

  // Initialize planet
  planet = {
    x: 0, // Centered in WEBGL mode
    y: 0, // Centered in WEBGL mode
    radius: min(width, height) * 0.2,
    rotation: 0,
    color: color(50, 50, 150) // A deep blue/purple color
  };
}

function draw() {
  background(0); // Black background for space

  // Update camera position based on player movement
  if (window.playerMovementData) {
    cameraX += window.playerMovementData.dx * parallaxStrength;
    cameraY += window.playerMovementData.dy * parallaxStrength;
  }

  // Apply camera translation
  translate(-cameraX, -cameraY, 0);

  // Draw stars
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];
    
    push();
    // Stars further away move less (stronger parallax)
    let starParallaxX = star.x + cameraX * (star.z / width) * 0.5;
    let starParallaxY = star.y + cameraY * (star.z / width) * 0.5;
    
    translate(starParallaxX, starParallaxY, star.z);
    noStroke();
    fill(255);
    let r = map(star.z, 0, width, 6, 0); // Smaller stars further away
    sphere(r / 2); // Use sphere for stars in WEBGL
    pop();

    // Move stars
    star.pz = star.z;
    star.z -= 5; // Speed of stars moving towards viewer
    if (star.z < 1) {
      star.z = width;
      star.x = random(-width / 2, width / 2);
      star.y = random(-height / 2, height / 2);
      star.pz = width;
    }
  }

  // Draw planet
  push();
  // Planet also moves with parallax, but perhaps less than stars
  let planetParallaxX = planet.x + cameraX * 0.2;
  let planetParallaxY = planet.y + cameraY * 0.2;
  translate(planetParallaxX, planetParallaxY, 0);
  rotateY(planet.rotation);
  noStroke();
  fill(planet.color);
  sphere(planet.radius); // Draw a simple sphere
  pop();

  planet.rotation += 0.002; // Slow rotation
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Re-initialize stars for new dimensions if needed, or adjust their positions
  // For simplicity, we'll just let them continue, but a more robust solution
  // might re-distribute them.
}
