# hwan &middot; [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/jaycho1214/DIV2CSU/pulls)

**hwan**은 수기로 진행되는 상벌점 제도를 웹사이트화 하여 상벌점 누락 등의 문제를 해결하고 신뢰성을 높히며 행정소요를 획기적이게 줄어들게함. 

- **상점 관리** (용사 상점 신청 및 간부 상점 승인 등...)

hwan은 탄약사령부 예하 9탄약창 탄약중대 2소대장 중위 임채환에 의해 제작됨.

## 📋 Tech Stack

- 웹프레임워크: [NextJS](https://nextjs.org/)
- 데이터베이스: [PostgreSQL](https://postgresql.org/)
- SQL Query Builder: [Kysely](https://kysely.dev/)
- 데이터베이스 Schema 관리: [Prisma](https://www.prisma.io/)
- Styling: [Tailwindcss](https://tailwindcss.com/), [Ant Design](https://ant.design/)


## 🎉 웹사이트 Deploy
### 설치 및 Build
```
yarn install
yarn build
```

### 웹사이트가 구동되기 위해 다음 .env 파일이 필요
```
POSTGRES_URL="<POSTGRES_CONNECTION_STRING>"
JWT_SECRET_KEY="<COMPLEX_RANDOM_STRING>"
```

## 👏 How to contribute
