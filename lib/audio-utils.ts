/**
 * Audio Processing Utilities
 * Provides audio validation, transcription, and analysis functions
 */

/**
 * Validate audio file format and properties
 * @param file - Audio file to validate
 * @returns Validation result with error message if invalid
 */
export async function validateAudioFile(file: File): Promise<{
  isValid: boolean;
  error?: string;
  duration?: number;
  format?: string;
  sizeKB?: number;
}> {
  // Check file type
  const validAudioFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/aac'];
  if (!validAudioFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid audio format: ${file.type}. Supported formats: MP3, WAV, OGG, WebM, M4A, AAC`,
    };
  }

  // Check file size (max 20MB)
  const maxSizeBytes = 20 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 20MB`,
      sizeKB: file.size / 1024,
    };
  }

  // Check minimum size (at least 1KB)
  const minSizeBytes = 1024;
  if (file.size < minSizeBytes) {
    return {
      isValid: false,
      error: 'File too small. Please provide a valid audio file.',
      sizeKB: file.size / 1024,
    };
  }

  // Get audio duration
  let duration = 0;
  try {
    duration = await getAudioDuration(file);
    if (duration < 1) {
      return {
        isValid: false,
        error: 'Audio is too short. Please record at least 1 second of audio.',
        duration,
      };
    }
  } catch (err) {
    console.warn('Could not determine audio duration:', err);
  }

  return {
    isValid: true,
    duration,
    format: file.type,
    sizeKB: file.size / 1024,
  };
}

/**
 * Get audio file duration in seconds
 * @param file - Audio file
 * @returns Duration in seconds
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContext.decodeAudioData(
        e.target?.result as ArrayBuffer,
        (buffer) => {
          resolve(buffer.duration);
        },
        (err) => {
          reject(err);
        }
      );
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert audio file to base64 for storage/transmission
 * @param file - Audio file
 * @returns Base64 string
 */
export function audioToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Record audio from microphone
 * @param onRecordingStart - Callback when recording starts
 * @param onRecordingStop - Callback when recording stops with the audio blob
 * @returns Object with start, stop, and cancel methods
 */
export async function startAudioRecording(): Promise<{
  stream: MediaStream;
  mediaRecorder: MediaRecorder;
  start: () => void;
  stop: () => Promise<Blob>;
  cancel: () => void;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    return {
      stream,
      mediaRecorder,
      start: () => {
        chunks.length = 0; // Clear previous chunks
        mediaRecorder.start();
      },
      stop: async () => {
        return new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            resolve(blob);
          };
          mediaRecorder.stop();
        });
      },
      cancel: () => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
      },
    };
  } catch (err) {
    console.error('Error accessing microphone:', err);
    throw new Error('Could not access microphone. Please check permissions.');
  }
}

/**
 * Play audio blob
 * @param blob - Audio blob
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error playing audio'));
    };
    audio.play().catch(reject);
  });
}

/**
 * Audio quality analysis
 * @param file - Audio file to analyze
 * @returns Quality metrics
 */
export async function analyzeAudioQuality(file: File): Promise<{
  sizeKB: number;
  format: string;
  durationSeconds: number;
  bitrate?: string;
  quality: 'low' | 'medium' | 'high';
  suggestions: string[];
}> {
  const suggestions: string[] = [];
  let quality: 'low' | 'medium' | 'high' = 'medium';

  const sizeKB = file.size / 1024;
  const format = file.type.split('/')[1].toUpperCase();

  let duration = 0;
  try {
    duration = await getAudioDuration(file);
  } catch {
    duration = 0;
  }

  // Estimate bitrate (rough calculation)
  const estimatedBitrate = duration > 0 ? (sizeKB * 8) / duration : 0;

  // Quality assessment
  if (duration < 5) {
    suggestions.push('Recording is short; try to provide more content for better assessment');
    quality = 'low';
  }

  if (estimatedBitrate < 64) {
    suggestions.push('Low audio bitrate detected; try using a better microphone or recording in a quieter environment');
    quality = 'low';
  } else if (estimatedBitrate > 256) {
    quality = 'high';
  }

  if (sizeKB > 5000) {
    suggestions.push('Large file size; teacher may take longer to review');
  }

  return {
    sizeKB: Math.round(sizeKB * 10) / 10,
    format,
    durationSeconds: Math.round(duration * 10) / 10,
    bitrate: estimatedBitrate > 0 ? `${Math.round(estimatedBitrate)} kbps` : undefined,
    quality,
    suggestions,
  };
}

/**
 * Create audio waveform visualization data
 * @param blob - Audio blob
 * @param samples - Number of samples for the waveform (default: 100)
 * @returns Array of normalized amplitude values (0-1)
 */
export async function getAudioWaveformData(blob: Blob, samples: number = 100): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const waveformData: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j]);
      }
      waveformData.push(sum / blockSize);
    }

    // Normalize to 0-1
    const max = Math.max(...waveformData);
    return waveformData.map((val) => (max > 0 ? val / max : 0));
  } catch (err) {
    console.error('Error generating waveform data:', err);
    return Array(samples).fill(0.5); // Return default waveform on error
  }
}
