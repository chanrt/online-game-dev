// screen params

let screen_width = window.innerWidth, screen_height = window.innerHeight;
let canvas_width = 1000, canvas_height = 550;
let canvas_x = (screen_width - canvas_width) / 2, canvas_y = (screen_height - canvas_height) / 2;
let fps = 30;

// game params

let paddle_width = 100, paddle_height = 12, paddle_speed = 5, paddle_gap = 30;
let player_tolerance = 0;
let ball_radius = 5, ball_speed = 5;
let upper_deflect = 1.2, lower_deflect = 0.5;
let upper_rebound = 0.95, lower_rebound = 0.85
let is_paused, shown_deflect = false;

// animation

let animate = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || function (callback) {
        window.setTimeout(callback, 1000 / fps);
    };

let canvas = document.createElement("canvas");
let context = canvas.getContext('2d');

canvas.style.left = canvas_x + "px";
canvas.style.top = canvas_y + "px";
canvas.width = canvas_width;
canvas.height = canvas_height;
canvas.style.position = "absolute";

// UI elements

function show() {
    for (let element of arguments) {
        element.style.display = "block";
    }
}

function hide() {
    for (let element of arguments) {
        element.style.display = "none";
    }
}

let start_button = document.getElementById("start");
let pause_button = document.getElementById("pause");
let resume_button = document.getElementById("resume");
let restart_button = document.getElementById("restart");
let about_button = document.getElementById("about");

hide(pause_button, resume_button, restart_button);

function start_game() {
    is_paused = false;
    hide(start_button, about_button);
    show(pause_button, restart_button);
};

function pause_game() {
    is_paused = true;
    hide(pause_button);
    show(resume_button, about_button);
}

function resume_game() {
    is_paused = false;
    hide(resume_button, about_button);
    show(pause_button);
}

function restart_game() {
    is_paused = true;
    hide(pause_button, resume_button, restart_button);
    show(start_button, about_button);
    restart();
}

function display_about() {
    alert("Developed by ChanRT");
}

// sounds

let wall_hit = new Audio("https://cdn.glitch.com/8417d58b-d44c-41ba-be91-392e8ef78c14%2Fwall_hit.wav?v=1599147339524");
let fail_sound = new Audio("https://cdn.glitch.com/8417d58b-d44c-41ba-be91-392e8ef78c14%2Ffail.wav?v=1599149353825");
let paddle_hit = new Audio("https://cdn.glitch.com/8417d58b-d44c-41ba-be91-392e8ef78c14%2Fbar_hit.wav?v=1599148882047");

// starts game

window.onload = function () {
    document.body.appendChild(canvas);
    is_paused = true;
    alert("This game is playable only on desktop (as of now)\nClick on the blue background if you're unable to hear sounds");

    animate(step);
};

// events

let keys_down = {};

window.addEventListener("keydown", event => {
    if (is_paused == true) {
        is_paused = false;
        hide(start_button, resume_button);
        show(pause_button, restart_button);
    }
    keys_down[event.keyCode] = true;

    if (event.key == "Escape") {
        if (!is_paused) pause_game();
        else resume_game();
    }
})
window.addEventListener("keyup", event => {
    delete keys_down[event.keyCode];
})

function rand(upper, lower) {
    return (Math.random() * (upper - lower)) + lower;
}

// game object classes

class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0;
        this.score = 0;

        this.target = canvas_width / 2;
        this.target_set = false;
        this.target_reached = false;
    };

    render() {
        context.fillStyle = "#FFFFFF";
        context.fillRect(this.x, this.y, paddle_width, paddle_height);
    }

    move() {
        this.speed = 0;
        for (let key in keys_down) {
            let value = Number(key);

            if (value == 37) {
                this.move_left();
            }
            if (value == 39) {
                this.move_right();
            }
        }
    }

    ai() {
        if (!this.target_set) {
            if (ball.speed_y > 0 && ball.y > canvas_height / 4) {
                this.target = canvas_width / 2;
                this.target_set = true;
                this.target_reached = false;
            }
            else if (ball.speed_y < 0) {
                let ball_x = ball.x, ball_y = ball.y;
                let ball_vx = ball.speed_x, ball_vy = ball.speed_y;

                while (ball_y > paddle_gap) {
                    ball_x += ball_vx;
                    ball_y += ball_vy;

                    if (ball_x - ball_radius < 0) {
                        ball_x = ball_radius;
                        ball_vx = - ball_vx;
                    }
                    else if (ball_x + ball_radius > canvas_width) {
                        ball_x = canvas_width - ball_radius;
                        ball_vx = - ball_vx;
                    }
                }
                this.target = ball_x;
                this.target_set = true;
            }
        }

        if (!this.target_reached) {
            if (this.x + (paddle_width / 2) - paddle_speed < this.target && this.target < this.x + (paddle_width / 2) + paddle_speed)
                this.target_reached = true;
            else if (this.x + paddle_width / 2 > this.target)
                this.move_left();
            else if (this.x + paddle_width / 2 < this.target)
                this.move_right();
        }
        else if (this.target_reached && ball.speed_y < 0 && ball.y - paddle_gap < 25) {
            if (Math.abs(player.x - this.x) > 10) {
                if (player.x > this.x)
                    this.move_left();
                else if (player.x < this.x)
                    this.move_right();
            }
            else {
                if (Math.random() > 0.5)
                    this.move_left();
                else
                    this.move_right();
            }
        }
    }

    move_left() {
        if (this.x > 0) {
            this.x -= paddle_speed;
            this.speed = -paddle_speed;
        }
    };

    move_right() {
        if (this.x + paddle_width < canvas_width) {
            this.x += paddle_speed;
            this.speed = paddle_speed;
        }
    };
};

class Ball {
    constructor(x, y, speed_x = 0, speed_y = ball_speed) {
        this.x = x;
        this.y = y;
        this.speed_x = speed_x;
        this.speed_y = speed_y;
    };

    render() {
        context.beginPath();
        context.arc(this.x, this.y, ball_radius, 0, 2 * Math.PI, false);
        context.fillStyle = "#FFFFFF";
        context.fill();
    };

    move() {
        this.x = this.x + this.speed_x;
        this.y = this.y + this.speed_y;

        if (this.x - ball_radius < 0) {
            this.x = ball_radius;
            this.speed_x = - this.speed_x;
            wall_hit.play();
        }
        else if (this.x + ball_radius > canvas_width) {
            this.x = canvas_width - ball_radius;
            this.speed_x = - this.speed_x;
            wall_hit.play();
        }

        if (this.y > player.y - player_tolerance && this.y < player.y + paddle_height) {
            if (this.x > player.x && this.x < player.x + paddle_width) {
                this.y = player.y;

                this.speed_x = this.deflect(player.speed);
                this.speed_y = - this.speed_y;

                computer.target_set = false;
                computer.target_reached = false;

                paddle_hit.play();
            }
            else
                fail_sound.play();
        }
        else if (this.y > computer.y && this.y < computer.y + paddle_height) {
            if (this.x > computer.x && this.x < computer.x + paddle_width) {
                this.y = computer.y + paddle_height;

                this.speed_x = this.deflect(computer.speed);
                this.speed_y = - this.speed_y;

                computer.target_set = false;
                computer.target_reached = false;

                paddle_hit.play();
            }
            else
                fail_sound.play();
        }

        if (this.y < 0) {
            player.score++;
            this.respawn();
        }
        else if (this.y > canvas_height) {
            computer.score++;
            this.respawn();

            if (!shown_deflect) {
                alert("The computer always tries to deflect the ball away from your reach. " +
                    "You should do the same!\n" +
                    "When the ball is about to touch your paddle, steer in the opposite direction (for a split second) in order to deflect the ball");
                    shown_deflect = true;
            }
        }
    };

    respawn() {
        this.x = canvas_width / 2;
        this.y = canvas_height / 2;
        this.speed_x = 0;
        this.speed_y = ball_speed;

        player.x = canvas_width / 2 - paddle_width / 2;
    };

    deflect(deflector_speed) {
        if (this.speed_x == 0)
            return deflector_speed;
        else if (deflector_speed * this.speed_x < 0)
            return rand(upper_deflect, lower_deflect) * deflector_speed;
        else
            return rand(upper_rebound, lower_rebound) * this.speed_x;
    }
};

// game objects

let player = new Paddle((canvas_width - paddle_width) / 2, canvas_height - paddle_gap);
let computer = new Paddle((canvas_width - paddle_width) / 2, paddle_gap - paddle_height);
let ball = new Ball(canvas_width / 2, canvas_height / 2);

// infinite loop functions

function step() {
    update();
    render();
    animate(step);
};

function update() {
    if (!is_paused) {
        ball.move();
        player.move();
        computer.ai();
    }
}

function render() {
    context.fillStyle = "#000000"
    context.fillRect(0, 0, canvas_width, canvas_height);

    context.font = "30px Arial";
    context.fillStyle = "#555555";
    context.textAlign = "center";
    context.fillText(`${computer.score}`, canvas_width / 2, canvas_height / 4);
    context.fillText(`${player.score}`, canvas_width / 2, 3 * canvas_height / 4);

    player.render();
    computer.render();
    ball.render();
}

function restart() {
    player.x = (canvas_width - paddle_width) / 2;
    computer.x = (canvas_width - paddle_width) / 2;

    player.score = 0;
    computer.socre = 0;

    ball.respawn();
}