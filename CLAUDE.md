# CLAUDE.md

@AGENTS.md

## Fork 운영 규칙

이 저장소는 `stablyai/orca`의 개인 커스텀 fork다. 코드 규칙은 `AGENTS.md`를 따르고, 이 문서는 브랜치 운영만 다룬다.

### 브랜치

- `main`: `upstream/main`과 같은 상태로만 유지한다. 직접 커밋하지 않는다.
- `develop`: 커스텀 작업 브랜치다. 커스텀 작업의 베이스는 `develop`이다.
- 원본 기여 브랜치(`feat/*`, `fix/*` 등): 베이스는 `main`이다. `develop`에서 만들지 않는다. PR은 `stablyai/orca`의 `main`으로 올린다.

### 원본 업데이트 반영

시작 조건: 현재 브랜치가 `develop`이고 작업 트리가 clean해야 한다. 아니면 멈추고 보고한다.

1. `upstream` 원격이 없으면 추가한다: `git remote add upstream https://github.com/stablyai/orca`
2. `git fetch upstream`
3. `main` 갱신: `git push origin upstream/main:main` 후 `git fetch origin main:main`
   - fast-forward가 거부되면 `main`이 원본과 갈라진 것이다. 강제로 맞추지 말고 멈추고 보고한다.
4. `develop`에서 `git rebase main`
5. 충돌 해결 (rebase 중에는 `--ours`가 `main`, `--theirs`가 커스텀 커밋이다)
   - `README.md`, `CLAUDE.md`: 커스텀 버전을 유지한다(`git checkout --theirs <file>`).
   - 그 밖의 파일: 원본 변경과 커스텀 의도를 모두 살린다. 의도가 불분명하면 멈추고 묻는다.
6. 검증: lockfile이 바뀌었으면 `pnpm install`, 이어서 `pnpm tc`를 실행한다.
7. 결과(가져온 원본 커밋 수, 충돌 파일과 해결 방식, 검증 결과)를 보고한다. `git push --force-with-lease origin develop`은 사용자 승인 후에만 한다.
