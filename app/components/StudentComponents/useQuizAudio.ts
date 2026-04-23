'use client';

import { useCallback, useEffect, useRef } from 'react';

const BACKGROUND_VOLUME = 0.12;
const DUCKED_BACKGROUND_VOLUME = 0.035;
const EFFECT_VOLUME = 0.9;

export const useQuizAudio = () => {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);
  const currentQuestionAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionAudioListenersRef = useRef<{
    play?: () => void;
    pause?: () => void;
    ended?: () => void;
  }>({});

  const setBackgroundVolume = useCallback((volume: number) => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = volume;
    }
  }, []);

  const duckBackgroundMusic = useCallback(() => {
    setBackgroundVolume(DUCKED_BACKGROUND_VOLUME);
  }, [setBackgroundVolume]);

  const restoreBackgroundMusic = useCallback(() => {
    setBackgroundVolume(BACKGROUND_VOLUME);
  }, [setBackgroundVolume]);

  const ensureBackgroundPlayback = useCallback(() => {
    const backgroundMusic = backgroundMusicRef.current;
    if (!backgroundMusic) {
      return;
    }

    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(() => {
        // Ignore autoplay rejections until the next user interaction.
      });
    }
  }, []);

  const playEffect = useCallback((audioRef: { current: HTMLAudioElement | null }) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    audio.volume = EFFECT_VOLUME;
    audio.play().catch(() => {
      // Ignore effect playback errors in locked autoplay states.
    });
  }, []);

  const playCorrectSound = useCallback(() => {
    ensureBackgroundPlayback();
    playEffect(correctSoundRef);
  }, [ensureBackgroundPlayback, playEffect]);

  const playWrongSound = useCallback(() => {
    ensureBackgroundPlayback();
    playEffect(wrongSoundRef);
  }, [ensureBackgroundPlayback, playEffect]);

  const playSuccessSound = useCallback(() => {
    ensureBackgroundPlayback();
    playEffect(successSoundRef);
  }, [ensureBackgroundPlayback, playEffect]);

  const playLoseSound = useCallback(() => {
    ensureBackgroundPlayback();
    playEffect(loseSoundRef);
  }, [ensureBackgroundPlayback, playEffect]);

  const registerQuestionAudio = useCallback((node: HTMLAudioElement | null) => {
    const currentAudio = currentQuestionAudioRef.current;
    const listeners = questionAudioListenersRef.current;

    if (currentAudio && listeners.play && listeners.pause && listeners.ended) {
      currentAudio.removeEventListener('play', listeners.play);
      currentAudio.removeEventListener('pause', listeners.pause);
      currentAudio.removeEventListener('ended', listeners.ended);
    }

    currentQuestionAudioRef.current = node;

    if (!node) {
      restoreBackgroundMusic();
      questionAudioListenersRef.current = {};
      return;
    }

    node.volume = 1;

    const handlePlay = () => {
      ensureBackgroundPlayback();
      duckBackgroundMusic();
    };

    const handlePause = () => {
      restoreBackgroundMusic();
    };

    const handleEnded = () => {
      restoreBackgroundMusic();
    };

    node.addEventListener('play', handlePlay);
    node.addEventListener('pause', handlePause);
    node.addEventListener('ended', handleEnded);

    questionAudioListenersRef.current = {
      play: handlePlay,
      pause: handlePause,
      ended: handleEnded,
    };

    if (!node.paused && !node.ended) {
      duckBackgroundMusic();
    } else {
      restoreBackgroundMusic();
    }
  }, [duckBackgroundMusic, ensureBackgroundPlayback, restoreBackgroundMusic]);

  useEffect(() => {
    const backgroundMusic = new Audio('/audio/bg_music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.preload = 'auto';
    backgroundMusic.volume = BACKGROUND_VOLUME;
    backgroundMusicRef.current = backgroundMusic;

    const correctSound = new Audio('/audio/correct.mp3');
    correctSound.preload = 'auto';
    correctSound.volume = EFFECT_VOLUME;
    correctSoundRef.current = correctSound;

    const wrongSound = new Audio('/audio/wrong.mp3');
    wrongSound.preload = 'auto';
    wrongSound.volume = EFFECT_VOLUME;
    wrongSoundRef.current = wrongSound;

    const successSound = new Audio('/audio/success.wav');
    successSound.preload = 'auto';
    successSound.volume = EFFECT_VOLUME;
    successSoundRef.current = successSound;

    const loseSound = new Audio('/audio/lose.wav');
    loseSound.preload = 'auto';
    loseSound.volume = EFFECT_VOLUME;
    loseSoundRef.current = loseSound;

    const unlockAudio = () => {
      ensureBackgroundPlayback();
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    ensureBackgroundPlayback();

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);

      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.currentTime = 0;
      }

      if (currentQuestionAudioRef.current) {
        const activeListeners = questionAudioListenersRef.current;
        if (activeListeners.play && activeListeners.pause && activeListeners.ended) {
          currentQuestionAudioRef.current.removeEventListener('play', activeListeners.play);
          currentQuestionAudioRef.current.removeEventListener('pause', activeListeners.pause);
          currentQuestionAudioRef.current.removeEventListener('ended', activeListeners.ended);
        }
      }
    };
  }, [ensureBackgroundPlayback]);

  return {
    ensureBackgroundPlayback,
    playCorrectSound,
    playWrongSound,
    playCompletionSound: playSuccessSound,
    playSuccessSound,
    playLoseSound,
    registerQuestionAudio,
  };
};