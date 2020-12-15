const { parse } = require('url');

module.exports = class Router {
  constructor() {
    this.routes = [];
  }

  add(method, url, handler) {
    this.routes.push({ method, url, handler });
  }

  resolve(context, request) {
    const path = parse(request.url).pathname;

    for (let { method, url, handler } of this.routes) {
      if (url !== path || request.method !== method) continue;
      return handler(context, request);
    }

    return null;
  }
};
