// Local test ingress only. The Next container and Mongo have no host ports.
// Always overwrite the estimator header with the actual socket peer; never log it.
const http = require("node:http");
const server = http.createServer({ maxHeaderSize: 8192 }, (request, response) => {
  if (request.headers.host !== "localhost:3404") { response.writeHead(421); response.end(); return; }
  const headers = { ...request.headers };
  for (const name of ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-lumix-client-ip"]) delete headers[name];
  headers["x-lumix-client-ip"] = request.socket.remoteAddress;
  const collector = request.url === "/api/visitors";
  if (collector && Number(headers["content-length"] ?? 0) > 256) { response.writeHead(413); response.end(); return; }
  const upstream = http.request({ hostname: "analytics", port: 3000, method: request.method, path: request.url, headers }, (reply) => {
    response.writeHead(reply.statusCode, { ...reply.headers, "referrer-policy": "no-referrer" });
    reply.pipe(response);
  });
  upstream.on("error", () => { if (!response.headersSent) response.writeHead(502); response.end(); });
  let size = 0;
  request.on("data", chunk => {
    size += chunk.length;
    if (collector && size > 256) { upstream.destroy(); if (!response.headersSent) response.writeHead(413); response.end(); }
  });
  request.on("error", () => upstream.destroy());
  response.on("close", () => upstream.destroy());
  request.pipe(upstream);
});
server.requestTimeout = 5000;
server.headersTimeout = 5000;
server.maxHeadersCount = 50;
server.listen(8080, "0.0.0.0");
