import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { authOptions } from "../auth/[...nextauth]";
import { RELATIONS } from "@/lib/relations";

const REPO_OWNER = "RelationshipLogic";
const REPO_NAME = "RelationshipLogic";
const CORE_PATH = "experiments/psych-engine/prompts/core.md";
const RELATIONS_DIR = "experiments/psych-engine/prompts/relations";

interface SessionWithToken {
  accessToken?: string;
}

async function fetchFileContent(octokit: Octokit, path: string): Promise<string> {
  const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path });
  if (!("content" in data)) throw new Error(`파일을 찾을 수 없습니다: ${path}`);
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const session = (await getServerSession(req, res, authOptions)) as SessionWithToken | null;
  if (!session?.accessToken) {
    return res.status(401).json({
      error: "로그인이 필요합니다.",
      debug: { sessionExists: !!session, hasAccessToken: !!session?.accessToken },
    });
  }

  const relation = (req.query.relation as string) || RELATIONS[0].id;
  if (!RELATIONS.some((r) => r.id === relation)) {
    return res.status(400).json({ error: "지원하지 않는 관계 유형입니다." });
  }

  try {
    const octokit = new Octokit({ auth: session.accessToken });
    const [core, relationModule] = await Promise.all([
      fetchFileContent(octokit, CORE_PATH),
      fetchFileContent(octokit, `${RELATIONS_DIR}/${relation}.md`),
    ]);

    return res.status(200).json({ core, relationModule });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(500).json({ error: message });
  }
}
