const http = require('http');
// 'http' 모듈을 가져와서 HTTP 서버를 생성하고 관리하는 데 사용함
const fs = require('fs').promises;
// 'fs' 모듈을 가져와서 파일 시스템 관련 작업을 비동기적으로 수행하는 데 사용함
const path = require('path');
// 'path' 모듈을 가져와서 파일 및 디렉토리 경로를 조작하고 분석하는 데 사용함

const users = {}; // 데이터베이스 대신 users 객체를 선언해 사용자 정보를 저장

http.createServer(async (req, res) => {
    try {
        console.log(req.method, req.url);
        if (req.method === 'GET') { // req.method 로 HTTP 요청 메서드를 구분
            if (req.url === '/') { // 메서드가 GET -> req.url로 요청 주소를 구분
                const data = await fs.readFile(path.join(__dirname, 'restFront.html'));
                // 주소가 / 일 경우 -> restFront.html을 제공
                res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                return res.end(data);
            } else if (req.url === '/about') {
                // 주소가 /about -> about.html 제공
                const data = await fs.readFile(path.join(__dirname, 'about.html'));
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
                    const { name } = JSON.parse(body); // 받은 데이터(문자열)를 JSON으로 변환해서 사용
                    const id = Date.now();
                    users[id] = name;
                    res.writeHead(201, { 'Content-Type' : 'text/plain; charset=utf-8' });
                    res.end('등록 성공');
                });
            }
        } else if (req.method === 'PUT') {  
            if (req.url.startsWith('/user/')) { // 해당 아이디의 사용자 데이터를 수정
                const key = req.url.split('/')[2];
                let body = '';
                req.on('data', (date) => { // 요청의 본문에 들어있는 데이터를 꺼내기 위한 작업
                    body += data;
                });
                return req.on('end', () => {  // 요청의 본문에 들어있는 데이터를 꺼내기 위한 작업
                    console.log('PUT 본문(body):', body);
                    users[key] = JSON.parse(body).name; // 받은 데이터(문자열)를 JSON으로 변환해서 사용
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify(users));
                });
            }            
        } else if (req.method === 'DELETE') {
            if (req.url.startsWith('/user/')) {
                const key = req.url.split('/')[2];
                delete users[key];
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