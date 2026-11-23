
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

engine.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);

        console.log("Engine parameters:", dspNode.getParams());

        const jsonString = dspNode.getJSON();
        const dspInfo = JSON.parse(jsonString);

        jsonParams = dspInfo.ui[0].items;
        dspNodeParams = jsonParams;

        // Find the controls from the Faust file
        const controls = [];

        function readControls(items) {
            for (let item of items) {
                if (item.address && item.min !== undefined && item.max !== undefined) {
                    controls.push(item);
                }

                if (item.items) {
                    readControls(item.items);
                }
            }
        }

        readControls(dspInfo.ui);

        speedParam = controls.find(item =>
            /speed|rpm|throttle|revs|frequency|freq|pitch|rate/i.test(item.address)
        );

        if (!speedParam) {
            speedParam = controls.find(item =>
                !/volume|gain|level|gate|trigger/i.test(item.address)
            );
        }

        if (speedParam) {
            lastSpeed = Number(speedParam.min);
            dspNode.setParamValue(speedParam.address, lastSpeed);
            console.log("Speed control:", speedParam.address);
        } else {
            console.log("No engine speed control found");
        }

        const volumeParam = controls.find(item =>
            /volume|gain|level/i.test(item.address)
        );

        if (volumeParam) {
            const min = Number(volumeParam.min);
            const max = Number(volumeParam.max);
            dspNode.setParamValue(volumeParam.address, min + (max - min) * 0.2);
        }

        const gateParam = dspNode.getParams().find(address =>
            /\/gate$|\/enable$|\/onoff$/i.test(address)
        );

        if (gateParam) {
            dspNode.setParamValue(gateParam, 1);
        }
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

    // Use left and right tilt
    let tilt = Math.abs(roty);

    // Limit the angle to 45 degrees
    tilt = Math.min(tilt, 45);

    let amount = tilt / 45;

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
