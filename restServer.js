const http = require('http');
// 'http' 모듈을 가져와서 HTTP 서버를 생성하고 관리하는 데 사용함
const fs = require('fs').promises;
// 'fs' 모듈을 가져와서 파일 시스템 관련 작업을 비동기적으로 수행하는 데 사용함
const path = require('path');
// 'path' 모듈을 가져와서 파일 및 디렉토리 경로를 조작하고 분석하는 데 사용함

const users = {}; // 데이터베이스 대신 users 객체를 선언해 사용자 정보를 저장

http.createServer(async (req, res) => {
    try {
        console.log(req.method, req.url); // 현재 요청(req)의 http 메서드와 url을 콘솔에 출력
        if (req.method === 'GET') { // req.method가 GET이면 아래의 블럭 실행
            if (req.url === '/') { // 요청 URL이 '/'(루트)라면 다음 블록을 실행
                const data = await fs.readFile(path.join(__dirname, 'restFront.html'));
                // 주소가 / 일 경우 -> restFront.html을 제공
                res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                return res.end(data); // 응답 데이터로 읽어들인 'restFront.html'의 내용을 클라이언트에 전송
            } else if (req.url === '/about') {
                // 주소가 /about -> about.html 제공
                const data = await fs.readFile(path.join(__dirname, 'about.html'));
                // fs.readFile() ->  Node.js의 파일 시스템 모듈(fs)에서 제공하는 비동기 파일 읽기 함수
                // __dirname -> 현재 실행 중인 스크립트 파일의 디렉토리 이름을 나타내는 Node.js 특별 변수
                // path.join(__dirname, 'about.html' -> 현재 스크립트 파일이 위치한 디렉토리와 요청된 URL을 결합하여 파일의 전체 경로를 생성
                // 요청된 URL에 해당하는 파일의 내용이 data 변수에 저장됨.
                res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                return res.end(data);
            } else if (req.url === '/users') {
                res.writeHead(200, { 'Content-Type' : 'application/json; charset=utf-8' });
                return res.end(JSON.stringify(users));
                // res.end() -> HTTP 응답을 완료하는 메서드로, 서버가 클라이언트에게 데이터를 전송하고 응답을 종료
                // JSON.stringify(users) -> JavaScript 객체인 users를 JSON 문자열로 변환
            }        
            // 주소가 /, /about, /users 모두 아니면
            try {
                const data = await fs.readFile(path.join(__dirname, req.url)); //  주소에 적힌 파일을 제공
                return res.end(data); // return이 있어야 함수가 종료됨.
            } catch(err) {            
                // 존재하지 않는 파일을 요청했거나 GET 메서드 요청이 아닌 경우
                // 주소에 해당하는 라우트를 찾지 못했다는 404 Not Found error 발생
            }
        } else if (req.method === 'POST') { // 사용자를 새로 저장
            if (req.url === '/user') { 
                let body = ''; // 요청의 body를 stream 형식으로 받음
                req.on('data', (data) => { // 요청의 본문에 들어있는 데이터를 꺼내기 위한 작업
                    body += data;
                }); 
                // 요청의 body를 다 받은 후 실행됨
                return req.on('end', () => { 
                    console.log('POST 본문(body):', body);
                    const { name } = JSON.parse(body); 
                    // JSON.parse(body) ->  받은 데이터를 JSON으로 파싱하여 JavaScript 객체로 변환
                    // 받은 데이터를 JSON으로 파싱하여 JavaScript 객체로 변환하고, 이 객체에서 name 속성을 추출하여 name 변수에 할당
                    const id = Date.now();
                    // Date.now() -> 현재 시간을 밀리초 단위로 반환
                    // 고유한 ID 값을 생성
                    users[id] = name;
                    // id를 키로 하고, name을 값으로 하는 새로운 속성을 users 객체에 추가
                    res.writeHead(201, { 'Content-Type' : 'text/plain; charset=utf-8' });
                    res.end('등록 성공');
                });
            }
        } else if (req.method === 'PUT') {  
            if (req.url.startsWith('/user/')) { // 만약 요청 URL이 '/user/'로 시작한다면 아래의 블록을 실행
                const key = req.url.split('/')[2];  // 요청 URL에서 사용자의 고유 키를 추출
                // split('/') 함수는 URL을 '/' 기준으로 분할하고, 그 중에서 세 번째 요소를 key로 지정
                let body = '';
                req.on('data', (data) => { // 요청의 본문에 들어있는 데이터를 꺼내기 위한 작업
                    body += data;
                }); // 클라이언트가 요청의 본문에 담아 보낸 데이터를 수신하여 body 변수에 저장
                return req.on('end', () => {  // 요청의 본문에 들어있는 데이터를 꺼내기 위한 작업
                    console.log('PUT 본문(body):', body);
                    users[key] = JSON.parse(body).name; // 받은 데이터(문자열)를 JSON으로 변환해서 사용
                    // JSON.parse(body) -> 받은 데이터를 JSON으로 파싱하여 JavaScript 객체로 변환
                    // name 속성을 추출하여 해당 속성 값을 users 객체의 key에 할당
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify(users));
                    // JSON.stringify() -> JavaScript 객체나 값들을 JSON 문자열로 변환
                });
            }            
        } else if (req.method === 'DELETE') {
            if (req.url.startsWith('/user/')) { // 만약 요청 URL이 '/user/'로 시작한다면 아래의 블록을 실행
                const key = req.url.split('/')[2]; // 요청 URL에서 사용자의 고유 키를 추출
                // split('/') 함수는 URL을 '/' 기준으로 분할하고, 그 중에서 세 번째 요소를 key로 지정
                delete users[key]; // users 객체에서 key에 해당하는 속성을 삭제 ->  특정 사용자를 삭제하는 기능 구현, key -> 해당 사용자의 고유한 식별자
                res.writeHead(200, { 'Content-type': 'application/json; charset=utf-8 '});
                return res.end(JSON.stringify(users));
            }
        }
        res.writeHead(404); 
        return res.end('NOT FOUND'); 
        // return 없이 res.end 등의 메서드가 중복 실행되면 Error: Can't render headers after they are sent to the client 에러 발생
    } catch (err) { // 응답 과정에서 예기치 못한 에러가 발생하는 경우
        console.error(err);
        res.writeHead(500);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); // 500 에러가 응답으로 전송됨.
        res.end(err.message);
    }
})
    .listen(8082, () => {
        console.log('8082번 포트에서 서버 대기중입니다.');
});