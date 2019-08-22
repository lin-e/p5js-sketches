var msg; // message to display to the user
var fps; // the current framerate
var avgHealth; // average health of the current population
var popCount; // the size of the population
var maxHealth = 2500; // maximum health
var t = []; // the list of all entities
var o = []; // the list of all obstacles
var safeDiameter = 150; // the area around the mouse cursor that regenerates health (to award those attracted to the target)
var reproduceChance = 0.0002; // the probability that they will reproduce in a frame
var mutationChance = 0.0001; // the chance that each gene will mutate (randomise)
var cureChance = 0.00001; // the chance that an entity will be cured of a disease
var infectionChance = 0.00001; // the chance that an entity will be infected
var motionMultiplier = 12; // a multiplier constant for movement
var obstacleRadius = 50; // the size of obstacles (danger zones)
var showViewCircle = false; // viewing range
var initPop = 150; // initial population

function setup() { // starting function
  createCanvas(windowWidth, windowHeight); // create fullscreened window
  angleMode(DEGREES); // do all calculations in degrees
  msg = createP(); // create the element
  msg.html("Evolution of entities to target player<br>Click to create an obstacle (which the entities should evolve to avoid)<br>The aim is to generate the DNA for an optimal species, which would follow the cursor closely whilst avoiding obstacles."); // changes the text
  fps = createP(); // create element for framerate
  avgHealth = createP(); // same for average health
  popCount = createP(); // same for population count
  t[0] = new Entity(new Genes([0.95, 490, -0.7, 65, 0]), null, true); // create with "optimal" genes
  for (var i = 1; i < initPop; i++) { // do this once for each member of the initial population
    t[i] = new Entity(null, null, false); // create an entity with random genes
  }
}

function windowResized() { // event that fires when the window is resized
  resizeCanvas(windowWidth, windowHeight); // change the canvas size
}

function mouseClicked() { // event for when the mouse is clicked
  var newVec = createVector(mouseX, mouseY); // create a vector where the mouse is located
  o[o.length] = new Obstacle(obstacleRadius, newVec); // create an obstacle and add it to the end of the list
}

function draw() { // draws on each frame
  background(27, 27, 27); // clear the image
  fps.html("FPS: " + frameRate()); // updates with the current framerate
  popCount.html("Population: " + t.length); // the current population size
  avgHealth.html("Average Health: " + calculateMean()); // shows the average health
  stroke(255); // outline in white
  noFill(); // don't fill
  ellipse(mouseX, mouseY, safeDiameter); // draw the circle around the mouse
  for (var i = 0; i < t.length; i++) { // iterate through each entity in the list
    if (t[i].dead) { // ignore if the entity is dead
      continue;
    }
    if (t[i].update()) { // if it's alive after the update
      t[i].reproduce(); // try to reproduce
      t[i].draw(); // display it
    } else {
      t.splice(i, 1); // remove it from the list
      i--; // decrement the index
    }
  }
  for (var j = 0; j < o.length; j++) { // iterate through each obstacle
    o[j].draw(); // draw each obstacle
  }
}
function calculateMean() { // calculate the average health
  var s = 0; // start the sum as 0
  for (var i = 0; i < t.length; i++) { // iterate through each entity
    s += t[i].health; // sum the health
  }
  s = s / t.length; // calculate the average by dividing by the total number of entites
  return (s / maxHealth) * 100; // calculate as a percentage
}
function Entity(genes, pos, artificial) { // class to hold entites
  this.artificial = artificial; // mark whether the entity was created manually
  this.health = maxHealth; // start each entity on max health
  this.vel = createVector(random(-0.1, 0.1), random(-0.1, 0.1)); // give each entity a small random velocity
  this.acc = createVector(random(-0.1, 0.1), random(-0.1, 0.1)); // same as above with random acceleration
  this.dead = false; // mark an entity as dead
  this.infected = false; // mark an entity as infected
  if (genes === null) { // if genes aren't specified
    this.genes = new Genes(null); // randomly generate genes
  } else { // otherwise
    this.genes = genes; // set genes
  }
  if (pos === null) { // if the position isn't set
    this.pos = createVector(random(width), random(height)); // create a random vector
  } else {
    this.pos = pos; // set the position to the specified coordinates
  }
  this.update = function() { // runs per frame
    active = false; // if the entity doesn't move, mark it as inactive to give it some random motion
    mousePos = createVector(mouseX, mouseY); // get the position of the mouse
    if (this.infected) { // if the entity is infected (has a disease)
      this.health -= 2; // reduce health
    }
    if (mousePos.dist(this.pos) > (safeDiameter / 2)) { // check if the entity is outside the safe zone
      this.health--; // reduce the health
      for (var i = 0; i < o.length; i++) { // check for each obstacle
        if (o[i].pos.dist(this.pos) < o[i].rad) { // check if the entity is inside any obstacles
          this.health -= 5; // reduce the health by 5
        }
      }
    } else { // otherwise if the entity is in the safe zone
      this.health += 2; // increment health by 2
    }
    if (this.health < 0) { // if the health is negative
      this.dead = true; // mark the entity as dead
      return false; // return as false
    }
    if (this.health > maxHealth) { // simple health cap code
      this.health = maxHealth;
    }
    if (mousePos.dist(this.pos) < this.genes.dna[1]) { // check if the target is inside the view range
      active = true; // mark the entity as moving
      desired = mousePos.sub(this.pos); // find the desired movement vector
      desired.setMag(this.genes.dna[0] * motionMultiplier); // modify with respect to the entity's genes
      steer = desired.sub(this.vel); // find the steering vector
      steer.limit(abs(this.genes.dna[0]) / 4); // keep within limit
      this.acc.add(steer); // add steering force
    }
    for (var u = 0; u < o.length; u++) { // iterates through each obstacle
      if (o[u].pos.dist(this.pos) < (this.genes.dna[3] + o[u].rad)) { // check if the obstacle is within viewing distance of the entity
        active = true; // mark as active (moving)
        desired = createVector(o[u].pos.x, o[u].pos.y).sub(this.pos); // do the same as above but with a different set of genes
        desired.setMag(this.genes.dna[2] * motionMultiplier);
        steer = desired.sub(this.vel);
        steer.limit(abs(this.genes.dna[2]) / 4);
        this.acc.add(steer);
      }
    }
    if (!active) { // if the entity isn't moving
      var wander = createVector(random(-this.genes.dna[4], this.genes.dna[4]), random(-this.genes.dna[4], this.genes.dna[4])); // give the triangle a small moving force
      wander.mult(0.001); // reduce the force
      this.acc.add(wander); // add it to acceleration
    }
    this.vel.add(this.acc); // increase velocity by the acceleration
    this.vel.limit(abs(this.genes.dna[0] * motionMultiplier)); // limit the velocity
    this.acc.mult(0); // reset acceleration
    this.pos.add(this.vel); // add velocity to position
    if (!active) { // if it wasn't moving
      this.vel.mult(0.999); // dampen the velocity
    }
    // standard boundary code
    if (this.pos.x < 0) {
      this.pos.x = width;
    }
    if (this.pos.x > width) {
      this.pos.x = 0;
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
    }
    return true; // tell the rest of the program that the entity is alive
  };
  this.reproduce = function() { // function to randomly reproduce
    if (this.artificial) {
      return; // don't let user created ones breed, as it ruins the point of random optimization
    }
    var diseaseRoll = random(1); // rolls a number between 0 and 1, to check whether the infection state should be toggled
    if ((!this.infected && (diseaseRoll < infectionChance)) || (this.infected && (diseaseRoll < cureChance))) { // decide based on whether the entity is already infected
      this.infected = !this.infected; // toggle infection state
    }
    if (random(1) < reproduceChance) { // if it rolls to reproduce
      var partnerFound = false; // mark the partner as not found
      var partner = null; // use a null to hold the current partner
      for (var q = 0; q < t.length; q++) { // randomly pick a partner
        partner = random(t); // choose a random entity from the list
        if (partner.artificial) { // ignore if the partner is manually inserted
          continue;
        }
        if (!partner.dead) { // if the partner is alive
          partnerFound = true; // mark the partner as found
          break; // exit the loop to prevent looking for another match
        }
      }
      if (partnerFound) { // only runs if the partner is found
        if (this.infected || partner.infected) { // if either partner is infected
          this.infected = true; // spread the disease
          partner.infected = true;
        } else { // otherwise if they are both healthy
          var newDNA = this.genes.mix(partner.genes); // create the new dna by mixing the two sets of genes
          t[t.length] = new Entity(newDNA, null, false); // append new entity to list with the specified dna
        }
      }
    }
  };
  this.draw = function() { // runs to display the entity
    push(); // push to avoid modifying the rest of the canvas
    translate(this.pos.x, this.pos.y); // move the canvas location relative to the location of the entity
    if (showViewCircle) { // if the setting to show the circle is enabled
      noFill(); // disable shape filling
      stroke(255, 0, 0, 127); // create a red stroke (with alpha of 127)
      ellipse(0, 0, this.genes.dna[3] * 2); // draw the radius of obstacle view range
      stroke(0, 255, 0, 127); // same as above but with blue, and with target view range
      ellipse(0, 0, this.genes.dna[1] * 2);
    }
    noStroke(); // disable stroke
    rotate(this.vel.heading() - 90); // rotate render canvas to the direction of the entity
    if (this.artificial) {
      fill(0, 255, 255, map(this.health, 0, maxHealth, 0, 255)); // draw in cyan if the entity is manual
    } else {
      if (this.infected) {
        fill(255, 0, 0, map(this.health, 0, maxHealth, 0, 255)); // draw in red if infected
      } else {
        fill(255, 255, 255, map(this.health, 0, maxHealth, 0, 255)); // otherwise draw it in white
      }
    }
    triangle(0, 30, -10, -10, 10, -10); // draw a small triangle relative to the origin
    pop(); // pop back into the main canvas
  };
}
function Obstacle(rad, pos) { // create a new obstacle
  this.rad = rad; // set the radius as defined
  this.pos = pos; // set the position (likely where the mouse is)
  this.draw = function() { // function to display the obstacle (circle)
    push(); // push so that the rest of the canvas isn't affected
    noStroke(); // disable stroke
    fill(255, 0, 0, 20); // fill translucent red 
    translate(this.pos.x, this.pos.y); // move to the location of the circle 
    ellipse(0, 0, this.rad * 2); // draw the circle
    pop(); // pop back to main canvas
  };
}
function Genes(dna) { // the class to hold genes
  if (dna === null) { // if the dna is currently null
    this.dna = []; // create an empty array
    this.dna[0] = random(-1, 1); // player attraction - opt is high
    this.dna[1] = random(0, 500); // player view range - opt is high
    this.dna[2] = random(-1, 1); // obstacle attraction - opt is low (negative)
    this.dna[3] = random(0, 500); // obstacle view range - opt is low (but enough to prevent collision)
    // this.dna[4] = random(0, 1); // wander magnitude (disabled)
    this.dna[4] = 0; // disable wandering as they end up shaking
  } else {
    this.dna = dna; // set the local dna to the passed in dna
  }
  this.mix = function(other) { // function to mix genes
    newDna = []; // empty array to hold new DNA
    for (var i = 0; i < this.dna.length; i++) { // do this for each gene
      if (random(1) < 0.5) { // if the roll is less than 0.5
        newDna[i] = this.dna[i]; // use the dna from this gene
      } else {
        newDna[i] = other.dna[i]; // use dna from other gene
      }
      if (random(1) < mutationChance) { // however if the roll is less than the mutation chance
        newDna[i] = new Genes(null).dna[i]; // pull genes from a random generated gene set
      }
    }
    return new Genes(newDna); // return the new set of genes
  };
}
// code dump

// rot = -(this.vel.heading() + 90);
// triangle(
//   this.pos.x + (30 * -sin(rot)), this.pos.y - (30 * cos(rot)),
//   this.pos.x + (10 * (-cos(rot) + sin(rot))), this.pos.y - (10 * (-sin(rot) - cos(rot))),
//   this.pos.x + (10 * (cos(rot) + sin(rot))), this.pos.y - (10 * (sin(rot) - cos(rot)))
// );
