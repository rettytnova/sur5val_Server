## sur5val_Server

#### client 
- [클라이언트 깃허브](https://github.com/rettytnova/sur5val_client)

#### 프로젝트 소개 페이지
- [브로셔](https://www.notion.so/teamsparta/Luck7-SUR-5-VAL-9be9151bd85f453ba04ce804b9423c8e)
- [노션](https://teamsparta.notion.site/Luck7-bdc25ef742fb4f96b650d4f83b7a804f?pvs=25)

#### 프로젝트 간략 소개
- 게임명 : SUR5VAL
- 장르 : 서바이벌 / RPG
- 특징 : 비대칭 pvp 서바이벌과 RPG요소(역할부여, 성장)를 섞은 게임

---

## 서비스 아키텍처
![서비스 아키텍처 PNG](https://github.com/user-attachments/assets/262ba460-1794-4e30-a557-c76eb1e28def)
![image](https://github.com/user-attachments/assets/ad992e6a-d11b-4121-80a0-77a6f9a2eab1)
![image](https://github.com/user-attachments/assets/46ccb634-fa54-4e59-8e83-3553c5666b70)
![image](https://github.com/user-attachments/assets/ce512825-f535-415d-9744-41c3a297cf24)
![image](https://github.com/user-attachments/assets/de6ed113-80d8-473b-8362-2c28b2b83c09)
![image](https://github.com/user-attachments/assets/c31739ae-ead0-4164-bce7-e0b2a5a031c9)
![image](https://github.com/user-attachments/assets/8bcfb60e-fe98-45c9-94de-a50c0c4fc2ac)


## 구현 기능 
1. 역할 분배
    - 게임 준비 단계에서 유저들에게 무작위 캐릭터가 주어집니다(보스 1명 무조건 포함)
2. 라운드 시스템
    - 한 매치를 여러번의 라운드로 구성하였으며 지정한 시간마다 새로운 게임 상태를 동기화 해주는것으로 새로운 라운드를 시작합니다.
3. 스킬, 장비, 아이템
    - 카드 사용 시 카드 유형에 따라(스킬, 장비, 아이템) 효과를 처리하고 동기화 합니다.
    - 스킬 카드는 사용 시 스킬버튼에 해당 스킬이벤트가 할당되며 버튼의 메소드 호출 시 서버에게 카드 사용 요청을 보냅니다.
    - 서버는 스킬 카드의 효과를 처리하고 동기화 합니다.
    - 장비 카드는 사용 시 카드 사용 요청을 보내며 장착칸으로 이동합니다. 서버는 장착 효과를 처리하고 동기화합니다.
    - 아이템 카드는 사용 시 카드 사용 요청을 보내고 서버는 사용 효과를 처리하고 동기화합니다.
4. 상점 구매/판매
    - 매 라운드마다 무작위 8장의 카드(장비, 아이템)가 상점에 존재하도록 설정하였습니다.
    - 카드마다 등급을 주어 라운드가 진행될 수록 높은 등급의 카드가 상점에 등장하게 됩니다.
    - 누군가 카드를 구매하면 동기화 되어 해당 카드는 품목에서 사라집니다.
    - 판매 기능을 통해 인벤토리에 있는 카드를 판매할 수 있습니다. 이 때, 판매한 카드가 상점에 다시 등록되지는 않습니다.
5. 몬스터
    - 몬스터는 라운드마다 강해지며 몬스터 종류별 데이터를 DB에서 조회하여 할당합니다.
    - 생성된 몬스터는 계속해서 무작위 방향으로 이동하며 해당위치는 모든 유저에게 동기화 됩니다.
    - 몬스터를 쓰러뜨릴 시 쓰러뜨린 유저에게 경험치와 골드가 주어집니다.
6. 게임 결과
    - 마지막 라운드에 게임 결과 조건에 해당하는 이벤트 발생 시 알맞는 결과를 동기화 합니다.
7. 채팅
    - 게임 서버와 별도의 채팅 서버가 존재합니다. 이는 '채팅'만을 담당한 서버입니다.
    - 클라이언트가 채팅 패킷을 보낼 시 채팅 서버에서 해당 이벤트를 처리합니다.
## 기술 
![image](https://github.com/user-attachments/assets/2d104b7d-d918-402f-866a-a7545653c827)

---

#### Code Convention
https://www.notion.so/teamsparta/Code-Convention-1342dc3ef51481b595a5d346dda6fbb1

#### Github Rules
https://www.notion.so/teamsparta/Github-Rules-1342dc3ef51481a9b95fef85d98a80e

※npm 환경에서 코드 작성됨

### 서버 실행 방법
- npm run build
.ts파일 .js파일로 빌드하기
src 디렉토리에서 작성하여 dist 디렉토리에서 파일이 빌드됨

- npm run server 
게임 서버 연결하기

- npm run chattingServer
채팅 서버 연결하기

---

### 기능에 따른 파일/폴더 분류
#### SUR5VAL Directory
    - chattingProtobuf
        채팅 서버와 클라이언트 간 주고 받을 protobuf 패킷 정의
    - chattingServer
        클라이언트와 통신할 채팅서버 (게임 내 채팅 기능 담당)
    - config
        전역 상수 정의
    - database
        서버와 통신할 데이터베이스(MySQL, Redis)
    - dummyClient
        테스트를 위한 더미 클라이언트
    - gameServer
        클라이언트와 통신할 게임서버 (채팅 기능 외 모든 게임 내 기능 담당)
    - packet
        패킷을 송수신할 때 필요한 기능 정의
    - protobuf
        게임 서버와 클라이언트 간 주고 받을 protobuf 패킷 정의
    - utils
        공용 함수(전역 함수) 정의


#### config에서 정의되어 있는 상수들
    - REDIS, MySQL 데이터베이스 정보
    - 클라이언트와 송수신할 버퍼 길이, 타입 등의 상수값 정보
    - 패킷 타입(해당 패킷 타입에 따라 주고받을 데이터의 속성이 달라짐)
    - packetMaps 
        (설명 필요)
    - chattingPacketMaps
        (설명 필요)
    

#### gameServer
    - class/server.ts (file)
        실행되는 게임 서버를 클래스로 정의한 파일
    - events (folder)
        서버의 패킷 수신/연결 상태에 따른 기능이 정의된 폴더
        onData.ts에서 데이터를 받을 때 버퍼를 해석하여 패킷의 타입, 버전, 페이로드 등을 해석하여 데이터를 처리한다.
    - handlers (folder)
        onData.ts에서 데이터를 받을 때 데이터를 처리하기 위해 기능 별로 정의되어있는 handlers 폴더 내 파일들이 핸들러 파일로서 정의되어 있음
    - interface/interface.ts (file)
        커스터마이징한 인터페이스(ts문법에 따른 interface)가 정의되어 있는 파일
    - session (folder)
        데이터베이스(Redis, MySQL)이 아닌 게임 서버 자체적으로 데이터를 저장하기 위한 세션 객체들이 정의되어 있음
    
---


 ## dummyClient 사용법
    - npm run dummyClient를 터미널에 입력해 실행   
![더미 화면](https://github.com/user-attachments/assets/75a6dcd0-e3a9-4502-823f-6f054cd27594)
    
    메뉴 설명
     - 1 더미 클라 생성 (생성할 더미의 개수를 입력 ( 입력 후 일정 시간이 지나면 서버에 접속 ) )
![더미 생성 화면](https://github.com/user-attachments/assets/057e4c11-62f7-4bce-a0f5-57aa456f0eb3)    

     - 2 더미 클라 회원가입 ( 생성한 더미의 개수 만큼 회원가입 진행 )
     - 3 더미 클라 로그인 ( 생성한 더미의 개수 만큼 로그인 진행 )
     - 4 더미 클라로 게임을 시작 
     - 5 생성한 더미 클라 모두 접속 종료

사용 방법
 - 1 을 선택하고 생성할 더미 클라의 개수를 입력
 - 2 를 눌러 회원가입을 진행 ( 회원 가입을 이미 했으면 생략 하고 3을 눌러 로그인을 진행 해야함 )
 - 3 을 눌러 로그인을 진행
 - 4 를 눌러 게임을 시작 ( 로그인을 하고 진행 해야 더미 클라가 정상적으로 작동 )
 
    
