// Nama animasi yang boleh dipakai di naskah -> file FBX Mixamo di public/anims/
// "kata kunci" = saran pencarian di mixamo.com (pilih yang paling mirip, centang "In Place").
export const ANIMS = {
  idle:        { file: 'anims/idle.fbx',        loop: true,  kataKunci: 'Idle / Breathing Idle' },
  walk:        { file: 'anims/walk.fbx',        loop: true,  kataKunci: 'Walking (In Place)' },
  run:         { file: 'anims/run.fbx',         loop: true,  kataKunci: 'Running (In Place)' },
  talk:        { file: 'anims/talk.fbx',        loop: true,  kataKunci: 'Talking' },
  sad:         { file: 'anims/sad.fbx',         loop: true,  kataKunci: 'Sad Idle' },
  cry:         { file: 'anims/cry.fbx',         loop: true,  kataKunci: 'Crying' },
  laugh:       { file: 'anims/laugh.fbx',       loop: true,  kataKunci: 'Laughing' },
  crossarms:   { file: 'anims/crossarms.fbx',   loop: true,  kataKunci: 'Standing Arms Crossed / Idle Arms Crossed' },
  angry:       { file: 'anims/angry.fbx',       loop: true,  kataKunci: 'Angry' },
  surprised:   { file: 'anims/surprised.fbx',   loop: false, kataKunci: 'Surprised / Startled' },
  scared:      { file: 'anims/scared.fbx',      loop: true,  kataKunci: 'Terrified / Scared' },
  think:       { file: 'anims/think.fbx',       loop: true,  kataKunci: 'Thinking' },
  point:       { file: 'anims/point.fbx',       loop: false, kataKunci: 'Pointing' },
  phone:       { file: 'anims/phone.fbx',       loop: true,  kataKunci: 'Texting / Talking On Phone' },
  carry:       { file: 'anims/carry.fbx',       loop: true,  kataKunci: 'Carry / Box Walk (In Place)' },
  grab:        { file: 'anims/grab.fbx',        loop: false, kataKunci: 'Pick Fruit / Taking Item' },
  holdup:      { file: 'anims/holdup.fbx',      loop: true,  kataKunci: 'Waving (tahan tangan di atas)' },
  trip:        { file: 'anims/trip.fbx',        loop: false, kataKunci: 'Soccer Pass / Leg Sweep' },
  fall:        { file: 'anims/fall.fbx',        loop: false, kataKunci: 'Stumble / Falling Flat' },
  floorsit:    { file: 'anims/floorsit.fbx',    loop: true,  kataKunci: 'Sitting On Ground / Sitting Idle Floor' },
  pickup:      { file: 'anims/pickup.fbx',      loop: false, kataKunci: 'Picking Up / Kneeling Pick Up' },
  sit:         { file: 'anims/sit.fbx',         loop: true,  kataKunci: 'Sitting Idle (kursi)' },
  piano:       { file: 'anims/piano.fbx',       loop: true,  kataKunci: 'Playing Piano' },
  pull:        { file: 'anims/pull.fbx',        loop: false, kataKunci: 'Pulling / Tug' },
  catch:       { file: 'anims/catch.fbx',       loop: false, kataKunci: 'Catching' },
  give:        { file: 'anims/give.fbx',        loop: false, kataKunci: 'Giving Item / Handing Over' },
  shy:         { file: 'anims/shy.fbx',         loop: true,  kataKunci: 'Nervously Look Around / Shy' },
  lookaround:  { file: 'anims/lookaround.fbx',  loop: true,  kataKunci: 'Looking Around' },
  unlock:      { file: 'anims/unlock.fbx',      loop: false, kataKunci: 'Opening Door / Turning Key' },
};

// Ekspresi naskah -> bobot blend shape VRM (preset VRM 1.0)
export const EXPRESSIONS = {
  neutral:   {},
  smile:     { happy: 0.45 },
  happy:     { happy: 1 },
  sad:       { sad: 0.8 },
  cry:       { sad: 1 },
  angry:     { angry: 0.9 },
  smirk:     { happy: 0.35, angry: 0.4 },
  cold:      { relaxed: 0.35, angry: 0.1 },
  surprised: { surprised: 1 },
  scared:    { surprised: 0.55, sad: 0.5 },
  think:     { relaxed: 0.25, sad: 0.15 },
  shy:       { happy: 0.3, sad: 0.25 },
};

export const FX = ['petals', 'rain', 'dust', 'shake', 'flash', 'zoom', 'vignette', 'sepia', 'dark'];
export const CAM_SHOTS = ['wide', 'medium', 'close', 'xclose', 'ots', 'low', 'high', 'insert', 'free'];
export const CAM_MOVES = ['push', 'pull', 'pan', 'orbit', 'rise', 'tilt', 'handheld', 'drift'];
