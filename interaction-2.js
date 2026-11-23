
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

let speedParam = null;
let lastSpeed = 0;

const dspName = "engine";
const instance = new FaustWasm2ScriptProcessor(dspName);

if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

instance.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);

        console.log("Engine parameters:", dspNode.getParams());

        const jsonString = dspNode.getJSON();
        const dspInfo = JSON.parse(jsonString);

        jsonParams = dspInfo.ui[0].items;
        dspNodeParams = jsonParams;

        // Find the controls from the Faust file
        speedParam = findByAddress(dspNodeParams, "/engine/maxSpeed");
        lastSpeed = 0.5;
        dspNode.setParamValue(speedParam.address, lastSpeed);
        dspNode.setParamValue("/engine/runtime", 0.25);
        dspNode.setParamValue("/engine/volume", 0.25);
        dspNode.setParamValue("/engine/gate", 1);
    })
    .catch(error => {
        console.error("Engine loading error:", error);
    });


// Phone movement

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
    if (!dspNode || !speedParam) {
        return;
    }

    if (audioContext.state === "suspended") {
        return;
    }

    if (![rotx, roty].every(Number.isFinite)) return;

    // Use left and right tilt
    const angle = window.screen.orientation?.angle ?? window.orientation ?? 0;
    let tilt = roty;
    if (angle === 90) tilt = rotx;
    if (angle === -90 || angle === 270) tilt = -rotx;
    if (Math.abs(angle) === 180) tilt = -roty;

    // Limit the angle to 45 degrees
    tilt = Math.max(-45, Math.min(45, tilt));
    const amount = (tilt + 45) / 90;

    playAudio(amount);
}

function mousePressed() {
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}

function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
}


// Engine sound control

function playAudio(amount) {
    if (!dspNode || !speedParam) {
        return;
    }

    const min = Number(speedParam.min);
    const max = Number(speedParam.max);

    let targetSpeed = min + amount * (max - min);

    // Smooth the sound changes
    lastSpeed = lastSpeed * 0.7 + targetSpeed * 0.3;

    dspNode.setParamValue(speedParam.address, lastSpeed);
}
