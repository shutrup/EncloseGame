# Enclose

Enclose is a Dots and Boxes style strategy game focused on native iOS.

## Project Structure

- `/Users/sarap005931/Desktop/Enclose/Enclose` — SwiftUI iOS app
- `/Users/sarap005931/Desktop/Enclose/packages/game-core` — shared TypeScript game logic and AI experiments
- `/Users/sarap005931/Desktop/Enclose/ai-trainer` — Python Q-learning trainer for AI weights

## Development

### iOS app

1. Open `/Users/sarap005931/Desktop/Enclose/Enclose.xcodeproj` in Xcode.
2. Select target `Enclose`.
3. Run on simulator/device.

### Game-core (TypeScript)

```bash
npm install
npm run build
npm run typecheck
npm --workspace @enclose/game-core run test
```

### AI training

```bash
npm run train:ai
```

This updates:
- `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/data/weights.json`

## License

MIT — see `/Users/sarap005931/Desktop/Enclose/LICENSE`.
