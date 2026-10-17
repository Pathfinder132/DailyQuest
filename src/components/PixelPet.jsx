import React from 'react';
import { Sparkles } from 'lucide-react';

const PET_FRAMES = {
  idle: [
    '....PPPP....',
    '...PPPPPP...',
    '..PPPPPPPP..',
    '..PWWPPWWP..',
    '..PWWPPWWP..',
    '..PPPPPPPP..',
    '...PPPPPP...',
    '..PPCYYCPP..',
    '.PPPCYYCPPP.',
    '.PPP....PPP.',
    '..PP....PP..',
    '..PP....PP..',
  ],
  happy: [
    '....PPPP....',
    '...PPPPPP...',
    '..PPPPPPPP..',
    '..PWWPPWWP..',
    '..PWWPPWWP..',
    '..PPPPPPPP..',
    '.PPPPPPPPPP.',
    '.PPCYYYYCPP.',
    'PPPCYYYYCPPP',
    '.PPP....PPP.',
    '..PP....PP..',
    '.PP......PP.',
  ],
  dizzy: [
    '....PPPP....',
    '...PPPPPP...',
    '..PPPPPPPP..',
    '..PRPPPRP...',
    '..PPRPPRPP..',
    '..PPPPPPPP..',
    '...PPPPPP...',
    '..PPCYYCPP..',
    '.PPPCYYCPPP.',
    '.PPP....PPP.',
    '..PP....PP..',
    '..PP....PP..',
  ],
};

const PIXEL_CLASSES = {
  P: 'pixel-purple',
  W: 'pixel-white',
  C: 'pixel-cyan',
  Y: 'pixel-yellow',
  R: 'pixel-red',
};

const LINES = {
  idle: [
    'Wake up Uttej! Time to grind!',
    '1 problem a day keeps the brain rot away!',
    'Show me what you got!',
  ],
  happy: ['BOOM! Flawless victory!', 'Too easy for you!', 'Brain status: OVERLOADED WITH GENIUS!'],
  dizzy: ["Ouch! We'll get 'em next time!", 'Check the colorful breakdown below!', 'Review the solution and run it back!'],
};

export default function PixelPet({ mood = 'idle', level = 1, messageIndex = 0 }) {
  const frame = PET_FRAMES[mood] || PET_FRAMES.idle;
  const line = LINES[mood] || LINES.idle;
  const message = line[messageIndex % line.length];

  return (
    <section className={`pet-card pet-${mood}`} aria-label={`Pixel companion: ${message}`}>
      <div className="pet-speech">
        <span className="speech-dot" />
        <p>{message}</p>
        <span className="speech-tail" />
      </div>
      <div className={`pet-avatar-wrap ${mood === 'happy' ? 'pet-dance' : mood === 'dizzy' ? 'pet-dizzy' : 'pet-float'}`}>
        <div className="pet-glow" />
        <div className="pet-pixels" role="img" aria-label={`Pixel pet at level ${level}`}>
          {frame.flatMap((row, rowIndex) => row.split('').map((pixel, colIndex) => (
            <span
              aria-hidden="true"
              key={`${rowIndex}-${colIndex}`}
              className={`pet-pixel ${pixel === '.' ? 'pixel-empty' : PIXEL_CLASSES[pixel]}`}
            />
          )))}
        </div>
        <span className="pet-level"><Sparkles size={11} strokeWidth={3} /> LVL {level}</span>
      </div>
      <div className="pet-caption">
        <span className="pet-status-dot" />
        {mood === 'happy' ? 'HYPE MODE ACTIVATED' : mood === 'dizzy' ? 'DEBUGGING THE BRAIN' : 'YOUR DAILY SIDEKICK'}
      </div>
    </section>
  );
}
