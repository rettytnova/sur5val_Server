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

### 서비스 아키텍처

### 구현 기능 

### 기술 

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

 #### dummyClient 사용법
    - npm run dummyClient를 터미널에 입력해 실행   
![더미 화면](https://github.com/user-attachments/assets/75a6dcd0-e3a9-4502-823f-6f054cd27594)
    
    메뉴 설명
     - 1 더미 클라 생성
![더미 생성 화면](https://github.com/user-attachments/assets/057e4c11-62f7-4bce-a0f5-57aa456f0eb3)
    
    생성할 더미의 개수를 입력 ( 입력 후 일정 시간이 지나면 서버에 접속 )

     - 2 더미 클라 회원가입 ( 생성한 더미의 개수 만큼 회원가입 진행 )
     - 3 더미 클라 로그인 ( 생성한 더미의 개수 만큼 로그인 진행 )
     - 4 더미 클라로 게임을 시작 
     - 5 생성한 더미 클라 모두 접속 종료

사용 방법
 - 1 을 선택하고 생성할 더미 클라의 개수를 입력
 - 2 를 눌러 회원가입을 진행 ( 회원 가입을 이미 했으면 생략 하고 3을 눌러 로그인을 진행 해야함 )
 - 3 을 눌러 로그인을 진행
 - 4 를 눌러 게임을 시작 ( 로그인을 하고 진행 해야 더미 클라가 정상적으로 작동 )
 
    
