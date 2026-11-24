# The Hollow Manor

A browser-based horror puzzle game hosted at https://hollowmanor.radostradi-pogo.workers.dev/.

## Safe source layout

The playable game is still served from **game.js** via **index.html**, exactly as before. The source is now maintained in **37 small, ordered sections** inside `src/`:

- `src/stages/` — Stage 1–6 scenes, expansions and side quests
- `src/cycle-02/` — second-cycle rooms, cell block and reveal
- `src/maze/` — the maze, switchboard, rooms and Unwinder
- `src/puzzles/` — cross-stage interactions and puzzles
- `src/core/` — shared game state, UI, rendering and controls
- `src/endings/` — ending screens and checkpoints

The **exact execution order** is in [tools/game-sources.json](tools/game-sources.json).

### Editing the game

1. Edit the relevant file inside `src/` (do **not** edit `game.js` directly).
2. Run `npm run build` to regenerate the deployable `game.js`.
3. Run `npm test` to verify that the generated bundle is synchronized and JavaScript syntax is valid.
4. Commit the source file(s) **and** the updated `game.js`.

No `npm install` is necessary. Node.js 22 or newer is recommended.

### Why the browser still loads one file

The original game is wrapped in **one immediately invoked function** and shares variables and functions across every stage. Changing this to native ES modules would change lexical scope, initialization order, and event behavior. Rather than risk a regression, we first split the **editable source** by stage and use a deterministic, dependency-free concatenation build. This retains the **exact same JavaScript bytes** at the time of restructuring, and does not alter the Cloudflare deployment configuration.

**These source files are ordered build sections, not individually executable JavaScript/ES modules.** Do not import them as standalone scripts or reorder them without checking cross-stage dependencies. A later migration to native imports/exports should be a separate, thoroughly tested project.

### Validation

- `npm test` verifies that all source files reconstruct `game.js` byte-for-byte and checks JavaScript syntax.
- The GitHub workflow runs these checks automatically on pushes and pull requests.
- [docs/REGRESSION-CHECKLIST.md](docs/REGRESSION-CHECKLIST.md) provides the manual gameplay checks to perform after behavior-changing edits.

Prior-version backups are always available as ZIP archives of immutable Git commits.
