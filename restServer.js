const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const users = {};
const MAX_BODY_SIZE = 1024 * 1024;
const PORT = Number(process.env.PORT || 8082);

const publicFiles = new Map([
    ['/restFront.css', ['restFront.css', 'text/css; charset=utf-8']],
    ['/restFront.js', ['restFront.js', 'application/javascript; charset=utf-8']],
]);

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        let settled = false;

        req.setEncoding('utf8');
        req.on('data', (chunk) => {
            if (settled) return;

            body += chunk;
            if (Buffer.byteLength(body, 'utf8') > MAX_BODY_SIZE) {
                settled = true;
                reject(new HttpError(413, '요청 본문이 너무 큽니다.'));
            }
        });
        req.on('end', () => {
            if (settled) return;

            try {
                settled = true;
                resolve(JSON.parse(body));
            } catch (err) {
                settled = true;
                reject(new HttpError(400, '올바른 JSON 본문이 필요합니다.'));
            }
        });
        req.on('error', (err) => {
            if (settled) return;
            settled = true;
            reject(err);
        });
    });
}

function validateName(name) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new HttpError(400, '이름을 입력해야 합니다.');
    }
    return name.trim();
}

async function requestHandler(req, res) {
    try {
        console.log(req.method, req.url);
        const pathname = new URL(req.url, 'http://localhost').pathname;

        if (req.method === 'GET') {
            if (pathname === '/') {
                const data = await fs.readFile(path.join(__dirname, 'restFront.html'));
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(data);
            }
            if (pathname === '/about') {
                const data = await fs.readFile(path.join(__dirname, 'about.html'));
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                return res.end(data);
            }
            if (pathname === '/users') {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify(users));
            }
            if (publicFiles.has(pathname)) {
                const [fileName, contentType] = publicFiles.get(pathname);
                const data = await fs.readFile(path.join(__dirname, fileName));
                res.writeHead(200, { 'Content-Type': contentType });
                return res.end(data);
            }
        }

        if (req.method === 'POST' && pathname === '/user') {
            const { name } = await readJsonBody(req);
            const id = Date.now();
            users[id] = validateName(name);
            res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('등록 성공');
        }

        if (req.method === 'PUT' && pathname.startsWith('/user/')) {
            const key = pathname.split('/')[2];
            const { name } = await readJsonBody(req);
            users[key] = validateName(name);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(users));
        }

        if (req.method === 'DELETE' && pathname.startsWith('/user/')) {
            const key = pathname.split('/')[2];
            delete users[key];
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify(users));
        }

        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('NOT FOUND');
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        const message = statusCode >= 500 ? 'INTERNAL SERVER ERROR' : err.message;
        if (!res.headersSent) {
            res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        return res.end(message);
    }
}

if (require.main === module) {
    http.createServer(requestHandler).listen(PORT, () => {
        console.log(`${PORT}번 포트에서 서버 대기중입니다.`);
    });
}

module.exports = { requestHandler };
