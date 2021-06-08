if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
    .then(onMIDIsuccess, onMIDIfailure);
}

function onMIDIsuccess (midi) {   
    console.log('Hay Midi!'); 
    let inputs = midi.inputs.values();

    for(let input = inputs.next(); input && !input.done; input = inputs.next() ) {
        input.value.onmidimessage = onMIDIMessage;
    }
}

//crear input para que mapeen su controlador
function onMIDIMessage(message) {

    let frequency = midiNoteToFrequency(message.data[1]).toFixed(2);
    if (message.data[0] === 144 && message.data[2] > 0) {
        playNote(frequency);
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

function midiNoteToFrequency(midiNote) {
    return Math.pow(2, ( (midiNote - 69) / 12 ) ) * 440;
}

function midiCCMap( cc, min, max ) {
    return ( (cc / 127) * (max - min) + min).toFixed(2);
}

function playNote(frequency) {

    freqFaders.forEach( (e, i) => {
        e.value = frequency;
        audioParams.oscFreqs[i] = frequency;
        e.nextElementSibling.innerText = frequency + " Hz";

        if(synth.audioCtx) {
            synth.oscillators[i].frequency.value = frequency;
        }
    });
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

function onMIDIfailure () {
    console.error('No access to your midi devices.');
}