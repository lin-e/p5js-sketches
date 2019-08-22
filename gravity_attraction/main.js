var msg;
var fps;
var pcount;
var grav;
var mmass;
var g = 0.05;
var particles = [];
var particle_count = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(27, 27, 27);
  angleMode(DEGREES);
  for (var i = 1; i < particle_count; i++) {
    particles[i] = new Particle(random(10, 99), createVector(random(width), random(height)));
  }
  particles[0] = new Particle(20000, createVector(width / 2, height / 2));
  msg = createP();
  msg.html("Gravity Attraction Simulation - Press any key to show forces. [ENTER] to reset constants. Click to add 'large' particle");
  fps = createP();
  fps.html("FPS: ");
  pcount = createP();
  pcount.html("Particles: ");
  grav = createP();
  grav.html("Gravity Constant: ");
  mmass = createP();
  mmass.html("Main Mass: ");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseClicked() {
  particles[particles.length] = new Particle(1000, createVector(mouseX, mouseY));
}

function draw() {
  if (!(keyIsDown(CONTROL))) {
    background(27, 27, 27);
  }
  if (keyIsDown(UP_ARROW)) {
    g += 0.001;
  }
  if (keyIsDown(DOWN_ARROW)) {
    g -= 0.001;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    particles[0].mass *= 1.01;
    particles[0].mass = Number(particles[0].mass.toFixed(0));
    particles[0].rad = sqrt(particles[0].mass / PI);
  }
  if (keyIsDown(LEFT_ARROW)) {
    particles[0].mass /= 1.01;
    particles[0].mass = Number(particles[0].mass.toFixed(0));
    particles[0].rad = sqrt(particles[0].mass / PI);
  }
  if (keyIsDown(RETURN)) {
    particles[0].mass = 20000;
    particles[0].rad = sqrt(particles[0].mass / PI);
    g = 0.05;
  }
  g = Number(g.toFixed(3));
  noStroke();
  for (var i = 0; i < particles.length; i++) {
    if (particles[i].update()) {
      var mass = particles[i].mass;
      particles[i] = new Particle(particles[i].mass, createVector(random(width), random(height)));
    } else {
      particles[i].show();
    }
  }
  if (keyIsDown(255)) {
    stroke(0, 153, 255, 63);
    line(particles[0].pos.x, particles[0].pos.y, width / 2, height / 2);
    for (var j = 0; j < particles.length; j++) {
      for (var k = 0; k < particles.length; k++) {
        var force = particles[k].mass / sq(p5.Vector.dist(particles[j].pos, particles[k].pos)) * 1000 * g;
        if (force > 1) {
          force = 1
        }
        stroke(255, 255, 255, map(force, 0, 1, 0, 127));
        line(particles[j].pos.x, particles[j].pos.y, particles[k].pos.x, particles[k].pos.y);
      }
      if (j == 0) {
        j = particle_count - 1;
      }
    }
  }
  fps.html("FPS: " + frameRate());
  pcount.html("Particles: " + particles.length);
  grav.html("Gravity Constant [UP / DOWN]: " + g);
  mmass.html("Main Mass [LEFT / RIGHT]: " + particles[0].mass);
}

function Particle(mass, pos) {
  this.mass = mass;
  this.rad = sqrt(mass / PI);
  this.pos = pos;
  this.vel = createVector(0, 0);
  this.vel.limit(5);
  this.show = function() {
    if (keyIsDown(CONTROL)) {
      fill(255, 255, 255, 10);
    } else {
      fill(255, 255, 255, 60);
    }
    if (this.control) {
      rect(this.pos.x, this.pos.y, sqrt(this.mass), sqrt(this.mass));
    } else {
      ellipse(this.pos.x, this.pos.y, this.rad);
    }
  };
  this.update = function() {
    for (var i = 0; i < particles.length; i++) {
      var target = particles[i];
      var new_acc = p5.Vector.sub(target.pos, this.pos);
      var dist = p5.Vector.dist(this.pos, target.pos);
      if (dist > (this.rad + target.rad)) {
        new_acc.setMag(g * target.mass / sq(dist));
        this.vel.add(new_acc);
      }
    }
    this.pos.add(this.vel);
    if (this.pos.x > width) {
      return true;
    }
    if (this.pos.y > height) {
      return true;
    }
    if (this.pos.x < 0) {
      return true;
    }
    if (this.pos.y < 0) {
      return true;
    }
    return false;
  };
}
