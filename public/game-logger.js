Math.seedrandom(Date.now());

QWOP();

const CORE = QWOP.__i.Luxe.core;
const SNOW_CORE = QWOP.__i["snow.Snow"].core;

const TIMESTEP_SIZE = 0.03333333333333333;

const studentName = prompt("Enter your name:") || "unknown";

let hasLoggedThisRun = false;

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
            console.log(`Run ended - Distance: ${distance.toFixed(2)}m, Time: ${time.toFixed(2)}s`);
        }
    } else {
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
