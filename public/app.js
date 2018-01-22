// Handle prefixed versions
navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

// State
var me = {};
var myStream;
var peers = {};

init();

// Start everything up
function init() {
  if (!navigator.getUserMedia) return unsupported();

  getLocalAudioStream(function(err, stream) {
    if (err || !stream) return;

    connectToPeerJS(function(err) {
      if (err) return;

      registerIdWithServer(me.id);
      if (call.peers.length) callPeers();
      else displayShareMessage();
    });
  });
}

// Connect to PeerJS and get an ID
function connectToPeerJS(cb) {
  display('Conectando con el servidor de llamadas...');
  me = new Peer({key: API_KEY});

  me.on('call', handleIncomingCall);
  
  me.on('open', function() {
    display('Conectado.');
    display('ID: ' + me.id);
    cb && cb(null, me);
  });
  
  me.on('error', function(err) {
    display(err);
    cb && cb(err);
  });
}

// Add our ID to the list of PeerJS IDs for this call
function registerIdWithServer() {
  display('Registrando la ID en el servidor...');
  $.post('/' + call.id + '/addpeer/' + me.id);
} 

// Remove our ID from the call's list of IDs
function unregisterIdWithServer() {
  $.post('/' + call.id + '/removepeer/' + me.id);
}

// Call each of the peer IDs using PeerJS
function callPeers() {
  call.peers.forEach(callPeer);
}

function callPeer(peerId) {
  display('LLamando a' + peerId + '...');
  var peer = getPeer(peerId);
  peer.outgoing = me.call(peerId, myStream);
  
  peer.outgoing.on('error', function(err) {
    display(err);
  });

  peer.outgoing.on('stream', function(stream) {
    display('Conectado a ' + peerId + '.');
    addIncomingStream(peer, stream);
  });
}

// When someone initiates a call via PeerJS
function handleIncomingCall(incoming) {
  display('Respondiendo llamada desde ' + incoming.peer);
  var peer = getPeer(incoming.peer);
  peer.incoming = incoming;
  incoming.answer(myStream);
  peer.incoming.on('stream', function(stream) {
    addIncomingStream(peer, stream);
  });
}

// Add the new audio stream. Either from an incoming call, or
// from the response to one of our outgoing calls
function addIncomingStream(peer, stream) {
  display('Añadiendo llamada desde ' + peer.id);
  peer.incomingStream = stream;
  playStream(stream);
}

// Create an <audio> element to play the audio stream
function playStream(stream) {
  var audio = $('<audio autoplay />').appendTo('body');
  audio[0].src = (URL || webkitURL || mozURL).createObjectURL(stream);
}

// Get access to the microphone
function getLocalAudioStream(cb) {
  display('Tratando de acceder al micrófono. Haz click en "Permitir/Allow".');

  navigator.getUserMedia (
    {video: false, audio: true},

    function success(audioStream) {
      display('El micrófono está abierto.');
      myStream = audioStream;
      if (cb) cb(null, myStream);
    },

    function error(err) {
      display('Couldn\'t connect to microphone. Reload the page to try again.');
      if (cb) cb(err);
    }
  );
}



////////////////////////////////////
// Helper functions
function getPeer(peerId) {
  return peers[peerId] || (peers[peerId] = {id: peerId});
}

function displayShareMessage() {
  display('Give someone this URL to chat.');
  display('<input type="text" value="' + location.href + '" readonly>');
  
  $('#display input').click(function() {
    this.select();
  });
}

function unsupported() {
  display("Your browser doesn't support getUserMedia.");
}

function display(message) {
  $('<div />').html(message).appendTo('#display');
}