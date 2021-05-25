const audioCtxOnBtn = document.querySelector("#create-audioctx-btn");
const gainFaders = document.querySelectorAll(".gain-fader");
const freqFaders = document.querySelectorAll(".freq-fader");
const oscWaveSelect = document.querySelectorAll(".osc-wave");
const filterType = document.querySelector("#filter-type");
const filterC = document.querySelector("#filter-cutoff");
const filterR = document.querySelector("#filter-res");
const loadPresetFile = document.querySelector('#preset-file');

const synth = {
  audioCtx: null,
  gainNodes: [null, null, null],
  oscillators: [null, null],
  filter: null,
};

let audioParams = {
  gains: [0, 0, 0],
  oscFreqs: [200, 200],
  oscWaves: ["sine", "sine"],
  filter: {
    type: "lowpass",
    cutoff: 500,
    resonance: 0,
  },
};

function createAudioCtx() {
  if (!synth.audioCtx || synth.audioCtx.state === "closed") {
    //Create AudioContext & oscillators
    synth.audioCtx = new AudioContext();

    //Create gain nodes
    for (let i = 0; i < synth.gainNodes.length; i++) {
      synth.gainNodes[i] = synth.audioCtx.createGain();
      synth.gainNodes[i].gain.value = audioParams.gains[i];
    }

    //Create filter
    synth.filter = synth.audioCtx.createBiquadFilter();
    synth.filter.connect(synth.gainNodes[0]);

    //Create oscillators
    for (let i = 0; i < synth.oscillators.length; i++) {
      synth.oscillators[i] = synth.audioCtx.createOscillator();
      synth.oscillators[i].connect(synth.gainNodes[i + 1]);
      synth.gainNodes[i + 1].connect(synth.filter);
    }

    //Set params
    updateParams();

    //Start oscillators
    for (let i = 0; i < synth.oscillators.length; i++) {
      synth.oscillators[i].start(synth.audioCtx.currentTime);
    }

    //Connect master gain node
    synth.gainNodes[0].connect(synth.audioCtx.destination);

    document.querySelectorAll(":disabled").forEach((e) => {
      e.disabled = false;
    });

    document.querySelector("button").classList.add("on");

    console.log(synth);
  } else {
    synth.audioCtx.close();
    document.querySelector("button").classList.remove("on");
  }
}

function updateParams() {
  //Master & oscillators gain
  gainFaders.forEach((e, index) => {
    let gain = parseFloat(e.value);
    audioParams.gains[index] = gain.toFixed(2);
    e.nextElementSibling.innerText = gain.toFixed(2);
    
    if (synth.audioCtx) {
      synth.gainNodes[index].gain.linearRampToValueAtTime(
        gain,
        synth.audioCtx.currentTime + 0.1
      );
    }
  });

  //Oscillators frequencies
  freqFaders.forEach((e, index) => {
    let freq = e.value;
    audioParams.oscFreqs[index] = freq;
    e.nextElementSibling.innerText = freq + " Hz";
    if (synth.audioCtx) {
      synth.oscillators[index].frequency.value = freq;
    }
  });

  //Oscillators waves
  oscWaveSelect.forEach((e, index) => {
    let wave = e.value;
    audioParams.oscWaves[index] = wave;
    if (synth.audioCtx) {
      synth.oscillators[index].type = wave;
    }
  });

  //Filter
  audioParams.filter.type      = filterType.value;
  audioParams.filter.cutoff    = filterC.value;
  audioParams.filter.resonance = filterR.value;

  if (synth.audioCtx) {
    synth.filter.type = filterType.value;
    synth.filter.frequency.value = filterC.value;
    synth.filter.Q.value = filterR.value;
  }
  filterC.nextElementSibling.innerText = filterC.value + " Hz";
  filterR.nextElementSibling.innerText = filterR.value;
}


//Load user preset
function loadPreset(e) {
  let reader = new FileReader();

  reader.addEventListener('load', (e) => {
    document.querySelector('#preset').innerHTML = e.target.result;
    let preset = JSON.parse(e.target.result);
    audioParams = preset;
    setParams();
    updateParams();
  })
  reader.readAsText(e.target.files[0]);
}

function setParams() {
  gainFaders.forEach((e, i) => {
    e.value = audioParams.gains[i];
  });
  freqFaders.forEach((e, i) => {
    e.value = audioParams.oscFreqs[i];
  });

  oscWaveSelect.forEach((e, i) => {
    e.value = audioParams.oscWaves[i];
  });

  filterType.value  = audioParams.filter.type;
  filterC.value     = audioParams.filter.cutoff;
  filterC.nextElementSibling.innerText = filterC.value + " Hz";
  filterR.value     = audioParams.filter.resonance;
  filterR.nextElementSibling.innerText = filterR.value;
}  


//Create audio context
audioCtxOnBtn.addEventListener("click", createAudioCtx);
//Update params
document.body.addEventListener("input", updateParams);

//Show params - download user preset
const savePresetBtn = document.querySelector('#save-preset');
savePresetBtn.addEventListener( 'click', function() {
  document.querySelector('#audio-params').innerHTML = JSON.stringify(audioParams);

  let userPreset = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(audioParams));
  let downloadLink = document.querySelector('#download-preset');

  downloadLink.classList.remove('hidden');

  downloadLink.addEventListener('click', ()=> {
    downloadLink.setAttribute( 'href', userPreset);
    downloadLink.setAttribute('download', 'userpreset.json');
  })

  savePresetBtn.innerText = 'Save new preset';

} );

//Upload user preset
loadPresetFile.addEventListener('change', loadPreset);