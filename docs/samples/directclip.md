# STEP 12 — directClip (Tier 2) samples

Run 2026-10-16 on the dev Mac: Ollama `gemma3:4b` (vision, Tier 2 / describe) + `qwen3:8b` (Tier 1), PURE Desk structure (rig ranges), PURE Default signature.
Each video: flag **on** ×3, flag **off** ×1 (baseline). Frames = 8 centred samples, ≤512 px JPEG (same rule as the browser, extracted with ffmpeg).
"Wall" = whole generate job (incl. a Tier 1 retry after a Tier 2 timeout).

Videos (Wikimedia Commons, kept out of the repo):
- **cat** — "Cat yawning in slow motion" (19.3 s) · Grendelkhan · CC BY-SA 4.0 · prompt "I'm so tired, I keep nodding off"
- **human** — "Berlin girl turning a hula hoop, Berlin 2013" (14.1 s) · Thomas Quine · CC BY 2.0 · prompt "The presentation went well today!"

## Results

| Video | Flag | Run | Tier 2 | Wall | Mode | Keyframes (joint: t→value) | Recipe |
|---|---|---|---|---|---|---|---|
| cat | on | 1 | used (47.7 s) | 49.4 s | clip | head_pan −15→−10→−15 · head_tilt −8→−6→−8 · shoulder −35 flat | nod, nod |
| cat | on | 2 | used (15.7 s) | 16.7 s | clip | head_pan 0→−15→−10 · head_tilt −30→−33→−33 · shoulder −35 flat | nod |
| cat | on | 3 | used (16.1 s) | 16.8 s | clip | head_pan **−160**→−145→−160 · head_tilt −33→−28 · shoulder −35→−30 | nod |
| cat | off | — | — | 54.1 s | recipe | — | nod, greet (+describe) |
| human | on | 1 | **timeout 60 s** → recipe | 129.9 s | recipe | — | greet, nod |
| human | on | 2 | **timeout 60 s** → recipe | 119.9 s | recipe | — | greet, focus |
| human | on | 3 | used (54.8 s) | 55.9 s | clip | all 5 joints: base_yaw −10→15 · shoulder −30→**35** · elbow **−120**→−110 · head_pan **−160**→−140 · head_tilt **−33**→−30 | shake |
| human | off | — | — | 48.7 s | recipe | — | happy, nod, greet (+describe) |

Tier 2 keyframes used: **4 / 6** (cat 3/3, human 1/3). Fallbacks: 2 × vision timeout (60 s), 0 × invalid keyframes.

## Observations

- **Keyframes are templated, not read from the video.** Every clip is 3 keys at 0 / mid / end (out-and-back), 4–6 s. Nothing follows the yawn or the hoop rhythm.
- **Values hug the joint limits.** gemma3:4b copies the range ends from the prompt: shoulder −35 (min), elbow −120 (min), head_pan −160 (min → robot faces away), head_tilt −33 (min). Validation keeps them legal, but the poses look broken.
- **Too slow for the demo.** Tier 2 alone took 15–55 s; on a timeout the job then runs Tier 1 (another ~60 s), so flag on can cost 2 minutes. Even flag off with a video reference took ~50 s (describe + generate), well above the PRD's 5–15 s.
- **Tier 1 with the reference was better.** The describe step summarised both videos correctly ("tabby cat … relaxed, slow gaze", "woman … hula hoop … rhythmic"), and the recipes matched the mood (sleepy nod / happy greet).
- Flow-based Match timing (also under the flag) was not part of these runs; it is unit-tested only.

## Recommendation

Keep **directClip off** for the exhibition (default). Revisit only with a stronger vision model or a prompt that asks for relative offsets from rest instead of absolute angles. Separate from the flag: the video-reference path (describe + generate ≈ 50 s) needs speeding up before the demo — e.g. fewer/smaller frames for describe, or caching the summary per reference.
