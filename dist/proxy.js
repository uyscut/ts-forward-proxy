"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const net_1 = __importDefault(require("net"));
const url_1 = __importDefault(require("url"));
const PORT = 3000;
// Create an HTTP server that acts as a proxy
const server = http_1.default.createServer((req, res) => {
    // For normal HTTP requests
    const parsed = url_1.default.parse(req.url || '');
    console.log(`[HTTP] ${req.method} ${parsed.protocol || 'http:'}//${parsed.hostname}${parsed.path}`);
    const options = {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.path,
        method: req.method,
        headers: req.headers,
    };
    const proxyReq = http_1.default.request(options, (proxyRes) => {
        console.log(`[HTTP] <- ${parsed.hostname}:${options.port} ${proxyRes.statusCode}`);
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });
    req.pipe(proxyReq, { end: true });
    proxyReq.on('error', (err) => {
        res.writeHead(500);
        res.end(`Proxy error: ${err.message}`);
    });
});
// Handle HTTPS tunneling with CONNECT
server.on('connect', (req, clientSocket, head) => {
    const [host, port] = (req.url || '').split(':');
    console.log(`[CONNECT] ${host}:${port}`);
    const serverSocket = net_1.default.connect(parseInt(port, 10), host, () => {
        console.log(`[CONNECT] Tunnel established -> ${host}:${port}`);
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });
    serverSocket.on('error', (err) => {
        clientSocket.end(`Proxy tunnel error: ${err.message}`);
    });
});
server.listen(PORT, () => {
    console.log(`Forward proxy listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=proxy.js.map