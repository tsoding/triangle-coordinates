const BACKGROUND               = "#141414";
const WHITE                    = "#FFFFFF";
const RED                      = "#FF2020";
const CYAN                     = "#20FFFF";
const MARKER_RADIUS            = 0.03;
const MARKER_ENLARGMENT_FACTOR = 1.2;
const FRAME_THICKNESS          = 0.01
const TRIANGLE_RADIUS          = 0.30;
const TRIANGLE                 = 3;

game.width = 800
game.height = 600
const ctx = game.getContext("2d");

function screenCenter() {
    return {
        x: game.width/2,
        y: game.height/2,
    }
}

function fillCircle({x, y}, r, color) {
    ctx.fillStyle = color
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
}

function drawLine({x: x1, y: y1}, {x: x2, y: y2}, thickness, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function polar(angle) {
    return {
        x: Math.cos(angle),
        y: Math.sin(angle),
    }
}

function v2scale({x, y}, s) {
    return {
        x: x*s,
        y: y*s,
    }
}

function v2add({x: x1, y: y1}, {x: x2, y: y2}) {
    return {
        x: x1 + x2,
        y: y1 + y2,
    }
}

function v2sub({x: x1, y: y1}, {x: x2, y: y2}) {
    return {
        x: x1 - x2,
        y: y1 - y2,
    }
}

function v2len({x, y}) {
    return Math.sqrt(x*x + y*y);
}

function v2dist(p1, p2) {
    return v2len(v2sub(p2, p1));
}

function v2lerp(p1, p2, t) {
    return v2add(p1, v2scale(v2sub(p2, p1), t));
}

function triangleCorner(center, i) {
    const angle = 2*Math.PI/TRIANGLE;
    let v = polar((angle)*i + Math.PI/4);
    v = v2scale(v, game.height*TRIANGLE_RADIUS);
    v = v2add(v, center);
    return v;
}

function coordinates(p1, p2, p3, p) {
    const dy13 = p3.y - p1.y;
    const dy12 = p2.y - p1.y;
    const dy1  = p.y  - p1.y;
    const dx13 = p3.x - p1.x;
    const dx12 = p2.x - p1.x;
    const dx1  = p.x  - p1.x;

    const t = (dy13 - dy12)*dx1 - (dx13 - dx12)*dy1;
    const a = dx12*dy13 - dx13*dy12;
    const b = dx12*dy1  - dx1*dy12;
    return {
        t1: t/a,
        t2: b/t,
    }
}

function inverseCoordinates(p1, p2, p3, t1, t2) {
    const dp12 = v2sub(p2, p1);
    const dp13 = v2sub(p3, p1);
    let p = p1;
    p = v2add(p, v2scale(dp12, t1));
    p = v2add(p, v2scale(v2sub(dp13, dp12), t1*t2));
    return p
}

let ps = [
    screenCenter(),
    triangleCorner(screenCenter(), 0),
    triangleCorner(screenCenter(), 1),
    triangleCorner(screenCenter(), 2),
]
let dragging = -1;
let highlighted = [0, 0, 0, 0];

function clamp(x, lo, hi) {
    if (isNaN(x)) return lo;
    return Math.min(Math.max(x, lo), hi);
}

function redrawScene() {
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, game.width, game.height);

    let {t1, t2} = coordinates(ps[1], ps[2], ps[3], ps[0]);
    t1 = clamp(t1, 0, 1);
    t2 = clamp(t2, 0, 1);
    ps[0] = inverseCoordinates(ps[1], ps[2], ps[3], t1, t2);

    drawLine(v2lerp(ps[1], ps[2], t1), v2lerp(ps[1], ps[3], t1), game.height*FRAME_THICKNESS, CYAN);
    drawLine(ps[1], v2lerp(v2lerp(ps[1], ps[2], t1), v2lerp(ps[1], ps[3], t1), 0.5), game.height*FRAME_THICKNESS, CYAN);

    drawLine(ps[1], ps[2], game.height*FRAME_THICKNESS, RED);
    drawLine(ps[2], ps[3], game.height*FRAME_THICKNESS, RED);
    drawLine(ps[3], ps[1], game.height*FRAME_THICKNESS, RED);

    fillCircle(ps[1], highlighted[1] ? game.height*MARKER_RADIUS*MARKER_ENLARGMENT_FACTOR : game.height*MARKER_RADIUS, highlighted[1] ? WHITE : RED);
    fillCircle(ps[2], highlighted[2] ? game.height*MARKER_RADIUS*MARKER_ENLARGMENT_FACTOR : game.height*MARKER_RADIUS, highlighted[2] ? WHITE : RED);
    fillCircle(ps[3], highlighted[3] ? game.height*MARKER_RADIUS*MARKER_ENLARGMENT_FACTOR : game.height*MARKER_RADIUS, highlighted[3] ? WHITE : RED);
    fillCircle(ps[0], highlighted[0] ? game.height*MARKER_RADIUS*MARKER_ENLARGMENT_FACTOR : game.height*MARKER_RADIUS, highlighted[0] ? WHITE : CYAN);
}

redrawScene();

game.addEventListener('mousedown', (e) => {
    const rect = game.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left)/rect.width*game.width);
    const y = Math.round((e.clientY - rect.top)/rect.height*game.height);
    const mouse = {x, y};
    if (dragging < 0) {
        for (let i = 0; i < ps.length; ++i) {
            if (v2dist(mouse, ps[i]) <= game.height*MARKER_RADIUS) {
                dragging = i;
                break;
            }
        }
    }
})

game.addEventListener('mouseup', (e) => {
    if (dragging >= 0) {
        dragging = -1;
    }
})

game.addEventListener('mousemove', (e) => {
    const rect = game.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left)/rect.width*game.width);
    const y = Math.round((e.clientY - rect.top)/rect.height*game.height);
    const mouse = {x, y};
    for (let i = 0; i < ps.length; ++i) {
        highlighted[i] = v2dist(mouse, ps[i]) <= (highlighted[i] ? game.height*MARKER_RADIUS*MARKER_ENLARGMENT_FACTOR : game.height*MARKER_RADIUS) || i == dragging;
    }
    if (dragging == 0) {
        ps[dragging] = mouse;
    } else if (dragging > 0) {
        let {t1, t2} = coordinates(ps[1], ps[2], ps[3], ps[0]);
        ps[dragging] = mouse;
        ps[0] = inverseCoordinates(ps[1], ps[2], ps[3], t1, t2);
    }
    redrawScene();
});
