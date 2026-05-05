const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { MESSAGES, STATUS_CODES } = require("../constants");
const AppError = require("../utils/app-error");

const execFileAsync = promisify(execFile);

const decodeXmlEntities = (value) => {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

const compactWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const parseTagAttributes = (xmlContent, tagName) => {
  const tagMatch = xmlContent.match(new RegExp(`<${tagName}\\b([^>]*)\\/?>`, "i"));

  if (!tagMatch) {
    return null;
  }

  const attributes = {};
  const attributePattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/g;
  let attributeMatch = attributePattern.exec(tagMatch[1]);

  while (attributeMatch) {
    attributes[attributeMatch[1]] = decodeXmlEntities(attributeMatch[2]);
    attributeMatch = attributePattern.exec(tagMatch[1]);
  }

  return attributes;
};

const parseTagText = (xmlContent, tagName) => {
  const tagMatch = xmlContent.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return tagMatch ? compactWhitespace(tagMatch[1]) : "";
};

const toTitleCase = (value) => {
  return compactWhitespace(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const normalizeGender = (value) => {
  const normalized = compactWhitespace(value).toLowerCase();

  if (normalized === "m" || normalized === "male") {
    return "Male";
  }

  if (normalized === "f" || normalized === "female") {
    return "Female";
  }

  if (normalized === "t" || normalized === "transgender") {
    return "Transgender";
  }

  return compactWhitespace(value);
};

const guessPhotoMimeType = (base64Value) => {
  if (base64Value.startsWith("/9j/")) {
    return "image/jpeg";
  }

  if (base64Value.startsWith("iVBOR")) {
    return "image/png";
  }

  if (base64Value.startsWith("R0lGOD")) {
    return "image/gif";
  }

  return "image/jpeg";
};

const findFirstXmlFile = async (directoryPath) => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      const nestedXmlFile = await findFirstXmlFile(entryPath);

      if (nestedXmlFile) {
        return nestedXmlFile;
      }

      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".xml") {
      return entryPath;
    }
  }

  return null;
};

const extractXmlContent = async (fileBuffer, originalName, shareCode) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new AppError(MESSAGES.SCHOLARSHIPS.EMPTY_AADHAAR_FILE, STATUS_CODES.BAD_REQUEST);
  }

  const extension = path.extname(String(originalName || "")).toLowerCase();

  if (extension === ".xml") {
    return fileBuffer.toString("utf8");
  }

  if (extension !== ".zip") {
    throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_AADHAAR_FILE_FORMAT, STATUS_CODES.BAD_REQUEST);
  }

  if (!/^\S{4,32}$/.test(String(shareCode || ""))) {
    throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_AADHAAR_SHARE_CODE, STATUS_CODES.BAD_REQUEST);
  }

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aadhaar-ekyc-"));

  try {
    const archivePath = path.join(tempRoot, "aadhaar-offline.zip");
    const extractPath = path.join(tempRoot, "unzipped");

    await fs.mkdir(extractPath, { recursive: true });
    await fs.writeFile(archivePath, fileBuffer);

    await execFileAsync("7z", ["x", archivePath, `-p${shareCode}`, `-o${extractPath}`, "-y"]);

    const xmlFilePath = await findFirstXmlFile(extractPath);

    if (!xmlFilePath) {
      throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_AADHAAR_FILE_FORMAT, STATUS_CODES.BAD_REQUEST);
    }

    return await fs.readFile(xmlFilePath, "utf8");
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(MESSAGES.SCHOLARSHIPS.AADHAAR_PARSE_FAILED, STATUS_CODES.BAD_REQUEST);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
};

const buildAddress = (poaAttributes) => {
  return [
    poaAttributes.house,
    poaAttributes.street,
    poaAttributes.loc,
    poaAttributes.vtc,
    poaAttributes.subdist,
    poaAttributes.dist,
    poaAttributes.state,
    poaAttributes.pc,
    poaAttributes.country
  ]
    .map(compactWhitespace)
    .filter(Boolean)
    .join(", ");
};

const parseAadhaarXml = (xmlContent) => {
  const rootAttributes = parseTagAttributes(xmlContent, "OfflinePaperlessKyc");
  const poiAttributes = parseTagAttributes(xmlContent, "Poi");
  const poaAttributes = parseTagAttributes(xmlContent, "Poa");
  const photoBase64 = parseTagText(xmlContent, "Pht").replace(/\s+/g, "");

  if (!rootAttributes || !poiAttributes) {
    throw new AppError(MESSAGES.SCHOLARSHIPS.AADHAAR_PARSE_FAILED, STATUS_CODES.BAD_REQUEST);
  }

  return {
    referenceId: compactWhitespace(rootAttributes.referenceId),
    name: toTitleCase(poiAttributes.name),
    dob: compactWhitespace(poiAttributes.dob),
    gender: normalizeGender(poiAttributes.gender),
    address: poaAttributes ? buildAddress(poaAttributes) : "",
    emailHash: compactWhitespace(poiAttributes.e),
    mobileHash: compactWhitespace(poiAttributes.m),
    photoDataUrl: photoBase64 ? `data:${guessPhotoMimeType(photoBase64)};base64,${photoBase64}` : null
  };
};

const readAadhaarOfflineData = async ({ fileBuffer, originalName, shareCode }) => {
  const xmlContent = await extractXmlContent(fileBuffer, originalName, shareCode);
  return parseAadhaarXml(xmlContent);
};

module.exports = {
  readAadhaarOfflineData
};
