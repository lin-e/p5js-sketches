var msg; // the message element to display to the user
var fps; // the element that is updated with the frame rate
var pop_count; // the element that is updated with the current population size
var max_health = 1000; // the initial starting health for each entity
var sensor_distance = 50; // the distance from the entity where the entity's sensors sit
var sensor_constant = 0.05; // a constant to be tweaked to change how the sensors react
var reproduce_chance = 0.0007; // the probability that an entity will reproduce each frame
var mutation_chance = 0.0001; // the chance a new entity's gene will be random
var range = [-2, 2]; // the range of possible neuron weights

var ents = []; // the list of all entites
function setup() { // initial setup routine
  createCanvas(windowWidth, windowHeight); // creates the canvas to be the same size as the screen
  background(27, 27, 27); // sets the background to be #272727
  angleMode(DEGREES); // use degrees instead of radians
  colorMode(RGB); // use RGB over HSV
  msg = createP(); // create a p element
  msg.html("Genetic neural network."); // change the html
  fps = createP();
  pop_count = createP();
  for (var u = 0; u < 200; u++) { // create 200 entities
    ents[u] = new Entity(); // initialise the entity
  }
}

function getHealthiest() { // finds the healthiest entity
  var index = 0; // start searching at 0
  var highest_health = -1000; // set the highest health to a very low number (in theory -1 is enough)
  for (var i = 0; i < ents.length; i++) { // iterate through each entity
    if (ents[i].health > highest_health) { // if the health is higher than the current healthiest
      highest_health = ents[i].health; // set the highest health to the current entity's health
      index = i; // change the index
    }
  }
  return index; // returns the index
}

function windowResized() { // event for when the window is resized
  resizeCanvas(windowWidth, windowHeight); // change canvas size to be responsive
}

function draw() { // runs each frame
  background(27, 27, 27); // clears screen and sets background
  pop_count.html("Population: " + ents.length); // updates the current population size
  fps.html("FPS: " + frameRate()); // updates the framerate (more of a debug thing to be honest)
  fill(255); // sets the fill colour to be white
  ents[getHealthiest()].nn.draw(); // draws the healthiest neural network
  for (var u = 0; u < ents.length; u++) { // iterates through each entity
    if (ents[u].update()) { // if it is alive after the update
      ents[u].draw(); // draw it
      ents[u].reproduce(); // possibly reproduce
    } else { // otherwise it is dead
      ents.splice(u, 1); // remove it from the list
      u--; // decrements the counter 
    }
  }
}

function Entity() { // entity class
  this.nn = new NeuralNetwork(8, 2); // creates a neural network with 8 inputs (2 for each sensor) and 2 outputs (x and y movement)
  this.vel = createVector(0, 0); // creates zero vectors for acceleration and velocity
  this.acc = createVector(0, 0);
  this.pos = createVector(random(width), random(height)); // sets the initial location to somewhere random
  this.health = max_health; // sets initial health
  this.update = function() { // runs on update
    this.pos.add(this.vel); // update the position by velocity
    var sensors = this.sensor_vectors(); // calculates the sensor locations
    var cursor_pos = createVector(mouseX, mouseY); // gets the mouse location
    var calc = this.nn.calculate([ // calculates based on cursor location
      sensor_constant * sensors[0].dist(cursor_pos),
      0,
      sensor_constant * sensors[1].dist(cursor_pos),
      0,
      sensor_constant * sensors[2].dist(cursor_pos),
      0,
      sensor_constant * sensors[3].dist(cursor_pos),
      0
    ]);
    var acc = createVector(calc.get(0, 0), calc.get(0, 1)); // gets the corresponding components of the matrix multiplication
    this.vel.setMag(1); // normalises the vector (we don't want huge numbers)
    acc.setMag(0.5); // set the magnitude of the acceleration to half
    this.vel.add(acc); // add the acceleration to the velocity
    // standard boundary check
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
    if (cursor_pos.dist(this.pos) > (150 / 2)) { // negative reinforcement for the entity
      this.health -= 2; // decrease health if too far from player
    } else {
      this.health += 2; // increase health if close to player
      if (this.health > max_health) { // cap the health
        this.health = max_health;
      }
    }
    if (this.health < 0) { // if the health is negative
      return false; // mark entity as dead
    }
    return true; // otherwise the entity is alive
  };
  this.draw = function() {
    //this.nn.draw();
    push(); // push to avoid awkward graphic transformations
    translate(this.pos.x, this.pos.y); // move to the location
    noStroke(); // draw without a stroke
    rotate(this.vel.heading() - 90); // rotate plane to match the heading of the entity
    fill(255, 255, 255, map(this.health, 0, max_health, 0, 255)); // fill with a lerped opacity based on health
    triangle(0, 20, -10, -20, 10, -20); // simple triangle
    pop(); // pop
  };
  this.sensor_positions = function() { // calculation of sensor position based on matrix transformations
    var sin = math.sin(math.unit(this.vel.heading() - 90, 'deg')); // calculates the sine of the angle
    var cos = math.cos(math.unit(this.vel.heading() - 90, 'deg'));
    var mat_rot = new CustomMatrix(2, 2, 0); // creates a 2x2 rotation matrix, set with standard formula values
    mat_rot.set(0, 0, cos);
    mat_rot.set(1, 0, -sin);
    mat_rot.set(0, 1, sin);
    mat_rot.set(1, 1, cos);
    var positions = new CustomMatrix(2, 4, 0); // creates a matrix of points
    positions.set(0, 1, sensor_distance);
    positions.set(1, 0, sensor_distance);
    positions.set(2, 1, -sensor_distance);
    positions.set(3, 0, -sensor_distance);
    var mat_ret = new CustomMatrix(2, 4, 0); // creates a matrix of rotated points
    mat_ret.overwrite(math.multiply(mat_rot.values, positions.values)); // overwrites matrix with multiplied matrix
    for (var x = 0; x < mat_ret.w; x++) { // transforms each point
      mat_ret.set(x, 0, mat_ret.get(x, 0) + this.pos.x);
      mat_ret.set(x, 1, mat_ret.get(x, 1) + this.pos.y);
    }
    return mat_ret; // returns final positions
  };
  this.sensor_vectors = function() { // converts from the matrix form to a vector array
    var mat_pos = this.sensor_positions(); // gets the positions as a matrix
    var ret = []; // final array to return
    for (var i = 0; i < mat_pos.w; i++) { // iterates through each column
      ret[i] = createVector(mat_pos.get(i, 0), mat_pos.get(i, 1)); // creates the vector and add to array
    }
    return ret; // returns the final value
  };
  this.reproduce = function() { // reproduction function
    if (random(1) < reproduce_chance) { // randomly decides whether it should reproduce or not
      var partner = random(ents); // picks a random partner
      e = new Entity(); // creates a new entity
      e.nn = this.nn.mix(partner.nn); // mixes the genes (neuron weights)
      ents[ents.length] = e; // adds new entity to the list
    }
  };
}

function NeuralNetwork(inputs, outputs, raw) { // class for actual neural network
  // we have a constant of 1 in the input layer
  // we assume one layer, since it's not a complex task
  this.inputs = inputs;
  this.outputs = outputs;
  this.layer_size = math.ceil((this.inputs + 1 + this.outputs) / 2); // calculates layer size
  // assume network structure is A(i + 1, 1) -> B((i + 1 + o)/2, 1) -> C(o, 1), such that B = (mat_a)A, and C = (mat_b)B
  this.mat_a = new CustomMatrix(this.layer_size, this.inputs + 1);
  this.mat_b = new CustomMatrix(this.outputs, this.layer_size);
  this.calculate = function(raw_input) { // actual matrix calculation
    // technically we should error out when the input lengths don't match
    var input_matrix = new CustomMatrix(raw_input.length + 1, 1, 1); // remember the constant of 1
    for (var k = 0; k < raw_input.length; k++) { // copies the input into the input matrix
      input_matrix.set(0, k, raw_input[k]); // sets the values (the constant of 1 is preset)
    }
    var hidden_layer = math.multiply(this.mat_a.values, input_matrix.values); // multiply to get the hidden layer
    for (var n = 0; n < this.layer_size; n++) { // applies the sigmoid function onto the hidden layer
      hidden_layer[n][0] = sigmoid(hidden_layer[n][0]);
    }
    var output_layer = math.multiply(this.mat_b.values, hidden_layer); // multiplies to get output layer
    var output_matrix = new CustomMatrix(this.outputs, 1, 1); // sets the matrix values
    output_matrix.overwrite(output_layer); // overwrites the matrix
    return output_matrix; // returns the matrix
  };
  this.draw = function() { // the code below simply displays the network structure and visualises the weighting
    // config (general stuff we can ignore)
    var items = [this.inputs + 1, this.layer_size, this.outputs];
    var node_locations = [[], [], []];
    var max = math.max(items);
    var width = 30;
    var padding = 10;
    var offset = [50, 70];
    var total_height = ((width + padding) * max) - padding;
    var low = color(255, 0, 0);
    var high = color(0, 0, 255);
    // locate nodes
    var x = offset[0] + (width / 2);
    for (var j = 0; j < 3; j ++) {
      y = offset[1] + ((total_height - (((width + padding) * items[j]) - padding)) / 2) + (width / 2);
      for (var k = 0; k < items[j]; k++) {
        node_locations[j][k] = [x, y];
        y = y + width + padding;
      }
      x = x + padding + (width * 4);
    }
    // draw neurons
    for (var e = 0; e < this.mat_a.h; e++) {
      for (var f = 0; f < this.mat_a.w; f++) {
        var weight = this.mat_a.get(f, e);
        stroke(lerpColor(low, high, map(weight, range[0], range[1], 0, 1)));
        var point_a = node_locations[0][f];
        var point_b = node_locations[1][e];
        line(point_a[0], point_a[1], point_b[0], point_b[1]);
      }
    }
    for (var e = 0; e < this.mat_b.h; e++) {
      for (var f = 0; f < this.mat_b.w; f++) {
        var weight = this.mat_b.get(f, e);
        stroke(lerpColor(low, high, map(weight, range[0], range[1], 0, 1)));
        var point_a = node_locations[1][f];
        var point_b = node_locations[2][e];
        line(point_a[0], point_a[1], point_b[0], point_b[1]);
      }
    }
    // draw nodes
    stroke(255);
    for (var o = 0; o < 3; o++) {
      locations = node_locations[o];
      for (var p = 0; p < locations.length; p++) {
        ellipse(locations[p][0], locations[p][1], width);
      }
    }
  };
  this.mix = function(other) { // mixes the neuron weights with another network
    var nn = new NeuralNetwork(this.inputs, this.outputs); // creates a new network of the same size
    for (var x = 0; x < nn.mat_a.w; x++) { // iterates through width of the first matrix
      for (var y = 0; y < nn.mat_a.h; y++) { // iterates through height of the first matrix
        if (random(1) < mutation_chance) { // if it should mutate
          if (random(1) < 0.5) { // if the random is less than 0.5, use this network's genes
            nn.mat_a.set(x, y, this.mat_a.get(x, y));
          } else { // otherwise use the other network's
            nn.mat_a.set(x, y, other.mat_a.get(x, y));
          }
        } else { // otherwise create a random weight
          nn.mat_a.set(x, y, math.random(range[0], range[1]));
        }
      }
    }
    // exact same as above, but for matrix b
    for (var x = 0; x < nn.mat_b.w; x++) {
      for (var y = 0; y < nn.mat_b.h; y++) {
        if (random(1) > mutation_chance) {
          if (random(1) < 0.5) {
            nn.mat_b.set(x, y, this.mat_b.get(x, y));
          } else {
            nn.mat_b.set(x, y, other.mat_b.get(x, y));
          }
        } else {
          nn.mat_b.set(x, y, math.random(range[0], range[1]));
        }
      }
    }
    return nn; // returns the final network
  };
}

function CustomMatrix(h, w, v) { // a very simple matrix handler, allows for me to use the functions with math.js but in my own layout
  this.h = h;
  this.w = w;
  this.values = [];
  for (var y = 0; y < this.h; y++) {
    var new_row = [];
    for (var x = 0; x < this.w; x++) {
      if (v == null) {
        new_row[x] = math.random(range[0], range[1]);
      } else {
        new_row[x] = v;
      }
    }
    this.values[y] = new_row;
  }
  this.get = function(x, y) {
    return this.values[y][x];
  };
  this.set = function(x, y, val) {
    this.values[y][x] = val;
  };
  this.overwrite = function(dataset) {
    this.values = dataset;
  };
}

function sigmoid(value) {
  return 1 / (1 + math.pow(math.e, -1 * value));
}
