/* if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
    .then(onMIDIsuccess, onMIDIfailure);
}

function onMIDIsuccess (midi) {
    console.log('Got midi!', midi);
      
    let inputs = midi.inputs.values();

    for(let input = inputs.next(); input && !input.done; input = inputs.next() ) {
        input.value.onmidimessage = onMIDIMessage;
    }
}

function onMIDIMessage(message) {
    console.log(message.data);
    
}

function midiNoteToFrequency (midiNote) {
    return Math.pow(2, ((midiNote - 69) / 12)) * 440;
}

function onMIDIfailure () {
    console.error('No access to your midi devices.')
}

function playNote(frequency) {
    synth.oscillators[0].frequency.value = frequency;
    synth.oscillators[1].frequency.value = frequency;
} */