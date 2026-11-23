// Ask for sensors while the button tap is still active.
let phoneAudioOn = false;
let startingAudio = false;

async function startPhoneAudio() {
    if (startingAudio) return;
    startingAudio = true;
    try {
        if (phoneAudioOn && audioContext.state === "running") {
            await audioContext.suspend();
            phoneAudioOn = false;
            buttons[0].html("Turn On DSP");
            return;
        }
        const sensor = dspName === "engine" ? window.DeviceOrientationEvent : window.DeviceMotionEvent;
        const resume = audioContext.resume();
        const permission = sensor?.requestPermission ? sensor.requestPermission() : Promise.resolve("granted");
        const [, result] = await Promise.all([resume, permission]);
        if (!sensor || result !== "granted") throw new Error("Sensor access unavailable");
        phoneAudioOn = true;
        buttons[0].html("Turn Off DSP");
    } catch (error) {
        await audioContext.suspend();
        buttons[0].html("Allow sensors and tap to retry");
        console.error(error);
    } finally {
        startingAudio = false;
    }
}
