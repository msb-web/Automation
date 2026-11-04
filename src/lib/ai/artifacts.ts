import { db } from "@/lib/db";

export type ArtifactRow = {
  id: number;
  projectId: number;
  kind: string;
  content: unknown;
  assetUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function saveArtifact(
  projectId: number,
  kind: string,
  content: unknown,
  assetUrl?: string | null
) {
  return db.generationArtifact.upsert({
    where: { projectId_kind: { projectId, kind } },
    create: {
      projectId,
      kind,
      content: JSON.stringify(content),
      assetUrl: assetUrl ?? null,
    },
    update: {
      content: JSON.stringify(content),
      assetUrl: assetUrl ?? null,
    },
  });
}

export async function getArtifacts(projectId: number): Promise<ArtifactRow[]> {
  const rows = await db.generationArtifact.findMany({
    where: { projectId },
    orderBy: { kind: "asc" },
  });
  return rows.map((r) => ({ ...r, content: JSON.parse(r.content) }));
}
