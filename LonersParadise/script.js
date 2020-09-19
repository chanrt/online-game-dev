// screen params
let screen_width = window.innerWidth, screen_height = window.innerHeight;
let fps = 24;

// canvas params
let canvas_height = 0.8 * screen_height, canvas_width = 1.6 * canvas_height;
let canvas_x = (screen_width - canvas_width) / 2, canvas_y = (screen_height - canvas_height) / 2;

// animation
let animate = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || function (callback) {
        window.setTimeout(callback, 1000 / fps);
    };

// canvas
let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");

canvas.style.left = canvas_x + "px";
canvas.style.top = canvas_y + "px";
canvas.width = canvas_width;
canvas.height = canvas_height;
canvas.style.position = "absolute";
context.font = "30px Arial";

// colors
let colors = [];
colors.push("#fe4a49", "#fed766", "#851e3e", "#ee4035", "#fdf498", "#4b3832", "#3c2f2f", "#d62d20", "#ffa700", "#00b159", "#c68642");
function getColor() {
    return colors[Math.floor(Math.random() * colors.length)];
};

// music
let srcs = [];
srcs.push(
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fbrahms.mp3?v=1600188944237",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fcanon_d.mp3?v=1600188946298",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fcomptine.mp3?v=1600188949357",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Ffur_elise.mp3?v=1600188950704",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fmariage.mp3?v=1600188953661",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fnocturne.mp3?v=1600188958595",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Friver.mp3?v=1600188962620",
    "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fsilent_night.mp3?v=1600188964803",
);
let music, music_num, music_played = [];

// event handling
let left_press = false, right_press = false, up_press = false, down_press = false;
window.addEventListener("keydown", event => {
    if (event.keyCode == 37 || event.key == 'a') {
        left_press = true;
    }
    if (event.keyCode == 38 || event.key == 'w') {
        up_press = true;
    }
    if (event.keyCode == 39 || event.key == 'd') {
        right_press = true;
    }
    if (event.keyCode == 40 || event.key == 's') {
        down_press = true;
    }
});

window.addEventListener("keyup", event => {
    if (event.keyCode == 37 || event.key == 'a') {
        left_press = false;
    }
    if (event.keyCode == 38 || event.key == 'w') {
        up_press = false;
    }
    if (event.keyCode == 39 || event.key == 'd') {
        right_press = false;
    }
    if (event.keyCode == 40 || event.key == 's') {
        down_press = false;
    }
});

// difficulty params
let momentum_transfer = false;
let platform_stopper = false;

// environmental factors
let env = {
    accn_gravity: 0.3,
    terminal_velocity: 50,
    air_resistance: 0.01,
    time_speed: 0.1,

    day_green: 204,
    day_blue: 255,

    night_green: 17,
    night_blue: 68,
}

// terrain generating factors
let seed = {
    grnd: {
        min_width: 250,
        max_width: 600,

        min_height: 40,
        max_height: 70,
    },
    ptfm: {
        width: 200,
        height: 20,
        speed: 3,
        gap_x: 30,
        gap_y: 30,
    },
    gaps: {
        short: {
            min_x: 100,
            max_x: 200,

            min_y: 100,
            max_y: 150,
        },
        long: {
            min_x: 400,
            max_x: 800,

            min_y: 300,
            max_y: 500,
        },
    },
    dirn: {
        up_bias: 65,
        down_bias: 100,
        same_bias: 100,
    }
}

// helper functions for generating terrain
function getGrndWidth() {
    return randInt(seed.grnd.min_width, seed.grnd.max_width);
}

function getGrndHeight() {
    return randInt(seed.grnd.min_height, seed.grnd.max_height);
}

function getShortGapX() {
    return randInt(seed.gaps.short.min_x, seed.gaps.short.max_x);
}

function getShortGapY() {
    return randInt(seed.gaps.short.min_y, seed.gaps.short.min_y);
}

function getLongGapX() {
    return randInt(seed.gaps.long.min_x, seed.gaps.long.max_x);
}

function getLongGapY() {
    return randInt(seed.gaps.long.min_y, seed.gaps.long.min_y);
}

function getDirn() {
    let dirn = randInt(0, 100);

    if (dirn < seed.dirn.up_bias)
        return -1;
    else
        return +1;
}

function isGapXLong() {
    let factor = randInt(0, 10);

    if (factor > 6) return true;
    else return false;
}

function isGapYLong() {
    let factor = randInt(0, 10);

    if (factor > 6) return true;
    else return false;
}

class Time {
    constructor() {
        this.green = env.day_green;
        this.blue = env.day_blue;
        this.night = false;
    }
    pass() {
        if (!this.night) {
            // progress towards night
            this.green -= env.time_speed;
            this.blue -= env.time_speed;

            if (this.blue <= env.night_blue) {
                // night reached
                this.night = true;
            }
        }
        else {
            // progress towards day
            this.green += env.time_speed;
            this.blue += env.time_speed;

            if (this.blue >= env.day_blue) {
                // day reached
                this.night = false;
            }
        }
    }
    getSkyColor() {
        return `#00${Math.floor(this.green).toString(16)}${Math.floor(this.blue).toString(16)}`;
    }
    clear() {
        this.green = env.day_green;
        this.blue = env.day_blue;
        this.night = false;
    }
}
let time = new Time();

// terrain class
class Terrain {
    constructor() {
        this.data = [];

        this.generated_x = 0;
        this.generate_default();
        this.generate_terrain(10000);
    }

    generate_default() {
        this.data.push(
            {
                type: "ground",
                x: 50,
                y: canvas_height / 2 + 30,
                width: 3 * canvas_width / 4,
                height: 50,
                color: getColor(),
            }, // starting platform
        );

        this.generated_x = (3 * canvas_width / 4);
    }

    generate_terrain(until) {
        while (this.generated_x < until) {
            let anchor_x = this.data[this.data.length - 1].x + this.data[this.data.length - 1].width;
            let anchor_y = this.data[this.data.length - 1].y;

            let gap_x_long = isGapXLong();
            let gap_y_long = isGapYLong();

            let dirn = getDirn();
            let ground_width = getGrndWidth();

            if (!gap_x_long && !gap_y_long) {
                let gap_x = getShortGapX();
                let gap_y = getShortGapY();

                this.data.push({
                    type: "ground",
                    x: anchor_x + gap_x,
                    y: anchor_y + (dirn * gap_y),
                    width: ground_width,
                    height: getGrndHeight(),
                    color: getColor(),
                })
                this.generated_x += (gap_x + ground_width);
            }
            else if (gap_x_long && !gap_y_long) {
                let gap_x = getLongGapX();
                let gap_y = getShortGapY();

                this.data.push({
                    type: "ptfm",
                    x: anchor_x,
                    y: anchor_y + (dirn * gap_y / 2),
                    width: seed.ptfm.width,
                    height: seed.ptfm.height,
                    horizontal: true,
                    vertical: false,
                    x1: anchor_x + seed.ptfm.gap_x,
                    x2: anchor_x + gap_x - seed.ptfm.width - seed.ptfm.gap_x,
                    progressive: true,
                    speed: seed.ptfm.speed,
                    color: getColor(),
                });

                this.data.push({
                    type: "ground",
                    x: anchor_x + gap_x,
                    y: anchor_y + (dirn * gap_y),
                    width: ground_width,
                    height: getGrndHeight(),
                    color: getColor(),
                })
                this.generated_x += (gap_x + ground_width);
            }
            else if (!gap_x_long && gap_y_long) {
                let gap_x = getShortGapX();
                let gap_y = getLongGapY();

                if (gap_x < seed.ptfm.width + 2 * seed.ptfm.gap_x) {
                    gap_x = seed.ptfm.width + 2 * seed.ptfm.gap_x;
                }

                this.data.push({
                    type: "ptfm",
                    x: anchor_x + (gap_x - seed.ptfm.width) / 2,
                    y: anchor_y,
                    width: seed.ptfm.width,
                    height: seed.ptfm.height,
                    horizontal: false,
                    vertical: true,
                    y1: Math.min(anchor_y + seed.ptfm.gap_y, anchor_y + (dirn * gap_y) - seed.ptfm.gap_y),
                    y2: Math.max(anchor_y + seed.ptfm.gap_y, anchor_y + (dirn * gap_y) - seed.ptfm.gap_y),
                    progressive: false,
                    speed: seed.ptfm.speed,
                    color: getColor(),
                });

                this.data.push({
                    type: "ground",
                    x: anchor_x + gap_x,
                    y: anchor_y + (dirn * gap_y),
                    width: ground_width,
                    height: getGrndHeight(),
                    color: getColor(),
                })
                this.generated_x += (gap_x + ground_width);
            }
            else if (gap_x_long && gap_y_long) {
                continue;
            }
        }
    }

    render() {
        for (let entity of this.data) {
            context.fillStyle = entity.color;
            context.fillRect(entity.x, entity.y, entity.width, entity.height);
        }
    }

    move(speed_x, speed_y) {
        for (let entity of this.data) {
            entity.x -= speed_x;
            entity.y -= speed_y;

            if (entity.type == "ptfm") {
                if (entity.horizontal && !entity.vertical) {
                    entity.x1 -= speed_x;
                    entity.x2 -= speed_x;

                    entity.x += entity.speed;

                    if (entity.x > entity.x2) {
                        entity.x = entity.x2;
                        entity.speed = - entity.speed;
                    }
                    else if (entity.x < entity.x1) {
                        entity.x = entity.x1;
                        entity.speed = - entity.speed;
                    }
                }
                else if (entity.vertical && !entity.horizontal) {
                    entity.y1 -= speed_y;
                    entity.y2 -= speed_y;
                    if (entity.progressive) {
                        entity.y += entity.speed;
                        if (entity.y > entity.y2) {
                            entity.y = entity.y2;
                            entity.progressive = false;
                        }
                    }
                    else {
                        entity.y -= entity.speed;
                        if (entity.y < entity.y1) {
                            entity.y = entity.y1;
                            entity.progressive = true;
                        }
                    }
                }
            }
        }
        this.generated_x -= speed_x;

        if (this.generated_x < 2 * canvas_width) {
            this.generate_terrain(10000);
        };
    }

    on_ground(x, y) {
        for (let entity of this.data) {
            if (entity.type == "ground") {
                if (entity.x < x && x < entity.x + entity.width && entity.y < y && y < entity.y + entity.height) {
                    return true;
                }
            }
        }
        return false;
    }

    on_platform(x, y) {
        for (let entity of this.data) {
            if (entity.type == "ptfm") {
                if (entity.x < x && x < entity.x + entity.width && entity.y < y && y < entity.y + entity.height) {
                    return { on: true, speed: entity.speed, horizontal: entity.horizontal, vertical: entity.vertical };
                }
            }
        }
        return { on: false };
    }

    in_rect(x, y) {
        for (let entity of this.data) {
            if (entity.x < x && x < entity.x + entity.width && entity.y < y && y < entity.y + entity.height) {
                return true;
            }
        }
        return false;
    };
    clear() {
        this.data = [];
        this.generated_x = 0;

        this.generate_default();
        this.generate_terrain(10000);
    }
}

// player class
class Player {
    constructor() {
        this.x = canvas_width / 2;
        this.y = canvas_height / 2;
        this.displacement = 0;

        this.radius = 30;
        this.angle = 0;

        this.speed_x = 0;
        this.speed_y = 0;
        this.ptfm_speed_x = 0;
        this.ptfm_speed_y = 0;

        this.wheel = document.createElement("img");
        this.wheel.src = "https://cdn.glitch.com/72f48dd3-255a-4bad-bc06-4ead87e44e57%2Fplayer_wheel.png?v=1599933136224";

        this.accn_y = 10;
        this.accn_x = 0.1;
        this.dccn_x = 0.1;
        this.max_speed = 7;

        this.on_ground = true;
        this.on_platform = false;
    };

    move() {
        let ptfm_data = terrain.on_platform(this.x, this.y + this.radius);

        // ground below check
        if (terrain.on_ground(this.x, this.y + this.radius)) {
            this.stabilize();
            this.speed_y = 0;
            this.on_platform = false;
            this.on_ground = true;
        }
        else if (ptfm_data.on) {
            this.stabilize();
            this.on_ground = false;
            this.on_platform = true;

            if (ptfm_data.horizontal) {
                this.ptfm_speed_x = ptfm_data.speed;
                this.speed_y = 0;
            }
            else if (ptfm_data.vertical) {
                this.ptfm_speed_y = ptfm_data.speed;
                this.speed_y = 0;
            }
        }
        else {
            this.on_ground = false;
            this.speed_y += env.accn_gravity;
        }
        if (ptfm_data.on == false) {
            this.ptfm_speed_x = this.ptfm_speed_y = 0;
        }

        if (this.on_ground || this.on_platform) {
            // left and right movements
            if (left_press && !right_press) {
                if (this.speed_x - this.accn_x > -this.max_speed) {
                    this.speed_x -= this.accn_x;
                }
            }
            else if (right_press && !left_press) {
                if (this.speed_x + this.accn_x < this.max_speed) {
                    this.speed_x += this.accn_x;
                }
            }
            // deceleration on ground
            else if (!left_press && !right_press) {
                if (this.speed_x > 0) {
                    this.speed_x -= this.dccn_x;
                    if (this.speed_x < 0) {
                        this.speed_x = 0;
                    }
                }
                else if (this.speed_x < 0) {
                    this.speed_x += this.dccn_x;
                    if (this.speed_x > 0) {
                        this.speed_x = 0;
                    }
                }
            }
            // going into air
            if (up_press) {
                this.speed_y -= this.accn_y;
                this.on_ground = false;
                this.on_platform = false;

                if (momentum_transfer) {
                    this.speed_x += this.ptfm_speed_x;
                    this.speed_y += this.ptfm_speed_y;
                }

                this.ptfm_speed_x = this.ptfm_speed_y = 0;
            }
            if (down_press) {
                this.speed_x = 0;
            }
        }

        // horizontal collission checks
        if (this.speed_x < 0) {
            if (terrain.in_rect(this.x - this.radius, this.y)) {
                this.speed_x = 0;
            }
        }
        else if (this.speed_x > 0) {
            if (terrain.in_rect(this.x + this.radius, this.y)) {
                this.speed_x = 0;
            }
        }

        if (this.speed_y >= env.terminal_velocity) {
            restart_game();
        }

        this.angle += this.speed_x / this.radius;
        this.displacement += this.speed_x;
    };

    render() {
        context.drawImage(this.wheel, - this.wheel.width / 2, - this.wheel.height / 2);
    };

    stabilize() {
        while (!terrain.in_rect(this.x, this.y + this.radius) && terrain.in_rect(this.x, this.y + this.radius)) {
            terrain.move(0, -1);
        }
    }
    reset() {
        this.x = canvas_width / 2;
        this.y = canvas_height / 2;
        this.displacement = 0;
        this.angle = 0;

        this.speed_x = 0;
        this.speed_y = 0;
        this.ptfm_speed_x = 0;
        this.ptfm_speed_y = 0;

        this.on_ground = true;
        this.on_platform = false;
    }
};

// game objects
let terrain = new Terrain();
let player = new Player();

// core update function
function update() {
    player.move();
    terrain.move(player.speed_x + player.ptfm_speed_x, player.speed_y - player.ptfm_speed_y);
    time.pass();
};

// core rendering function
function render() {
    context.fillStyle = time.getSkyColor();
    context.fillRect(0, 0, canvas_width, canvas_height);

    context.save();
    context.translate(canvas_width / 2, canvas_height / 2);
    context.rotate(player.angle);
    player.render();
    context.restore();

    terrain.render();
    context.fillStyle = "#fe4a49";
    context.fillText(`${Math.floor(player.displacement)}`, 50, 50);
}

// game starting function
window.onload = function () {
    music_num = randInt(0, 8);
    music = new Audio(srcs[music_num]);
    music_played.push(music_num);
    music.play();

    document.body.appendChild(canvas);
    animate(step);
}

// game looping function
function step() {
    update();
    render();
    animate(step);
};

function restart_game() {

    music.pause();

    if (music_played.length == srcs.length) {
        music_played = [];
    }
    while (music_played.includes(music_num)) {
        music_num = randInt(0, 8);
    }
    music = new Audio(srcs[music_num]);
    music_played.push(music_num);
    music.play();

    player.reset();
    terrain.clear();
    time.clear();
}

// helper functions
function randInt(lower, upper) {
    return (Math.floor(Math.random() * (upper - lower + 1)) + lower);
}

function getSin(angle) {
    return Math.sin(Math.PI * angle / 180);
}

function getCos(angle) {
    return Math.cos(Math.PI * angle / 180);
};

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    // true for mobile device
    alert("Sorry, but this game is playable only on desktop!");
  }else{
    // false for not mobile device
  }
  





