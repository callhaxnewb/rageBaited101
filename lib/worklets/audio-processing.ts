const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {

  // send and clear buffer every 2048 samples, 
  // which at 16khz is about 8 times a second
  buffer = new Int16Array(2048);

  // current write index
  bufferWriteIndex = 0;

  constructor() {
    super();
    this.hasAudio = false;
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#] so to access first inputs 1st channel inputs[0][0]
   * @param outputs Float32Array[][]
   */
  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer(){
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
      },
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    const l = float32Array.length;
    
    for (let i = 0; i < l; i++) {
      // Clamp the sample to the [-1, 1] range to prevent overflow.
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit signed integer.
      // For positive values, multiply by 32767 (0x7FFF).
      // For negative values, multiply by 32768 (0x8000).
      const int16Value = s < 0 ? s * 0x8000 : s * 0x7FFF;
      
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if(this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }

    if(this.bufferWriteIndex >= this.buffer.length) {
      this.sendAndClearBuffer();
    }
  }
}
`;

export default AudioRecordingWorklet;