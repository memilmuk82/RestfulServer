const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const test = require('node:test');

const { requestHandler } = require('./restServer');

class MockResponse {
    constructor() {
        this.body = '';
        this.headers = {};
        this.headersSent = false;
        this.statusCode = null;
    }

    writeHead(statusCode, headers = {}) {
        this.statusCode = statusCode;
        this.headers = headers;
        this.headersSent = true;
    }

    end(data = '') {
        this.body += data.toString();
    }
}

async function makeRequest(method, url, body = '') {
    const request = Readable.from(body ? [body] : []);
    request.method = method;
    request.url = url;
    const response = new MockResponse();

    await requestHandler(request, response);
    return response;
}

test('허용되지 않은 파일 경로를 제공하지 않는다', async () => {
    const response = await makeRequest('GET', '/../../etc/passwd');

    assert.equal(response.statusCode, 404);
    assert.equal(response.body, 'NOT FOUND');
});

test('잘못된 JSON은 400이며 다음 요청도 처리한다', async () => {
    const invalidResponse = await makeRequest('POST', '/user', '{invalid');
    const aliveResponse = await makeRequest('GET', '/users');

    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(aliveResponse.statusCode, 200);
});

test('지나치게 큰 요청 본문을 거부한다', async () => {
    const response = await makeRequest('POST', '/user', 'a'.repeat(1024 * 1024 + 1));

    assert.equal(response.statusCode, 413);
});

test('사용자 등록 요청을 처리한다', async () => {
    const createResponse = await makeRequest('POST', '/user', JSON.stringify({ name: '홍길동' }));
    const usersResponse = await makeRequest('GET', '/users');

    assert.equal(createResponse.statusCode, 201);
    assert.match(usersResponse.body, /홍길동/);
});
