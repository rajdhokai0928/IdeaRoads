import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { auditLogs } from "@/db/schema";
import { db } from "@/lib/db";

export type AuditLogRow = typeof auditLogs.$inferSelect;

export async function listAuditLogs(
  workspaceId: string,
  opts: {
    page?: number;
    limit?: number;
    actorId?: string;
    actorEmail?: string;
    entityType?: string;
    action?: string;
  } = {}
): Promise<{ logs: AuditLogRow[]; total: number; hasMore: boolean }> {
  const {
    page = 1,
    limit = 50,
    actorId,
    actorEmail,
    entityType,
    action,
  } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(auditLogs.workspaceId, workspaceId)];
  if (actorId) {
    conditions.push(eq(auditLogs.actorId, actorId));
  }
  if (actorEmail) {
    // The UI's search box is a general filter, not strictly actor-email — match
    // it against actor, action, entity type/name, and description too, so
    // searching "post" returns the same rows as the entity-type dropdown does.
    const term = `%${actorEmail}%`;
    conditions.push(
      or(
        ilike(auditLogs.actorEmail, term),
        ilike(auditLogs.actorName, term),
        ilike(auditLogs.action, term),
        ilike(auditLogs.entityType, term),
        ilike(auditLogs.entityName, term),
        ilike(auditLogs.description, term)
      )!
    );
  }
  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType));
  }
  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }

  const where = and(...conditions);

  const [logs, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(auditLogs).where(where),
  ]);

  return {
    logs,
    total: Number(total),
    hasMore: offset + logs.length < Number(total),
  };
}
