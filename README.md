# Orca (custom fork)

이 저장소는 [stablyai/orca](https://github.com/stablyai/orca)를 개인 용도로 커스터마이징하기 위한 fork입니다.
원본 Orca의 소개, 설치 방법, 기능 설명은 [원본 README](https://github.com/stablyai/orca#readme)를 참고합니다.

## 브랜치

| 브랜치               | 용도                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `main`               | 원본 `stablyai/orca`의 `main`과 같은 상태로만 유지합니다. 직접 커밋하지 않습니다.      |
| `develop`            | 개인 커스텀을 담는 브랜치입니다. 커스텀 앱은 이 브랜치에서 빌드합니다.                 |
| `feat/*`, `fix/*` 등 | 원본에 기여할 때 쓰는 브랜치입니다. `main`에서 만들고 `stablyai/orca`로 PR을 올립니다. |

## 원본 업데이트 반영

1. `upstream/main`의 변경을 `main`에 그대로 반영합니다.
2. `develop`을 `main` 위로 rebase하고 커스텀과 충돌한 부분을 해결합니다.

## License

원본과 같이 [MIT License](LICENSE)를 따릅니다.
