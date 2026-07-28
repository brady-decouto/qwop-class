const PHYSICS_JOINTS = [
    "leftHip", "rightHip", "leftKnee", "rightKnee",
    "leftAnkle", "rightAnkle", "leftShoulder", "rightShoulder",
    "leftElbow", "rightElbow"
];

const originalTorques = {};

function captureOriginalTorques() {
    for (const joint of PHYSICS_JOINTS) {
        const j = CORE.game[joint];
        if (j && typeof j.m_maxMotorTorque === 'number') {
            originalTorques[joint] = j.m_maxMotorTorque;
        }
    }
}

function setGravity(value) {
    if (CORE.game && CORE.game.m_world) {
        CORE.game.m_world.m_gravity.y = value;
    }
}

function setStrengthMultiplier(multiplier) {
    for (const joint of PHYSICS_JOINTS) {
        const j = CORE.game[joint];
        if (j && originalTorques[joint] !== undefined) {
            j.m_maxMotorTorque = originalTorques[joint] * multiplier;
        }
    }
}

function buildPhysicsPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed; top:10px; right:10px; background:white; border:2px solid #333; border-radius:8px; padding:12px; font-family:sans-serif; font-size:13px; z-index:9999; width:220px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';

    panel.innerHTML = `
        <div style="font-weight:bold; margin-bottom:8px;">Physics Controls</div>
        <label>Gravity: <span id="gravity-val">10</span></label><br>
        <input type="range" id="gravity-slider" min="0" max="30" step="1" value="10" style="width:100%"><br><br>
        <label>Leg/Arm Strength: <span id="strength-val">100%</span></label><br>
        <input type="range" id="strength-slider" min="20" max="200" step="5" value="100" style="width:100%"><br><br>
        <button id="reset-physics" style="width:100%; padding:4px; cursor:pointer;">Reset to Default</button>
    `;

    document.body.appendChild(panel);

    document.getElementById('gravity-slider').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('gravity-val').textContent = val;
        setGravity(val);
    });

    document.getElementById('strength-slider').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('strength-val').textContent = val + '%';
        setStrengthMultiplier(val / 100);
    });

    document.getElementById('reset-physics').addEventListener('click', () => {
        document.getElementById('gravity-slider').value = 10;
        document.getElementById('gravity-val').textContent = 10;
        setGravity(10);
        document.getElementById('strength-slider').value = 100;
        document.getElementById('strength-val').textContent = '100%';
        setStrengthMultiplier(1);
    });
}

CORE.app.window.handle.addEventListener("doneLoading", (_e) => {
    captureOriginalTorques();
    buildPhysicsPanel();
});
