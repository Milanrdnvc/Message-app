const { createServer } = require('http');
const router = new (require('./router'))();
const ecstatic = require('ecstatic');
const defaultHeaders = { 'Content-Type': 'application/json' };

class MessageAppServer {
  constructor() {
    this.messages = [];
    this.version = 0;
    this.waiting = [];

    const fileServer = ecstatic({ root: './public' });

    this.server = createServer((req, res) => {
      const resolved = router.resolve(this, req);

      if (resolved) {
        resolved
          .catch(err => {
            if (err.status !== null) return err;
            return { body: String(err), status: 500 };
          })
          .then(({ body, status = 200, headers = defaultHeaders }) => {
            res.writeHead(status, headers);
            res.end(body);
          });
      } else {
        fileServer(req, res);
      }
    });
  }

  start(port) {
    this.server.listen(port);
  }

  stop() {
    this.server.close();
  }

  messageResponse() {
    return {
      body: JSON.stringify(this.messages),
      headers: { 'Content-Type': 'application/json', ETag: `${this.version}` },
    };
  }

  waitForChanges(time) {
    return new Promise(resolve => {
      this.waiting.push(resolve);

      setTimeout(() => {
        if (!this.waiting.includes(resolve)) return;
        this.waiting = this.waiting.filter(r => r !== resolve);
        resolve({ status: 304 });
      }, time * 1000);
    });
  }

  updated() {
    this.version++;
    const response = this.messageResponse();
    this.waiting.forEach(resolve => resolve(response));
    this.waiting = [];
  }
}

router.add('GET', '/messages', async (server, req) => {
  const tag = /"(.*)"/.exec(req.headers['if-none-match']);
  const wait = /\bwait=(\d+)/.exec(req.headers['prefer']);

  if (!tag || tag[1] !== server.version) {
    return server.messageResponse();
  } else if (!wait) {
    return { status: 304 };
  } else {
    return server.waitForChanges(Number(wait[1]));
  }
});

router.add('POST', '/messages', async (server, req) => {
  const reqBody = await readStream(req);
  let message;
  try {
    message = JSON.parse(reqBody);
  } catch (_) {
    return {
      status: 400,
      body: 'Invalid JSON',
    };
  }

  if (
    !message ||
    typeof message.username !== 'string' ||
    typeof message.body !== 'string'
  ) {
    return { status: 400, body: 'Bad message data' };
  }

  server.messages.push(message);
  server.updated();

  return { status: 204 };
});

function readStream(stream) {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('error', reject);
    stream.on('data', chunk => (data += chunk.toString()));
    stream.on('end', () => resolve(data));
  });
}

new MessageAppServer().start(5000);
