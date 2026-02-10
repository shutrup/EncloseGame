# Plan

1. Add API `ai` module with `POST /ai/move`.
2. Implement server AI engine (easy/medium/hard) and payload validation.
3. Wire `AiModule` into `AppModule`.
4. Add web API client helper for AI move request.
5. Update web store AI scheduling to use API first, fallback to local `computeAIMove`.
6. Run lightweight typecheck for touched workspaces only if quick.
7. Commit and push to `main`.
