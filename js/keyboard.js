/* 
*   MIDI (Web MIDI API) 
*/
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
    .then(onMIDIsuccess, onMIDIfailure);
}

function onMIDIsuccess (midi) {  
    
    const midiInfo = document.querySelector('#midi-info');
   
    if(midi.inputs.size !== 0) {
        midiInfo.innerText = 'Device connected!';
    } else {
        midiInfo.innerText = 'No device connected, connect your device and reload page.';
    }

    let inputs = midi.inputs.values();

    for(let input = inputs.next(); input && !input.done; input = inputs.next() ) {
        input.value.onmidimessage = onMIDIMessage;
    }
}

function onMIDIfailure () {
    console.error('No access to your midi devices.');
}


function onMIDIMessage(message) {
    let frequency = midiNoteToFrequency(message.data[1]).toFixed(2);

    if(synth.audioCtx) {
        if (message.data[0] === 144 && message.data[2] > 0) {
            playNote(frequency);
        }
    
        if ( (message.data[0] === 128 && message.data[2] === 0) &&
             (audioParams.ADSR.active === true) ) {
            noteOff(frequency);
        }    
    }

    //midi to filter
    let filterCut; //knob 1 cc7
    let filterRes; //knob 2 cc10

    if(filterCut !== 0 && message.data[1] === 7) {
        filterCut = midiCCMap( message.data[2], 100, 12000);
        midiToFilterC(filterCut);
    } 
    if (message.data[1] === 10 ){
        filterRes = midiCCMap(message.data[2], 0, 30);
        midiToFilterR(filterRes);
    }

}

/* 
* MIDI Mapping
*/
function midiNoteToFrequency(midiNote) {
    return Math.pow(2, ( (midiNote - 69) / 12 ) ) * 440;
}

function midiCCMap( cc, min, max ) {
    return ( (cc / 127) * (max - min) + min).toFixed(2);
}

function midiToFilterC(cut) {
    if (synth.audioCtx && cut) {
        filterC.value = cut;
        filterC.nextElementSibling.innerText = cut + " Hz";
        synth.filter.frequency.exponentialRampToValueAtTime(cut, synth.audioCtx.currentTime + 0.2);
        audioParams.filter.cutoff    = cut;
    }
}

function midiToFilterR(res) {
    if (synth.audioCtx && res) {
        filterR.value = res;
        filterR.nextElementSibling.innerText = res;
        synth.filter.Q.value = res;
        audioParams.filter.resonance = res;
    }
}

/* 
* Play notes
*/
let playedNotes = [];

function playNote(frequency) {

    freqFaders.forEach( (e, i) => {
        e.value = frequency;
        audioParams.oscFreqs[i] = frequency;
        e.nextElementSibling.innerText = frequency + " Hz";

        if(synth.audioCtx) {
            synth.oscillators[i].frequency.value = frequency;
        }
    });
    
    if (audioParams.ADSR.active === true) {
        playedNotes.push(frequency);
    }

    if (playedNotes.length === 1 && audioParams.ADSR.active === true) { 
        attackDecaySustain(audioParams.ADSR.attack, audioParams.ADSR.decay, audioParams.ADSR.sustain);
    }
}

function noteOff(frequency) {
    let position = playedNotes.indexOf(frequency);

    if(position !== -1) {
        playedNotes.splice(position, 1);
    }  

    if (playedNotes.length === 0) {
        release(audioParams.ADSR.release);
    } else {
        synth.oscillators.forEach((oscillator) => {
            oscillator.frequency.value = playedNotes[playedNotes.length -1];
        } )
    }
}

/* 
* Envelope 
*/
const EG = document.querySelector('#envelope');
const A = document.querySelector("#attack");
const D = document.querySelector("#decay");
const S = document.querySelector("#sustain");
const R = document.querySelector("#release");

const activateEG = document.querySelector('#activate-eg-btn');

activateEG.addEventListener('click', () => {
    EG.classList.toggle('disabled');
    activateEG.classList.toggle('on');
    activateEG.innerText = EG.classList.contains('disabled') ? 'Activate Envelope' : 'Deactivate Envelope';
    audioParams.ADSR.active = !audioParams.ADSR.active;

    updateParams();

    if ( !EG.classList.contains('disabled') ) {
        noteOff();
    }
});

EG.addEventListener('input', updateEG);

function updateEG () {

    audioParams.ADSR.active = EG.classList.contains('disabled') ? false : true;

    let attack = parseFloat(A.value);
    A.nextElementSibling.innerText = attack;
    let decay = parseFloat(D.value);
    D.nextElementSibling.innerText = decay;
    let sustain = parseFloat(S.value);
    S.nextElementSibling.innerText = sustain;
    let releaseT = parseFloat(R.value);
    R.nextElementSibling.innerText = releaseT;
  
    audioParams.ADSR.attack = attack;
    audioParams.ADSR.decay = decay;
    audioParams.ADSR.sustain = sustain;
    audioParams.ADSR.release = releaseT;
}

function attackDecaySustain(attackTime, decayTime, sustainValue) {

    synth.gainNodes.forEach((gainNode, i) => {
        gainNode.gain.cancelScheduledValues(synth.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, synth.audioCtx.currentTime);

        if (audioParams.gains[i] != 0 && audioParams.gains[0] != 0) {
            gainNode.gain.linearRampToValueAtTime(audioParams.gains[0], synth.audioCtx.currentTime + attackTime);

            let sustain = sustainValue * audioParams.gains[i];
    
            gainNode.gain.linearRampToValueAtTime(sustain, synth.audioCtx.currentTime + attackTime + decayTime); 
        }

    })

}

function release(releaseTime) {
    synth.gainNodes.forEach((gainNode, i) => {
        gainNode.gain.cancelScheduledValues(synth.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, synth.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, synth.audioCtx.currentTime + releaseTime);
    })
}

