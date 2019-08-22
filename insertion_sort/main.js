var p;
var g;
var s = 0;
var c = 0;
var items = [];
var sort_index = 0;
function setup() {
  createCanvas(windowWidth, windowHeight);
  p = createP();
  noStroke();
  p.html("Press any key to start.");
  background(27, 27, 27);
  g = height / width;
  fill(255, 255, 255);
  ellipse(0, 0, 10);
  for (var i = 0; i < width; i++) {
    items[i] = new Item(i);
  }
  for (var j = 0; j < width * 20; j++) {
    var ind_a = floor(random(width));
    var ind_b = floor(random(width));
    var tmp_a = items[ind_a];
    var tmp_b = items[ind_b];
    items[ind_a] = tmp_b;
    items[ind_b] = tmp_a;
  }
}

function draw() {
  background(27, 27, 27);
  for (var i = 0; i < items.length; i++) {
    items[i].draw(i);
  }
  sort_index++;
  c++;
  if (items[sort_index].val < items[sort_index - 1].val) {
    for (var k = 0; k < sort_index; k++) {
      var val_a = items[sort_index - k];
      var val_b = items[sort_index - (k + 1)];
      c++;
      if (val_a.val < val_b.val) {
        s++;
        items[sort_index - k] = val_b;
        items[sort_index - (k + 1)] = val_a;
      } else {
        k = sort_index;
	  }
    }
  }
  p.html("Comparisons: " + c + " | Swaps: " + s);
}

function Item(value) {
  this.val = value;
  this.draw = function(i) {
    fill(255, 255, 255);
    ellipse(i, floor(this.val * -g) + height, 2);
  };
}
