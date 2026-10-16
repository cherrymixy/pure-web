# Checks

STEP별 localhost 확인 기록.

| 날짜 | STEP | URL | 확인자 | 결과(OK/NG) | 메모 |
|---|---|---|---|---|---|
| 2026-10-16 | 1 | http://localhost:3000/dev | SeungA Jeon | OK | 1/14 implemented, Ollama 초록(qwen3:8b·gemma3:4b) |
| 2026-10-16 | 2 | http://localhost:3000/dev/sim | SeungA Jeon | OK | greet/happy 동작, sleepy·video 얼굴, capture, overdrive limitExceeded |
| 2026-10-16 | 3 | http://localhost:3000/dev/sim | SeungA Jeon | OK | speed 1.4, seek 1.2 정지, 관절 강조, overdrive 레시피 head_tilt 한계 정지, Stop→HOME |
| 2026-10-16 | 4 | http://localhost:3000/dev?tab=content | SeungA Jeon | OK | 타입5·관절5·동작15·패턴7, 가이드라인 3/5/18/16/7/5/13, placeholder 0 |
| 2026-10-16 | 5 | http://localhost:3000/dev?tab=db | SeungA Jeon | OK | 프로젝트5·라이브러리4·유저데이터15, Reset 동작, /api/projects JSON |
| 2026-10-16 | 6 | http://localhost:3000/dev/llm | SeungA Jeon | OK | ollama 배지·허용 목록 JSON, 데모 모드 시 demo 배지, 샘플 5개 docs/samples |
| 2026-10-16 | 7 | http://localhost:3000/dev/signature | SeungA Jeon | OK | 데모 PDF 톤·8축·How it maps p.N, URL, Figma/스캔 E1, Regenerate v0.N·Compare |
| 2026-10-16 | 8 | http://localhost:3000/dev/expression | SeungA Jeon | OK | overdrive 한계 초과 → Auto-adjust 통과, pure.json 23KB, LLM 샘플 검증 |
