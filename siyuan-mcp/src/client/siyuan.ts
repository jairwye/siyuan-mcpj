/**
 * SiYuan kernel API HTTP client.
 * Reads SIYUAN_HOST, SIYUAN_PORT, SIYUAN_TOKEN from env.
 */
import type { SiYuanResponse } from "../types.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = "6806";

function getBaseUrl(): string {
  const host = process.env.SIYUAN_HOST ?? DEFAULT_HOST;
  const port = process.env.SIYUAN_PORT ?? DEFAULT_PORT;
  return `http://${host}:${port}`;
}

function getToken(): string {
  const token = process.env.SIYUAN_TOKEN;
  if (!token) {
    throw new Error("SIYUAN_TOKEN is required. Get it from SiYuan: Settings → About → API Token.");
  }
  return token;
}

async function request<T>(path: string, body?: object): Promise<T> {
  const base = getBaseUrl();
  const token = getToken();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Token ${token}`,
  };
  let res: Response;
  try {
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(url, { method: "POST", headers });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`思源连接失败（请确认思源已启动且地址可达）: ${msg}`);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`思源 API 请求失败: ${res.status} ${res.statusText}. ${text || ""}`);
  }
  let data: SiYuanResponse<T>;
  try {
    data = JSON.parse(text) as SiYuanResponse<T>;
  } catch {
    throw new Error(`思源返回非 JSON: ${text.slice(0, 200)}`);
  }
  if (data.code !== 0) {
    throw new Error(data.msg || `思源返回错误 code: ${data.code}`);
  }
  return data.data as T;
}

async function requestMultipart<T>(path: string, form: FormData): Promise<T> {
  const base = getBaseUrl();
  const token = getToken();
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Token ${token}`,
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: form,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`思源连接失败: ${msg}`);
  }
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`思源 API 请求失败: ${res.status}. ${text || ""}`);
  }
  let data: SiYuanResponse<T>;
  try {
    data = JSON.parse(text) as SiYuanResponse<T>;
  } catch {
    throw new Error(`思源返回非 JSON: ${text.slice(0, 200)}`);
  }
  if (data.code !== 0) {
    throw new Error(data.msg || `思源返回错误 code: ${data.code}`);
  }
  return data.data as T;
}

// ——— Notebook ———
export async function lsNotebooks() {
  return request<{ notebooks: Array<{ id: string; name: string; icon: string; sort: number; closed: boolean }> }>(
    "/api/notebook/lsNotebooks"
  );
}
export async function openNotebook(notebook: string) {
  return request<null>("/api/notebook/openNotebook", { notebook });
}
export async function closeNotebook(notebook: string) {
  return request<null>("/api/notebook/closeNotebook", { notebook });
}
export async function renameNotebook(notebook: string, name: string) {
  return request<null>("/api/notebook/renameNotebook", { notebook, name });
}
export async function createNotebook(name: string) {
  return request<{ notebook: { id: string; name: string; icon: string; sort: number; closed: boolean } }>(
    "/api/notebook/createNotebook",
    { name }
  );
}
export async function removeNotebook(notebook: string) {
  return request<null>("/api/notebook/removeNotebook", { notebook });
}
export async function getNotebookConf(notebook: string) {
  return request<{ box: string; conf: Record<string, unknown>; name: string }>(
    "/api/notebook/getNotebookConf",
    { notebook }
  );
}
export async function setNotebookConf(notebook: string, conf: Record<string, unknown>) {
  return request<Record<string, unknown>>("/api/notebook/setNotebookConf", { notebook, conf });
}

// ——— Document ———
export async function createDocWithMd(notebook: string, path: string, markdown: string) {
  return request<string>("/api/filetree/createDocWithMd", { notebook, path, markdown });
}
export async function renameDoc(notebook: string, path: string, title: string) {
  return request<null>("/api/filetree/renameDoc", { notebook, path, title });
}
export async function renameDocByID(id: string, title: string) {
  return request<null>("/api/filetree/renameDocByID", { id, title });
}
export async function removeDoc(notebook: string, path: string) {
  return request<null>("/api/filetree/removeDoc", { notebook, path });
}
export async function removeDocByID(id: string) {
  return request<null>("/api/filetree/removeDocByID", { id });
}
export async function moveDocs(fromPaths: string[], toNotebook: string, toPath: string) {
  return request<null>("/api/filetree/moveDocs", { fromPaths, toNotebook, toPath });
}
export async function moveDocsByID(fromIDs: string[], toID: string) {
  return request<null>("/api/filetree/moveDocsByID", { fromIDs, toID });
}
export async function getHPathByPath(notebook: string, path: string) {
  return request<string>("/api/filetree/getHPathByPath", { notebook, path });
}
export async function getHPathByID(id: string) {
  return request<string>("/api/filetree/getHPathByID", { id });
}
export async function getPathByID(id: string) {
  return request<{ notebook: string; path: string }>("/api/filetree/getPathByID", { id });
}
export async function getIDsByHPath(path: string, notebook: string) {
  return request<string[]>("/api/filetree/getIDsByHPath", { path, notebook });
}

// ——— Block ———
export async function insertBlock(args: {
  dataType: "markdown" | "dom";
  data: string;
  nextID?: string;
  previousID?: string;
  parentID?: string;
}) {
  return request<unknown>("/api/block/insertBlock", args);
}
export async function prependBlock(data: string, dataType: "markdown" | "dom", parentID: string) {
  return request<unknown>("/api/block/prependBlock", { data, dataType, parentID });
}
export async function appendBlock(data: string, dataType: "markdown" | "dom", parentID: string) {
  return request<unknown>("/api/block/appendBlock", { data, dataType, parentID });
}
export async function updateBlock(id: string, data: string, dataType: "markdown" | "dom") {
  return request<unknown>("/api/block/updateBlock", { id, data, dataType });
}
export async function deleteBlock(id: string) {
  return request<unknown>("/api/block/deleteBlock", { id });
}
export async function moveBlock(id: string, previousID?: string, parentID?: string) {
  return request<unknown>("/api/block/moveBlock", { id, previousID, parentID });
}
export async function getBlockKramdown(id: string) {
  return request<{ id: string; kramdown: string }>("/api/block/getBlockKramdown", { id });
}
export async function getChildBlocks(id: string) {
  return request<Array<{ id: string; type: string; subType?: string }>>("/api/block/getChildBlocks", { id });
}
export async function foldBlock(id: string) {
  return request<null>("/api/block/foldBlock", { id });
}
export async function unfoldBlock(id: string) {
  return request<null>("/api/block/unfoldBlock", { id });
}
export async function transferBlockRef(fromID: string, toID: string, refIDs?: string[]) {
  return request<null>("/api/block/transferBlockRef", { fromID, toID, refIDs });
}

// ——— Attr ———
export async function setBlockAttrs(id: string, attrs: Record<string, string>) {
  return request<null>("/api/attr/setBlockAttrs", { id, attrs });
}
export async function getBlockAttrs(id: string) {
  return request<Record<string, string>>("/api/attr/getBlockAttrs", { id });
}

// ——— SQL ———
export async function querySql(stmt: string) {
  return request<unknown[]>("/api/query/sql", { stmt });
}
export async function flushTransaction() {
  return request<null>("/api/sqlite/flushTransaction");
}

// ——— File ———
export async function getFile(path: string): Promise<ArrayBuffer> {
  const base = getBaseUrl();
  const token = getToken();
  const res = await fetch(`${base}/api/file/getFile`, {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = t;
    try {
      const j = JSON.parse(t) as { msg?: string };
      if (j.msg) msg = j.msg;
    } catch {}
    throw new Error(`getFile 失败: ${res.status} ${msg}`);
  }
  return res.arrayBuffer();
}
export async function putFile(path: string, file: Blob | ArrayBuffer, isDir?: boolean, modTime?: number) {
  const form = new FormData();
  form.set("path", path);
  if (isDir !== undefined) form.set("isDir", String(isDir));
  if (modTime !== undefined) form.set("modTime", String(modTime));
  if (!isDir && file) form.set("file", file instanceof Blob ? file : new Blob([file]));
  return requestMultipart<null>("/api/file/putFile", form);
}
export async function removeFile(path: string) {
  return request<null>("/api/file/removeFile", { path });
}
export async function renameFile(path: string, newPath: string) {
  return request<null>("/api/file/renameFile", { path, newPath });
}
export async function readDir(path: string) {
  return request<Array<{ isDir: boolean; isSymlink?: boolean; name: string; updated?: number }>>(
    "/api/file/readDir",
    { path }
  );
}

// ——— Export ———
export async function exportMdContent(id: string) {
  return request<{ hPath: string; content: string }>("/api/export/exportMdContent", { id });
}
export async function exportResources(paths: string[], name?: string) {
  return request<{ path: string }>("/api/export/exportResources", { paths, name });
}

// ——— Notification ———
export async function pushMsg(msg: string, timeout?: number) {
  return request<{ id: string }>("/api/notification/pushMsg", { msg, timeout });
}
export async function pushErrMsg(msg: string, timeout?: number) {
  return request<{ id: string }>("/api/notification/pushErrMsg", { msg, timeout });
}

// ——— System ———
export async function bootProgress() {
  return request<{ details: string; progress: number }>("/api/system/bootProgress");
}
export async function getVersion() {
  return request<string>("/api/system/version");
}
export async function currentTime() {
  return request<number>("/api/system/currentTime");
}

// ——— Template ———
export async function renderTemplate(id: string, path: string) {
  return request<{ content: string; path: string }>("/api/template/render", { id, path });
}
export async function renderSprig(template: string) {
  return request<string>("/api/template/renderSprig", { template });
}

// ——— Convert ———
export async function pandocConvert(dir: string, args: string[]) {
  return request<{ path: string }>("/api/convert/pandoc", { dir, args });
}

// ——— Asset ———
export async function uploadAsset(assetsDirPath: string, files: Array<{ name: string; data: Blob }>) {
  const form = new FormData();
  form.set("assetsDirPath", assetsDirPath);
  for (const f of files) {
    form.append("file[]", f.data, f.name);
  }
  return requestMultipart<{ errFiles: string[]; succMap: Record<string, string> }>("/api/asset/upload", form);
}
