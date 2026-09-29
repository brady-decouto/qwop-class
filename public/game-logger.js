Math.seedrandom(Date.now());

QWOP();

const CORE = QWOP.__i.Luxe.core;
const SNOW_CORE = QWOP.__i["snow.Snow"].core;

const TIMESTEP_SIZE = 0.03333333333333333;
const JOINT_SAMPLE_INTERVAL = 400;

const TRACKED_PARTS = [
    "torso", "leftThigh", "leftCalf", "leftFoot",
    "rightThigh", "rightCalf", "rightFoot",
]

let studentName = null;
let className = null;
let sessionReady = false;

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
    if (!sessionReady) return;
    const key = e.key.toLowerCase();
    if (['q', 'w', 'o', 'p'].includes(key) && !keyState[key]) {
        keyState[key] = true;
        recordKeyEvent(key, 'down');
    }
});

window.addEventListener('keyup', (e) => {
    if (!sessionReady) return;
    const key = e.key.toLowerCase();
    if (['q', 'w', 'o', 'p'].includes(key)) {
        keyState[key] = false;
        recordKeyEvent(key, 'up');
    }
});

function sampleJoints() {
    if (!sessionReady || !CORE.game || !CORE.game.torso || runStartTime === null) return;
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
    if (!sessionReady || !CORE.game || !CORE.game.torso) return;
    const physicsBody = CORE.game.torso._components.get("physicsBody");
    if (!physicsBody) return;

    const distance = physicsBody.getPosition().x / 10;
    const time = runStartTime !== null ? (Date.now() - runStartTime) / 1000 : 0;

    if (CORE.game.gameEnded) {
        if (!hasLoggedThisRun) {
            hasLoggedThisRun = true;
            fetch('/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    className: className,
                    name: studentName,
                    distance: distance.toFixed(2),
                    time: time.toFixed(2),
                    keyEvents: keyEvents,
                    jointSamples: jointSamples
                })
            }).catch(err => console.log('Logging failed:', err));
            console.log(`Run ended - Distance: ${distance.toFixed(2)}m, Time: ${time.toFixed(2)}s`);
        }
    } else {
        if (hasLoggedThisRun) resetRunBuffers();
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
    setInterval(stepAndDraw, TIMESTEP_SIZE * 1000);
});

function buildSelectionModal(existingClasses) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:white; padding:24px; border-radius:10px; width:300px;';

    const optionsHtml = existingClasses.map(c => `<option value="${c}">${c}</option>`).join('');

    box.innerHTML = `
        <div style="font-weight:bold; margin-bottom:12px; font-size:16px;">Join a Session</div>
        <label style="font-size:13px;">Class / Group</label><br>
        <select id="existing-class-select" style="width:100%; padding:6px; margin:4px 0 10px 0;">
            <option value="">-- Select existing --</option>
            ${optionsHtml}
        </select>
        <label style="font-size:13px;">Or create new:</label><br>
        <input type="text" id="new-class-input" placeholder="e.g. Period 3" style="width:100%; padding:6px; margin:4px 0 14px 0; box-sizing:border-box;">
        <label style="font-size:13px;">Your Name</label><br>
        <input type="text" id="name-input" placeholder="Your name" style="width:100%; padding:6px; margin:4px 0 14px 0; box-sizing:border-box;">
        <button id="start-session-btn" style="width:100%; padding:8px; cursor:pointer; font-weight:bold;">Start</button>
        <div id="session-error" style="color:red; font-size:12px; margin-top:6px; display:none;"></div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('start-session-btn').addEventListener('click', () => {
        const existing = document.getElementById('existing-class-select').value.trim();
        const newClass = document.getElementById('new-class-input').value.trim();
        const name = document.getElementById('name-input').value.trim();
        const errorDiv = document.getElementById('session-error');
        const chosenClass = newClass || existing;

        if (!chosenClass || !name) {
            errorDiv.textContent = 'Please enter your name and select or create a class.';
            errorDiv.style.display = 'block';
            return;
        }

        className = chosenClass;
        studentName = name;
        sessionReady = true;
        resetRunBuffers();
        overlay.remove();
    });
}

fetch('/classes')
    .then(res => res.json())
    .then(data => buildSelectionModal(data.sheets || []))
    .catch(() => buildSelectionModal([]));
