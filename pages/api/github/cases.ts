import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Octokit } from "@octokit/rest";
import { authOptions } from "../auth/[...nextauth]";
import { RELATIONS } from "@/lib/relations";
import type { CaseData } from "@/lib/cases";

const REPO_OWNER = "RelationshipLogic";
const REPO_NAME = "RelationshipLogic";
const CASES_DIR = "experiments/psych-engine/cases";

interface SessionWithToken {
  accessToken?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const session = (await getServerSession(req, res, authOptions)) as SessionWithToken | null;
  if (!session?.accessToken) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  const relation = req.query.relation as string;
  if (!RELATIONS.some((r) => r.id === relation)) {
    return res.status(400).json({ error: "지원하지 않는 관계 유형입니다." });
  }

  try {
    const octokit = new Octokit({ auth: session.accessToken });
    const { data: dirListing } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: CASES_DIR });
    if (!Array.isArray(dirListing)) {
      return res.status(500).json({ error: "케이스 디렉터리를 읽을 수 없습니다." });
    }

    const matched = dirListing.filter(
      (f) => f.type === "file" && f.name.startsWith(`${relation}_`) && f.name.endsWith(".json")
    );

    const cases = await Promise.all(
      matched.map(async (f): Promise<CaseData | null> => {
        const { data: fileData } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: f.path });
        if (!("content" in fileData)) return null;
        return JSON.parse(Buffer.from(fileData.content, "base64").toString("utf-8"));
      })
    );

    const validCases = cases.filter((c): c is CaseData => c !== null).sort((a, b) => a.id.localeCompare(b.id));
    return res.status(200).json({ cases: validCases });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(500).json({ error: message });
  }
}
