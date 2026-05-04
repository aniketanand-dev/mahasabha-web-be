const fs = require("fs/promises");
const path = require("path");

const frontendUploadsRootDir = path.resolve(__dirname, "..", "..", "Veerashiva_Mahasabha", "public", "uploads");
const backendUploadsRootDir = path.resolve(__dirname, "..", "uploads");

const copyDirectory = async (sourceDir, destinationDir) => {
  await fs.mkdir(destinationDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
      continue;
    }

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
  }
};

const listAllFiles = async (directory) => {
  const items = [];
  const walk = async (currentDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else {
        items.push(absolutePath);
      }
    }
  };

  await walk(directory);
  return items;
};

const run = async () => {
  try {
    await fs.access(frontendUploadsRootDir);
  } catch {
    console.log("Frontend uploads folder does not exist. Nothing to migrate.");
    return;
  }

  await fs.mkdir(backendUploadsRootDir, { recursive: true });
  const frontendFiles = await listAllFiles(frontendUploadsRootDir);

  if (!frontendFiles.length) {
    await fs.rm(frontendUploadsRootDir, { recursive: true, force: true });
    console.log("Frontend uploads folder was empty and has been removed.");
    return;
  }

  await copyDirectory(frontendUploadsRootDir, backendUploadsRootDir);
  await fs.rm(frontendUploadsRootDir, { recursive: true, force: true });

  console.log(`Migrated ${frontendFiles.length} uploaded files into ${backendUploadsRootDir}`);
  console.log(`Removed old frontend uploads folder: ${frontendUploadsRootDir}`);
};

run().catch((error) => {
  console.error("Upload migration failed.");
  console.error(error);
  process.exitCode = 1;
});