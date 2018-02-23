var spawn = require('child_process').spawn;
var isMac = require('os').type() == 'Darwin';
var isWindows = require('os').type().indexOf('Windows') > -1;
var MeasureVolume = require('./volumeTransform.js');
var PassThrough = require('stream').PassThrough;

var mic = function mic(options) {
  options = options || {};
  var that = {};
  var endian = options.endian || 'little';
  var bitwidth = options.bitwidth || '16';
  var encoding = options.encoding || 'signed-integer';
  var rate = options.rate || '16000';
  var channels = options.channels || '1';
  var device = options.device || 'plughw:1,0';
  var exitOnSilence = options.exitOnSilence || 0;
  var fileType = options.fileType || 'raw';
  var debug = options.debug || false;
  var format, formatEndian, formatEncoding;
  var audioProcess = null;
  var infoStream = new PassThrough;
  var audioStream = new MeasureVolume({debug: debug});
  var audioProcessOptions = {
    stdio: ['ignore', 'pipe', 'ignore']
  };

  if(debug) {
    audioProcessOptions.stdio[2] = 'pipe';
  }

  // Setup format variable for arecord call
  if(endian === 'big') {
    formatEndian = 'BE';
  } else {
    formatEndian = 'LE';
  }
  if(encoding === 'unsigned-integer') {
    formatEncoding = 'U';
  } else {
    formatEncoding = 'S';
  }
  format = formatEncoding + bitwidth + '_' + formatEndian;

  that.start = function start() {
    if(audioProcess === null) {
      if(isWindows){
        var params = ['-b', bitwidth, '--endian', endian,
          '-c', channels, '-r', rate, '-e', encoding,
          '-t' , 'waveaudio', 'default', '-p', '--buffer', '64', '-V', '-V'];

        audioProcess = spawn('sox', params, audioProcessOptions)

        console.log(params.join(" "))
      }
      else if(isMac){
        let params = ['-b', bitwidth, '--endian', endian,
          '-c', channels, '-r', rate, '-e', encoding,
          '-t', fileType, '-'];

        console.log("rec", params.join(' '))
        audioProcess = spawn('rec', params , audioProcessOptions)
      }
      else {
        let params = ['-c', channels, '-r', rate, '-f',
          format, '-D', device, '-B', '100000'];

        console.log("arecord", params.join(' '))
        audioProcess = spawn('arecord', params, audioProcessOptions);
      }

      audioProcess.on('exit', function(code, sig) {
        if(code != null && sig === null) {
          audioStream.emit('audioProcessExitComplete');
          if(debug) console.log("recording audioProcess has exited with code = %d", code);
        }
      });
      audioProcess.stdout.pipe(audioStream);
      if(debug) {
        audioProcess.stderr.pipe(infoStream);
      }
      audioStream.emit('startComplete');
    } else {
      if(debug) {
        throw new Error("Duplicate calls to start(): Microphone already started!");
      }
    }
  };

  that.stop = function stop() {
    if(audioProcess != null) {
      audioProcess.kill('SIGTERM');
      audioProcess = null;
      audioStream.emit('stopComplete');
      if(debug) console.log("Microhphone stopped");
    }
  };

  that.pause = function pause() {
    if(audioProcess != null) {
      audioProcess.kill('SIGSTOP');
      audioStream.pause();
      audioStream.emit('pauseComplete');
      if(debug) console.log("Microphone paused");
    }
  };

  that.resume = function resume() {
    if(audioProcess != null) {
      audioProcess.kill('SIGCONT');
      audioStream.resume();
      audioStream.emit('resumeComplete');
      if(debug) console.log("Microphone resumed");
    }
  }

  that.getAudioStream = function getAudioStream() {
    return audioStream;
  }

  if(debug) {
    infoStream.on('data', function(data) {
      console.log("Received Info: " + data);
    });
    infoStream.on('error', function(error) {
      console.log("Error in Info Stream: " + error);
    });
  }

  return that;
}

module.exports = mic;