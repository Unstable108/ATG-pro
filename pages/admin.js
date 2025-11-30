import { useRef, useState, useEffect } from "react";

function slugify(name) {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, "-")
    .replace(/\-+/g, "-")
    .replace(/(^\-|\-$)/g, "");
}

export default function AdminPage() {
  const fileInputRef = useRef(null);
  const [filename, setFilename] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState(null);
  const [commitUrl, setCommitUrl] = useState(null);
  const novelSlug = 'atg'; // Hardcoded for ATG-only

  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined" &&
        window.localStorage.getItem("adminToken");
      if (saved) setToken(saved);
    } catch (e) {}
  }, []);

  // Clear just the form fields (not status / download / commit)
  function resetFormFields() {
    setFilename("");
    setChapterNumber("");
    setTitle("");
    setContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Reset everything (used by Reset button)
  function resetAll() {
    resetFormFields();
    setStatus(null);
    setDownloadUrl(null);
    setDownloadName(null);
    setCommitUrl(null);
  }

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    setDownloadUrl(null);
    setDownloadName(null);
    // don't clear commitUrl; a new success will overwrite it

    // basic validation
    if (!chapterNumber) {
      setStatus({ type: "error", msg: "Chapter number is required." });
      return;
    }
    if (!content && (!fileInputRef.current || !fileInputRef.current.files[0])) {
      setStatus({
        type: "error",
        msg: "Provide content (paste) or upload a .md/.txt file.",
      });
      return;
    }
    if (!token) {
      setStatus({
        type: "error",
        msg: "Admin token is required. Add it in the field or set in localStorage.",
      });
      return;
    }

    setStatus({ type: "info", msg: "Uploading..." });

    try {
      const fd = new FormData();

      // If filename field is blank, we DO NOT send filename.
      // Backend will then name it chapter-{chapterNumber}.md.
      const derived = slugify(filename || "");
      if (derived) {
        fd.append("filename", derived);
      }

      fd.append("chapterNumber", chapterNumber);
      fd.append("title", title);
      fd.append("content", content);
      fd.append("novelSlug", novelSlug); // New: Pass ATG slug

      const file =
        fileInputRef.current &&
        fileInputRef.current.files &&
        fileInputRef.current.files[0];
      if (file) fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-admin-token": token,
        },
        body: fd,
      });

      const contentType = res.headers.get("content-type") || "";

      // JSON: likely a GitHub commit
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (res.ok) {
          // default message
          let msg = "Uploaded.";

          if (
            json.github &&
            json.github.commit &&
            json.github.commit.html_url
          ) {
            msg = "Uploaded and committed to GitHub.";
            setCommitUrl(json.github.commit.html_url);
          } else if (
            json.github &&
            json.github.content &&
            json.github.content.path
          ) {
            // If we want to construct a file URL, we could use NEXT_PUBLIC_* env,
            // but for now just keep generic success text.
            msg = "Uploaded and committed to GitHub.";
          }

          setStatus({ type: "success", msg });
          try {
            localStorage.setItem("adminToken", token);
          } catch (e) {}

          // clear form fields after success
          resetFormFields();
        } else {
          setStatus({
            type: "error",
            msg: json.error || JSON.stringify(json),
          });
        }
        return;
      }

      // Fallback: server returned raw markdown (no GitHub env configured)
      const blob = await res.blob();
      const text = await blob.text();
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/markdown" })
      );

      // suggested filename: chapter-<no>.md or derived (if user set one)
      const safeDerived =
        derived || `chapter-${String(chapterNumber).trim()}`;
      const suggestedName = `${safeDerived}.md`;

      setDownloadUrl(url);
      setDownloadName(suggestedName);
      setStatus({
        type: "info",
        msg: `No GitHub configured — markdown prepared for download (save into content/novels/${novelSlug}/chapters/ and push).`,
      });

      // Save token
      try {
        localStorage.setItem("adminToken", token);
      } catch (e) {}

      // Optional: also clear form fields here if you want, even for fallback:
      resetFormFields();
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg: err && err.message ? err.message : String(err),
      });
    }
  }

  async function copyToClipboard() {
    if (!downloadUrl) return;
    try {
      const r = await fetch(downloadUrl);
      const text = await r.text();
      await navigator.clipboard.writeText(text);
      setStatus({ type: "success", msg: "Markdown copied to clipboard." });
    } catch (e) {
      setStatus({
        type: "error",
        msg: "Copy failed: " + (e && e.message ? e.message : String(e)),
      });
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Admin — Upload Chapter</h1>
        <p className="text-sm text-gray-600 mt-2">
          Upload a chapter as a .md/.txt file or paste markdown in the textarea.
          Provide ADMIN_TOKEN in the field (saved locally).
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Admin Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="Set ADMIN_TOKEN (stored in localStorage)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Filename (slug) — optional
            </label>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              placeholder="leave empty for chapter-{no}.md"
            />
            <p className="text-xs text-gray-500 mt-1">
              If empty, backend will name it <code>chapter-{"{number}"}.md</code>.
              If you fill this, it will be used as the filename (slugified).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Chapter Number
              </label>
              <input
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                type="number"
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Title (optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Upload file (.md or .txt)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="mt-1 block w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              File content will be used if provided. Otherwise the pasted
              content below will be used.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Or paste markdown content (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="mt-1 block w-full rounded border p-3 monospace"
              placeholder="Paste your chapter markdown here..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded bg-blue-600 text-white px-4 py-2"
              type="submit"
            >
              Upload
            </button>
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={resetAll}
            >
              Reset
            </button>
            <div className="ml-auto text-sm">
              {status ? (
                <span
                  className={
                    status.type === "error"
                      ? "text-red-600"
                      : status.type === "success"
                      ? "text-green-600"
                      : "text-gray-700"
                  }
                >
                  {status.msg}
                </span>
              ) : null}
            </div>
          </div>
        </form>

        {downloadUrl && (
          <div className="mt-6 p-4 border rounded bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700">Markdown ready</div>
              <div className="flex gap-2">
                <a
                  download={downloadName}
                  href={downloadUrl}
                  className="text-sm text-blue-600 underline"
                >
                  Download .md
                </a>
                <button
                  onClick={copyToClipboard}
                  className="text-sm rounded border px-2 py-1"
                >
                  Copy
                </button>
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-600 cursor-pointer">
                Preview markdown
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs p-2 bg-white border rounded max-h-64 overflow-auto">
                Click "Download" or "Copy" to get the markdown text.
              </pre>
            </details>
          </div>
        )}

        {commitUrl && (
          <div className="mt-3 text-sm">
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600"
            >
              View commit on GitHub
            </a>
          </div>
        )}

        <section className="mt-8 text-sm text-gray-600">
          <h2 className="font-semibold">Notes</h2>
          <ul className="list-disc ml-5 mt-2">
            <li>
              Uploads to <code>content/novels/atg/chapters/{filename}.md</code>.
            </li>
            <li>
              If your deployment has <code>GITHUB_TOKEN</code>,{" "}
              <code>REPO_OWNER</code>, and <code>REPO_NAME</code> env vars set,
              this endpoint will commit the markdown into the ATG chapters folder on the configured
              branch.
            </li>
            <li>
              Otherwise the API returns a generated markdown file — download it
              and add it into <code>content/novels/atg/chapters/</code>, then push to your
              repo.
            </li>
            <li>
              Keep your <code>ADMIN_TOKEN</code> secret. It is stored in your
              browser when you set it for convenience.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}