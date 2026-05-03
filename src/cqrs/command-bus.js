class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandName, handler) {
    this.handlers.set(commandName, handler);
  }

  async execute(command) {
    const commandName = command.constructor.name;
    const handler = this.handlers.get(commandName);
    if (!handler) {
      throw new Error(`No command handler registered for: ${commandName}`);
    }
    return handler.execute(command);
  }
}

module.exports = CommandBus;
