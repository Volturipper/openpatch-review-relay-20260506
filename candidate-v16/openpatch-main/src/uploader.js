import { createRepositoryFile, getAuthenticatedUser, getRepositoryFile, upsertRepositoryFile } from "./github.js";
import {
  buildBranchUrl,
  buildLatestIndex,
  buildLatestIndexPath,
  buildPatchMetadata,
  buildPatchMetadataPath,
  buildPatchUploadPath,
  buildRepositoryUrl,
  buildRoundArchivePath,
  buildRoundId,
  buildRoundManifestPath,
  buildRoundReceiptPath,
  buildRoundUploadReceipt,
  decodeBase64Json,
  encodeBase64Bytes,
  encodeBase64Utf8,
  getUploadFileExtension,
  isArchiveFileName,
  isPatchFileName,
  normalizeAgentAlias,
  sanitizeArchiveFileName,
  sha256Base64Content,
  validateConfig
} from "./utils.js";

export async function uploadOpenPatchFile({
  config,
  fileName,
  content,
  title = "",
  githubClient = createRepositoryFile,
  githubUserClient = getAuthenticatedUser,
  now = new Date()
}) {
  const validation = validateConfig(config);
  if (!validation.ok) {
    throw new Error(`请先配置：${validation.missing.join("、")}`);
  }

  const uploadConfig = { ...config };
  if (!uploadConfig.owner) {
    const user = await githubUserClient(uploadConfig.githubToken);
    uploadConfig.owner = user.login;
  }

  if (!isPatchFileName(fileName)) {
    throw new Error("请选择 .zip、.diff 或 .patch 文件。");
  }

  const extension = getUploadFileExtension(fileName);
  const patchPath = buildPatchUploadPath({
    patchDir: uploadConfig.patchDir,
    originalName: fileName,
    extension,
    now
  });
  const metaPath = buildPatchMetadataPath(patchPath);
  const commitTitle = title?.trim() || `ai: apply ${fileName}`;

  const shared = {
    token: uploadConfig.githubToken,
    owner: uploadConfig.owner,
    repo: uploadConfig.repo,
    branch: uploadConfig.baseBranch
  };

  await githubClient({
    ...shared,
    path: metaPath,
    message: `chore(openpatch): upload metadata for ${fileName}`,
    content: encodeBase64Utf8(JSON.stringify(buildPatchMetadata({
      title: commitTitle,
      originalName: fileName,
      patchPath,
      createdAt: now
    }), null, 2))
  });

  const result = await githubClient({
    ...shared,
    path: patchPath,
    message: `chore(openpatch): upload ${fileName}`,
    content
  });

  return {
    owner: uploadConfig.owner,
    repo: uploadConfig.repo,
    branch: uploadConfig.baseBranch,
    path: patchPath,
    commitSha: result?.commit?.sha || "",
    repositoryUrl: buildRepositoryUrl(uploadConfig),
    branchUrl: buildBranchUrl({
      owner: uploadConfig.owner,
      repo: uploadConfig.repo,
      branch: uploadConfig.baseBranch
    })
  };
}

export async function uploadPatchText(options) {
  return uploadOpenPatchFile({
    ...options,
    content: encodeBase64Utf8(options.text)
  });
}

export async function uploadPatchFile({ file, ...options }) {
  const isZip = file.name.toLowerCase().endsWith(".zip");
  const content = isZip
    ? encodeBase64Bytes(await file.arrayBuffer())
    : encodeBase64Utf8(await file.text());

  return uploadOpenPatchFile({
    ...options,
    fileName: file.name,
    content
  });
}


export async function uploadRoundArchiveContent({
  config,
  fileName,
  content,
  routeContext = {},
  title = "",
  githubClient = createRepositoryFile,
  githubUserClient = getAuthenticatedUser,
  githubUpsertClient = upsertRepositoryFile,
  githubGetClient = getRepositoryFile,
  now = new Date()
}) {
  const validation = validateConfig({
    ...config,
    patchDir: config?.archiveRoot || config?.patchDir || "rounds"
  });
  if (!validation.ok) {
    throw new Error(`请先配置：${validation.missing.join("、")}`);
  }

  if (!isArchiveFileName(fileName)) {
    throw new Error("请选择 .zip、.json、.md 或 .txt 归档文件。");
  }

  const uploadConfig = { ...config };
  if (!uploadConfig.owner) {
    const user = await githubUserClient(uploadConfig.githubToken);
    uploadConfig.owner = user.login;
  }

  const project = normalizeAgentAlias(
    routeContext.project || uploadConfig.projectId || uploadConfig.routeProfileId || "default",
    "default"
  );
  const roundId = normalizeAgentAlias(
    routeContext.roundId || routeContext.round_id || buildRoundId({ project, now }),
    "round"
  );
  const safeFileName = sanitizeArchiveFileName(fileName);
  const archivePath = buildRoundArchivePath({
    root: uploadConfig.archiveRoot || "rounds",
    project,
    roundId,
    fileName: safeFileName,
    now
  });
  const receiptPath = buildRoundReceiptPath(archivePath);
  const manifestPath = buildRoundManifestPath(archivePath);
  const latestPath = buildLatestIndexPath({
    indexRoot: uploadConfig.indexRoot || "index",
    project
  });
  const fileSha256 = await sha256Base64Content(content);

  const shared = {
    token: uploadConfig.githubToken,
    owner: uploadConfig.owner,
    repo: uploadConfig.repo,
    branch: uploadConfig.baseBranch
  };

  const artifactResult = await githubClient({
    ...shared,
    path: archivePath,
    message: `chore(openpatch): archive ${safeFileName}`,
    content
  });

  const receipt = buildRoundUploadReceipt({
    project,
    roundId,
    fileName: safeFileName,
    fileSha256,
    archivePath,
    receiptPath,
    latestPath,
    owner: uploadConfig.owner,
    repo: uploadConfig.repo,
    branch: uploadConfig.baseBranch,
    routeContext,
    createdAt: now
  });

  const manifest = {
    schema_version: "openpatch.archive_manifest.v1",
    archive_only: true,
    allow_execution: false,
    project,
    round_id: roundId,
    title: String(title || "").slice(0, 300),
    files: [
      {
        name: safeFileName,
        sha256: fileSha256,
        role: "roundpack_or_artifact",
        path: archivePath
      }
    ],
    receipt_path: receiptPath,
    latest_path: latestPath,
    route_context: receipt.route_context,
    created_at: now.toISOString()
  };

  await githubClient({
    ...shared,
    path: manifestPath,
    message: `chore(openpatch): write archive manifest for ${roundId}`,
    content: encodeBase64Utf8(JSON.stringify(manifest, null, 2))
  });

  await githubClient({
    ...shared,
    path: receiptPath,
    message: `chore(openpatch): write upload receipt for ${roundId}`,
    content: encodeBase64Utf8(JSON.stringify(receipt, null, 2))
  });

  let previousLatest = null;
  try {
    const latestFile = await githubGetClient({ ...shared, path: latestPath });
    previousLatest = decodeBase64Json(latestFile?.content || "");
  } catch {
    previousLatest = null;
  }

  const latest = buildLatestIndex({ receipt, previous: previousLatest, createdAt: now });
  const latestResult = await githubUpsertClient({
    ...shared,
    path: latestPath,
    message: `chore(openpatch): update latest index for ${project}`,
    content: encodeBase64Utf8(JSON.stringify(latest, null, 2))
  });

  return {
    mode: "roundpack_archive",
    owner: uploadConfig.owner,
    repo: uploadConfig.repo,
    branch: uploadConfig.baseBranch,
    project,
    roundId,
    fileName: safeFileName,
    fileSha256,
    path: archivePath,
    manifestPath,
    receiptPath,
    latestPath,
    commitSha: latestResult?.commit?.sha || artifactResult?.commit?.sha || "",
    repositoryUrl: buildRepositoryUrl(uploadConfig),
    branchUrl: buildBranchUrl({
      owner: uploadConfig.owner,
      repo: uploadConfig.repo,
      branch: uploadConfig.baseBranch
    }),
    receipt
  };
}

export async function uploadRoundArchiveFile({ file, ...options }) {
  const content = encodeBase64Bytes(await file.arrayBuffer());
  return uploadRoundArchiveContent({
    ...options,
    fileName: file.name,
    content
  });
}
