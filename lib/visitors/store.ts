import { MongoClient, type Collection } from "mongodb";
import type { VisitorStorageConfig } from "./config";
import { VISITOR_ROUTES, type VisitorRoute, type VisitorSite } from "./routes";
import { randomBytes } from "node:crypto";
import { dailyPseudonym, networkPrefix, nextUtcDay, utcDay } from "./estimator";

export type DailyCount = {
  _id: string;
  day: string;
  route: VisitorRoute;
  pageviews: number;
  expiresAt: Date;
};
type Budget = { _id: string; count: number; expiresAt: Date };

export interface VisitorStore {
  takeBudget(now: Date, limit: number): Promise<boolean>;
  increment(route: VisitorRoute, now: Date, retentionDays: number): Promise<void>;
  estimate?(clientIp: string | null, now: Date, origin: string): Promise<void>;
}

type VisitorKey = { _id: string; day: string; expiresAt: Date };
type DaySecret = { _id: string; secret: string; expiresAt: Date };
type EstimationHealth = { _id: string; unestimated: number; missingNetwork: number; storageErrors: number; expiresAt: Date };
export interface VisitorRepository extends VisitorStore {
  readDaily(start: string, now: Date): Promise<DailyCount[]>;
  readEstimate(now: Date): Promise<{ count: number; unestimated: number; missingNetwork: number; storageErrors: number }>;
}

export function dailyBucket(route: VisitorRoute, now: Date, retentionDays: number) {
  const day = now.toISOString().slice(0, 10);
  return {
    _id: `${day}:${route}`, day, route,
    expiresAt: new Date(Date.parse(`${day}T00:00:00.000Z`) + retentionDays * 86_400_000),
  };
}

// Exported to verify the actual database operations without storing raw events.
export async function initializeVisitorCollections(
  daily: Collection<DailyCount>, budgets: Collection<Budget>, retentionDays: number, now = new Date(),
) {
  await daily.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "visitor_retention" });
  await budgets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "visitor_budget_retention" });
  // Apply a changed retention policy to existing rows on process initialization.
  await daily.updateMany({}, [{ $set: { expiresAt: { $dateAdd: {
    startDate: { $dateFromString: { dateString: "$day" } }, unit: "day", amount: retentionDays,
  } } } }]);
  await daily.deleteMany({ expiresAt: { $lte: now } });
}

export function collectionStore(daily: Collection<DailyCount>, budgets: Collection<Budget>): VisitorStore {
  return {
    async takeBudget(now, limit) {
      const _id = String(Math.floor(now.getTime() / 60_000));
      const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(now.getTime() + 120_000) } };
      let bucket: Budget | null;
      try {
        bucket = await budgets.findOneAndUpdate({ _id }, update, { upsert: true, returnDocument: "after" });
      } catch (error) {
        // Concurrent first requests can race an upsert on the unique primary key.
        if ((error as { code?: number }).code !== 11000) throw error;
        bucket = await budgets.findOneAndUpdate({ _id }, update, { returnDocument: "after" });
      }
      return bucket !== null && bucket.count <= limit;
    },
    async increment(route, now, retentionDays) {
      const bucket = dailyBucket(route, now, retentionDays);
      const update = { $inc: { pageviews: 1 }, $setOnInsert: bucket };
      try {
        await daily.updateOne({ _id: bucket._id }, update, { upsert: true });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        await daily.updateOne({ _id: bucket._id }, { $inc: { pageviews: 1 } });
      }
    },
  };
}

export async function initializeEstimatorCollections(
  keys: Collection<VisitorKey>, secrets: Collection<DaySecret>, health: Collection<EstimationHealth>,
) {
  await Promise.all([
    keys.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "daily_key_retention" }),
    keys.createIndex({ day: 1, expiresAt: 1 }, { name: "daily_key_count" }),
    secrets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "daily_secret_retention" }),
    health.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "daily_health_retention" }),
  ]);
}

export function estimationStore(keys: Collection<VisitorKey>, secrets: Collection<DaySecret>, health: Collection<EstimationHealth>) {
  return {
    async estimate(clientIp: string | null, now: Date, origin: string) {
      const day = utcDay(now), expiresAt = nextUtcDay(now);
      const skipped = async (reason: "missingNetwork" | "storageErrors") => {
        try { await health.updateOne({ _id: day }, {
          $inc: { unestimated: 1, [reason]: 1 }, $setOnInsert: { expiresAt },
        }, { upsert: true }); }
        catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
          await health.updateOne({ _id: day }, { $inc: { unestimated: 1, [reason]: 1 } });
        }
      };
      const prefix = networkPrefix(clientIp);
      if (!prefix) { await skipped("missingNetwork"); return; }
      try {
        let key: DaySecret | null;
        try {
          key = await secrets.findOneAndUpdate({ _id: day }, {
            $setOnInsert: { secret: randomBytes(32).toString("hex"), expiresAt },
          }, { upsert: true, returnDocument: "after" });
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
          key = await secrets.findOne({ _id: day });
        }
        if (!key) throw new Error("Daily estimation unavailable");
        const _id = `${day}:${dailyPseudonym(prefix, key.secret, origin)}`;
        try { await keys.updateOne({ _id }, { $setOnInsert: { day, expiresAt } }, { upsert: true }); }
        catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
      } catch {
        // Pageviews were already counted; a failed estimate must not undo them.
        await skipped("storageErrors");
      }
    },
    async readEstimate(now: Date) {
      const day = utcDay(now);
      const [count, state] = await Promise.all([
        keys.countDocuments({ day, expiresAt: { $gt: now } }),
        health.findOne({ _id: day, expiresAt: { $gt: now } }),
      ]);
      return { count, unestimated: state?.unestimated ?? 0, missingNetwork: state?.missingNetwork ?? 0, storageErrors: state?.storageErrors ?? 0 };
    },
  };
}

const connections = new Map<VisitorSite, Promise<VisitorRepository>>();

export function getVisitorStore(config: VisitorStorageConfig, site: VisitorSite = "lumix-analytics"): Promise<VisitorRepository> {
  let pending = connections.get(site);
  if (!pending) {
    pending = (async () => {
      const client = new MongoClient(config.mongoUri, {
        appName: "lumix-visitors", maxPoolSize: 2, minPoolSize: 0,
        serverSelectionTimeoutMS: 1500, connectTimeoutMS: 1500,
        socketTimeoutMS: 2000, waitQueueTimeoutMS: 500, maxIdleTimeMS: 30_000,
        retryWrites: false,
      });
      try {
        await client.connect();
        const db = client.db(config.database);
        const prefix = site === "lumix-front" ? "front_" : "";
        const daily = db.collection<DailyCount>(`${prefix}daily_pageviews`);
        const budgets = db.collection<Budget>(`${prefix}collector_budgets`);
        await initializeVisitorCollections(daily, budgets, config.retentionDays);
        const keys = db.collection<VisitorKey>(`${prefix}daily_visitor_keys`);
        const secrets = db.collection<DaySecret>(`${prefix}daily_visitor_secrets`);
        const health = db.collection<EstimationHealth>(`${prefix}daily_estimation_health`);
        await initializeEstimatorCollections(keys, secrets, health);
        return {
          ...collectionStore(daily, budgets), ...estimationStore(keys, secrets, health),
          readDaily: (start: string, now: Date) => daily.find({
            day: { $gte: start, $lte: utcDay(now) }, expiresAt: { $gt: now }, route: { $in: site === "lumix-front" ? ["/spot"] : [...VISITOR_ROUTES] },
          }).limit(60).toArray(),
        };
      } catch {
        await client.close();
        throw new Error("Visitor storage unavailable");
      }
    })().catch((error: unknown) => { connections.delete(site); throw error; });
    connections.set(site, pending);
  }
  return pending;
}
