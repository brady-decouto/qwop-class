Math.seedrandom(Date.now());

QWOP();

const CORE = QWOP.__i.Luxe.core;
const SNOW_CORE = QWOP.__i["snow.Snow"].core;

const TIMESTEP_SIZE = 0.03333333333333333;
const JOINT_SAMPLE_INTERVAL = 400;

const TRACKED_PARTS = [
    "torso",
    "leftThigh",
    "leftCalf",
    "leftFoot",
    "rightThigh",
    "rightCalf",
    "rightFoot",
]

const studentName = prompt("Enter your name:") || "unknown";

let hasLoggedThisRun = false;
let runStartTime = null;
let keyEvents = [];
let jointSamples = [];
let keyState = { q: false, w: false, o: false, p: false };

function resetRunBuffers() {
    keyEvents = [];
    jointSamples = [];
    runStartTime = Date.now();
}

function recordKeyEvent(key, action) {
    if (runStartTime === null) return;
    keyEvents.push({ t: Date.now() - runStartTime, key, action });
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['q', 'w', 'o', 'p'].includes(key) && !keyState[key]) {
        keyState[key] = true;
        recordKeyEvent(key, 'down');
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['q', 'w', 'o', 'p'].includes(key)) {
        keyState[key] = false;
        recordKeyEvent(key, 'up');
    }
});

function sampleJoints() {
    if (!CORE.game || !CORE.game.torso || runStartTime === null) return;

    const sample = { t: Date.now() - runStartTime };

    for (const part of TRACKED_PARTS) {
        const bodyPart = CORE.game[part];
        if (!bodyPart) continue;
        const physicsBody = bodyPart._components.get("physicsBody");
        if (!physicsBody) continue;
        const pos = physicsBody.getPosition();
        const angle = physicsBody.getAngle();
        sample[part] = { x: pos.x, y: pos.y, angle: angle };
    }

    jointSamples.push(sample);
}

setInterval(sampleJoints, JOINT_SAMPLE_INTERVAL);

function checkAndLogGameEnd() {
    if (!CORE.game || !CORE.game.torso) return;

    const physicsBody = CORE.game.torso._components.get("physicsBody");
    if (!physicsBody) return;

    const distance = physicsBody.getPosition().x / 10;
    const time = CORE.game.scoreTime / 10;

    if (CORE.game.gameEnded) {
        if (!hasLoggedThisRun) {
            hasLoggedThisRun = true;

            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName, score: distance.toFixed(2), time: time.toFixed(2) })
            }).catch(err => console.log('Logging failed:', err));

            fetch('/log-detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: studentName,
                    distance: distance.toFixed(2),
                    time: time.toFixed(2),
                    keyEvents: keyEvents,
                    jointSamples: jointSamples
                })
            }).catch(err => console.log('Detailed logging failed:', err));

            console.log(`Run ended - Distance: ${distance.toFixed(2)}m, Time: ${time.toFixed(2)}s, ${keyEvents.length} key events, ${jointSamples.length} joint samples`);
        }
    } else {
        if (hasLoggedThisRun) {
            resetRunBuffers();
        }
        hasLoggedThisRun = false;
    }
}

function stepAndDraw() {
    CORE.game.update(TIMESTEP_SIZE);
    CORE.app.host.emitter.emit(4);
    CORE.app.host.on_internal_render();
    checkAndLogGameEnd();
}

CORE.app.window.handle.addEventListener("doneLoading", (_e) => {
    SNOW_CORE.__manual_mode = true;
    resetRunBuffers();
    setInterval(stepAndDraw, TIMESTEP_SIZE * 1000);
});
