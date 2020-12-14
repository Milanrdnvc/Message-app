const { createServer } = require('http');
const router = new (require('./router'))();
const ecstatic = require('ecstatic');
const defaultHeaders = { 'Content-Type': 'application/json' };

class MessageAppServer {
  constructor(messages) {
    this.messages = messages;
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
    this.server.start(port);
  }

  stop() {
    this.server.close();
  }
}
