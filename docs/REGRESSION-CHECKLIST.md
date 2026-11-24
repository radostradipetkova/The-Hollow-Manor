# Gameplay regression checklist

This source-only restructure does **not** change the game's executable bundle. Use these checks when making later gameplay edits.

- [ ] Title, Start, Continue, options and saved progress work
- [ ] Intro cards advance and Mara's voice-over plays (or falls back cleanly)
- [ ] Stage 1: library puzzle, safe, candles and the exit work
- [ ] Stage 2: corridors, carried candle, paranoia and portrait logic work
- [ ] Stage 3: bottle A and decoy B appear immediately; bottle C only appears with emergency lighting (R)
- [ ] Stage 3: red-light board, correct A+C combination and pressure/experiment puzzles work
- [ ] Stage 4: nursery, music box, seance and hide-and-seek dolls work
- [ ] Stage 5: mirror-realm logic and letter side quest work
- [ ] Stage 6: memory shards, final confrontation, choices and ending screens work
- [ ] Cycle 02: Cell A accepts **105**; **104** gives ACCESS DENIED
- [ ] Cycle 02: other cell codes, radio knobs, tape locker and recording order work
- [ ] Maze route: switchboard, room traversal, Unwinder assembly and finale work
- [ ] Sound/music toggles, touch controls, keyboard input and pause/menu behavior work
- [ ] No console errors; latest deployment serves the new `game.js` and audio assets

Avoid treating passing the bundle check as a replacement for browser playtesting after behavior changes.
