class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  register(queryName, handler) {
    this.handlers.set(queryName, handler);
  }

  async execute(query) {
    const queryName = query.constructor.name;
    const handler = this.handlers.get(queryName);
    if (!handler) {
      throw new Error(`No query handler registered for: ${queryName}`);
    }
    return handler.execute(query);
  }
}

module.exports = QueryBus;
