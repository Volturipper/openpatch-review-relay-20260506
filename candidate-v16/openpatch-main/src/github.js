export function encodeGitHubPath(path) {
  return String(path)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

export function buildContentsApiUrl({ owner, repo, path }) {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeGitHubPath(path)}`;
}

export async function getGitHubErrorMessage(response) {
  let detail = "";
  try {
    const json = await response.json();
    detail = json.message || JSON.stringify(json);
  } catch {
    detail = await response.text();
  }

  if (response.status === 401) {
    return "GitHub Token 无效或已过期。";
  }
  if (response.status === 403) {
    return "GitHub Token 权限不足，请确认目标仓库有 Contents: Read and write 权限。";
  }
  if (response.status === 404) {
    return "无法访问目标仓库或目标分支，请检查仓库地址、分支名和 Token 权限。";
  }
  if (response.status === 422) {
    return `GitHub 拒绝了这次上传：${detail}`;
  }

  return `GitHub API 失败：${response.status} ${detail}`;
}

export async function createRepositoryFile({ token, owner, repo, path, branch, message, content, sha }) {
  const response = await fetch(buildContentsApiUrl({ owner, repo, path }), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    throw new Error(await getGitHubErrorMessage(response));
  }

  return response.json();
}

export async function getAuthenticatedUser(token) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(await getGitHubErrorMessage(response));
  }

  const user = await response.json();
  if (!user.login) {
    throw new Error("无法从 GitHub Token 读取当前用户。");
  }

  return user;
}


export async function getRepositoryFile({ token, owner, repo, path, branch }) {
  const url = new URL(buildContentsApiUrl({ owner, repo, path }));
  if (branch) {
    url.searchParams.set("ref", branch);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await getGitHubErrorMessage(response));
  }
  return response.json();
}

export async function upsertRepositoryFile({ token, owner, repo, path, branch, message, content }) {
  const existing = await getRepositoryFile({ token, owner, repo, path, branch });
  return createRepositoryFile({
    token,
    owner,
    repo,
    path,
    branch,
    message,
    content,
    sha: existing?.sha || undefined
  });
}
