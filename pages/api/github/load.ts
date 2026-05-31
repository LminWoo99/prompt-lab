import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import authOptions from "../auth/[...nextauth]";

const REPO_OWNER = "RelationshipLogic";
const REPO_NAME = "RelationshipLogic";
const FILE_PATH = "experiments/psych-engine/prompts/system_v2.md";

interface SessionWithToken {
  accessToken?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const session = (await getServerSession(req, res, authOptions)) as SessionWithToken | null;
  if (!session?.accessToken) return res.status(401).json({ error: "로그인이 필요합니다." });

  try {
    const octokit = new Octokit({ auth: session.accessToken });
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
    });

    if (!("content" in data)) {
      return res.status(400).json({ error: "파일을 찾을 수 없습니다." });
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return res.status(200).json({ content, sha: data.sha });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(500).json({ error: message });
  }
}
