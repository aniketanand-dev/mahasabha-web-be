const cluster = require("cluster");
const os = require("os");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const ensureDefaultAdmin = require("./seeders/default-admin.seeder");
const { ensureAllStorageFolders } = require("./services/media-storage.service");
const logger = require("./utils/logger");

const numCPUs = os.cpus().length;

const forkWorkers = () => {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} exited (${signal || code}). Restarting...`
    );
    cluster.fork();
  });

  logger.info(`Cluster mode enabled: ${numCPUs} worker processes started`);
};

const bootstrapPrimary = async () => {
  try {
    await connectDatabase();
    logger.info("MongoDB connected for primary bootstrap");

    await ensureAllStorageFolders();
    await ensureDefaultAdmin();
  } catch (error) {
    logger.error("Primary bootstrap failed", error);
    process.exit(1);
  } finally {
    await disconnectDatabase().catch(() => undefined);
  }

  forkWorkers();
};

const bootstrap = async () => {
  try {
    await connectDatabase();
    logger.info("MongoDB connected");

    await ensureAllStorageFolders();

    app.listen(env.PORT, () => {
      logger.info(`Worker ${process.pid} running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error("Server bootstrap failed", error);
    process.exit(1);
  }
};

if (cluster.isPrimary) {
  logger.info(`Primary ${process.pid} starting cluster with ${numCPUs} workers`);

  void bootstrapPrimary();
} else {
  bootstrap();
}
