import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { authOptions } from "../auth/[...nextauth]";

const REPO_OWNER = "RelationshipLogic";
const REPO_NAME = "RelationshipLogic";
const FILE_PATH = "experiments/psych-engine/prompts/system_v2.md";
const BASE_BRANCH = "main";

interface SessionWithToken {
  accessToken?: string;
}

function generateBranchName(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `feature/prompt/${date}/${rand}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = (await getServerSession(req, res, authOptions)) as SessionWithToken | null;
  if (!session?.accessToken) return res.status(401).json({ error: "로그인이 필요합니다." });

  const { content, commitMessage, prTitle, prBody } = req.body as {
    content: string;
    commitMessage: string;
    prTitle: string;
    prBody: string;
  };

  if (!content || !commitMessage || !prTitle) {
    return res.status(400).json({ error: "필수 항목이 누락되었습니다." });
  }

  try {
    const octokit = new Octokit({ auth: session.accessToken });
    const branchName = generateBranchName();

    const { data: mainRef } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `heads/${BASE_BRANCH}`,
    });
    const baseSha = mainRef.object.sha;

    await octokit.git.createRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    const { data: fileData } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      ref: branchName,
    });
    const fileSha = "sha" in fileData ? fileData.sha : undefined;

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: commitMessage,
      content: Buffer.from(content).toString("base64"),
      branch: branchName,
      sha: fileSha,
    });

    const { data: pr } = await octokit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: prTitle,
      body: prBody || "",
      head: branchName,
      base: BASE_BRANCH,
    });

    return res.status(200).json({ branchName, prUrl: pr.html_url, prNumber: pr.number });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(500).json({ error: message });
  }
}
