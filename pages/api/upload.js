// pages/api/upload.js
import fs from "fs";
import path from "path";
import formidablePkg from "formidable";
import { redis } from "../../lib/redis";

export const config = {
  api: {
    bodyParser: false, // allow formidable to parse multipart
  },
};

function sanitizeFilename(name = "") {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, "-")
    .replace(/\-+/g, "-")
    .replace(/(^\-|\-$)/g, "");
}

// Choose a parser that supports multiple formidable versions.
function createFormidable(options = {}) {
  const f = formidablePkg;

  // v3+ (formidable is a function that returns a form instance)
  if (typeof f === "function") {
    try {
      const form = f(options);
      if (form && typeof form.parse === "function") return form;
    } catch (e) {}
  }

  // v2 style: new formidable.IncomingForm()
  if (f && typeof f.IncomingForm === "function") {
    try {
      const Form = f.IncomingForm;
      const form = new Form(options);
      return form;
    } catch (e) {}
  }

  // wrapper under default
  if (f && f.default) {
    const g = f.default;
    if (typeof g === "function") {
      try {
        const form = g(options);
        if (form && typeof form.parse === "function") return form;
      } catch (e) {}
    }
    if (g && typeof g.IncomingForm === "function") {
      try {
        const form = new g.IncomingForm(options);
        return form;
      } catch (e) {}
    }
  }

  throw new Error("Could not initialize formidable: unsupported package shape");
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    try {
      const form = createFormidable({
        multiples: false,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024,
      });
      if (typeof form.parse === "function") {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields: fields || {}, files: files || {} });
        });
      } else {
        reject(new Error("Formidable parse method not found on instance"));
      }
    } catch (err) {
      reject(err);
    }
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const contentType = req.headers["content-type"] || "(none)";
  console.log("[upload] content-type:", contentType);
  console.log(
    "[upload] x-admin-token present?",
    !!req.headers["x-admin-token"]
  );

  let fields = {},
    files = {};

  try {
    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseMultipart(req);
      fields = parsed.fields || {};
      files = parsed.files || {};
      console.log(
        "[upload] multipart parsed. fields keys:",
        Object.keys(fields),
        "files keys:",
        Object.keys(files)
      );
    } else {
      const parsed = await parseJsonBody(req);
      fields = parsed || {};
      files = {};
      console.log("[upload] json parsed. fields keys:", Object.keys(fields));
    }
  } catch (err) {
    console.error(
      "[upload] Failed to parse form data:",
      err && (err.message || err)
    );
    return res.status(400).json({
      error: "Failed to parse form data",
      details: err && (err.message || String(err)),
    });
  }

  // Basic rate limit: per-IP attempts window using Redis.
  // This helps prevent brute-force guessing of the ADMIN_TOKEN.
  try {
    const ipHeader = req.headers["x-forwarded-for"] || "";
    const ip =
      (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader).split(",")[0].trim() ||
      (req.socket && req.socket.remoteAddress) ||
      "unknown";

    if (redis && typeof redis.incr === "function") {
      const key = `upload:ip:${ip}`;
      const attempts = await redis.incr(key);
      // Expire the counter after 60 seconds on first hit
      if (attempts === 1 && typeof redis.expire === "function") {
        await redis.expire(key, 60);
      }
      // Max 10 attempts per minute
      if (attempts > 10) {
        console.warn(
          "[upload] rate limit exceeded for ip",
          ip,
          "attempts=",
          attempts
        );
        return res
          .status(429)
          .json({ error: "Too many requests, please wait a bit." });
      }
    }
  } catch (rateErr) {
    console.warn(
      "[upload] rate limit check failed (continuing anyway):",
      rateErr && (rateErr.message || rateErr)
    );
  }
  const adminToken =
    req.headers["x-admin-token"] ||
    fields.adminToken ||
    fields.token ||
    req.query.token;
  if (!process.env.ADMIN_TOKEN) {
    console.error("[upload] ADMIN_TOKEN missing in environment");
    return res.status(500).json({ error: "ADMIN_TOKEN not configured" });
  }
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    console.log("[upload] invalid admin token");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Extract fields
  let filenameField = (fields.filename || fields.slug || "").toString();
  let chapterNumber = fields.chapterNumber || fields.chapter || "";
  let title = fields.title || "";
  let textContentField = fields.content || "";
  let novelSlug = fields.novelSlug || 'atg'; // New: Default to ATG
  let fileText = "";

  // Handle uploaded file present in `files` (robust extraction for different formidable shapes)
  if (files && Object.keys(files).length > 0) {
    let candidate = files.file || files.upload || null;

    if (!candidate) {
      const firstKey = Object.keys(files)[0];
      candidate = files[firstKey];
    }

    let fileObj = null;
    if (Array.isArray(candidate)) {
      fileObj = candidate[0];
    } else if (candidate && typeof candidate === "object") {
      const nestedKeys = Object.keys(candidate);
      if (nestedKeys.length === 1 && /^[0-9]+$/.test(nestedKeys[0])) {
        fileObj = candidate[nestedKeys[0]];
      } else {
        fileObj = candidate;
      }
    }

    const possiblePaths = [
      fileObj && fileObj.filepath,
      fileObj && fileObj.path,
      fileObj && fileObj.tempFilePath,
      fileObj && fileObj.tempFilePathName,
    ].filter(Boolean);

    const filePath = possiblePaths.length > 0 ? possiblePaths[0] : undefined;

    console.log(
      "[upload] extracted fileObj keys:",
      fileObj ? Object.keys(fileObj) : "none",
      "resolved filePath:",
      !!filePath
    );

    if (!fileObj || !filePath) {
      console.error(
        "[upload] could not locate uploaded file path - fileObj shape:",
        fileObj
      );
      return res
        .status(500)
        .json({
          error: "Failed to read uploaded file",
          details:
            "Uploaded file object present but filepath could not be resolved on server",
        });
    }

    try {
      const buf = fs.readFileSync(filePath);
      fileText = buf.toString("utf8");
    } catch (err) {
      console.error("[upload] error reading uploaded file:", err);
      return res
        .status(500)
        .json({
          error: "Failed to read uploaded file",
          details: err && (err.message || String(err)),
        });
    }
  }

  // Prefer uploaded file text if present, otherwise fallback to pasted content
  const content = fileText || textContentField;

  if (!chapterNumber || !content) {
    console.log(
      "[upload] validation failed; chapterNumber present?",
      !!chapterNumber,
      "content present?",
      !!content
    );
    return res.status(400).json({
      error: "Missing chapterNumber or content",
      parsedFields: Object.keys(fields),
      parsedFiles: Object.keys(files),
    });
  }

  // filename: always chapter-{no} unless an explicit filename is passed
  let filename;
  if (filenameField) {
    filename = filenameField;
  } else {
    const numStr = String(chapterNumber).trim();
    filename = `chapter-${numStr}`;
  }
  filename = sanitizeFilename(filename);

  const md = `---\nchapterNumber: ${Number(chapterNumber)}\ntitle: "${(
    title || ""
  )
    .toString()
    .replace(/"/g, '\\"')}"\npublishedAt: "${
    new Date().toISOString().split("T")[0]
  }"\n---\n\n${content}\n`;

  // If GitHub env present, commit; else fallback to return markdown
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER;
  const REPO_NAME = process.env.REPO_NAME;
  const BRANCH = process.env.REPO_BRANCH || "main";

  if (GITHUB_TOKEN && REPO_OWNER && REPO_NAME) {
    try {
      const pathInRepo = `content/novels/${novelSlug}/chapters/${filename}.md`; // Updated: Nested path
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(
        pathInRepo
      )}`;

      const getRes = await fetch(url + `?ref=${BRANCH}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": "PersonalNovelReader",
        },
      });
      let sha = null;
      if (getRes.status === 200) {
        const getJson = await getRes.json();
        sha = getJson.sha;
      }

      const putBody = {
        message: `Add/Update chapter ${chapterNumber} - ${title || filename} (Novel: ${novelSlug})`, // Minor log tweak
        content: Buffer.from(md).toString("base64"),
        branch: BRANCH,
      };
      if (sha) putBody.sha = sha;

      const putRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": "PersonalNovelReader",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(putBody),
      });
      const putJson = await putRes.json();
      if (putRes.status >= 200 && putRes.status < 300) {
        console.log(
          "[upload] commit success to",
          pathInRepo,
          putJson.content && putJson.content.path
        );
        return res.status(200).json({ success: true, github: putJson });
      } else {
        console.error("[upload] GitHub API error", putJson);
        return res
          .status(500)
          .json({ error: "GitHub API error", details: putJson });
      }
    } catch (err) {
      console.error("[upload] GitHub commit error", err);
      return res
        .status(500)
        .json({
          error: "GitHub commit failed",
          details: err && (err.message || String(err)),
        });
    }
  }

  // Fallback: No GitHub, return md for download
  // Optional: Write locally for dev (uncomment if needed)
  // const chaptersDir = path.join(process.cwd(), 'content', 'novels', novelSlug, 'chapters');
  // if (!fs.existsSync(chaptersDir)) fs.mkdirSync(chaptersDir, { recursive: true });
  // await fs.promises.writeFile(path.join(chaptersDir, `${filename}.md`), md);

  res.setHeader("Content-Disposition", `attachment; filename=${filename}.md`);
  res.setHeader("Content-Type", "text/markdown");
  return res.status(200).send(md);
}