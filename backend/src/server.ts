import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import { Prisma } from "@prisma/client";
import { requireAuth, signToken, type AuthRequest } from "./auth.js";
import { prisma } from "./prisma.js";
import { computePermitStatus, withComputedPermitStatus } from "./permitStatus.js";
import { enterpriseSchema, inspectionSchema, loginSchema, permitSchema, siteSchema } from "./validation.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
const allowedOrigins = [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000", "https://sigme-theta.vercel.app"].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
      return;
    }
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());
app.use(express.json({ limit: "2mb" }));

const pageArgs = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const okPage = (data: unknown[], total: number, page: number, limit: number) => ({
  data,
  total,
  page,
  totalPages: Math.max(Math.ceil(total / limit), 1)
});

const handleError = (res: express.Response, error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({ error: "A record with this unique value already exists" });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return res.status(409).json({ error: "This record is linked to existing data" });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }
  console.error(error);
  return res.status(500).json({ error: "Server error" });
};

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid login" });
  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const publicUser = { id: user.id, email: user.email, name: user.name };
  res.json({ token: signToken(publicUser), user: publicUser });
});

app.use("/api", requireAuth);

app.get("/api/auth/me", (req: AuthRequest, res) => res.json({ user: req.user }));

app.get("/api/enterprises", async (req, res) => {
  const { page, limit, skip } = pageArgs(req.query);
  const { search, status, region } = req.query;
  const where: Prisma.EnterpriseWhereInput = {
    ...(status ? { status: String(status) as never } : {}),
    ...(region ? { region: String(region) } : {}),
    ...(search ? { OR: [{ name: { contains: String(search), mode: "insensitive" } }, { registrationNumber: { contains: String(search), mode: "insensitive" } }] } : {})
  };
  const [data, total] = await Promise.all([
    prisma.enterprise.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { _count: { select: { sites: true, permits: true } } } }),
    prisma.enterprise.count({ where })
  ]);
  res.json(okPage(data, total, page, limit));
});

app.post("/api/enterprises", async (req, res) => {
  const parsed = enterpriseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid enterprise" });
  try {
    res.status(201).json(await prisma.enterprise.create({ data: { ...parsed.data, email: parsed.data.email || null } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/enterprises/:id", async (req, res) => {
  const enterprise = await prisma.enterprise.findUnique({
    where: { id: req.params.id },
    include: { sites: true, permits: { include: { site: true }, orderBy: { endDate: "asc" } } }
  });
  if (!enterprise) return res.status(404).json({ error: "Enterprise not found" });
  res.json({ ...enterprise, permits: enterprise.permits.map(withComputedPermitStatus) });
});

app.put("/api/enterprises/:id", async (req, res) => {
  const parsed = enterpriseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid enterprise" });
  try {
    res.json(await prisma.enterprise.update({ where: { id: req.params.id }, data: { ...parsed.data, email: parsed.data.email || null } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/enterprises/:id", async (req, res) => {
  try {
    await prisma.enterprise.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/sites", async (req, res) => {
  const { page, limit, skip } = pageArgs(req.query);
  const { search, status, region, mineralType, enterpriseId } = req.query;
  const where: Prisma.MiningSiteWhereInput = {
    ...(status ? { status: String(status) as never } : {}),
    ...(region ? { region: String(region) } : {}),
    ...(mineralType ? { mineralType: String(mineralType) } : {}),
    ...(enterpriseId ? { enterpriseId: String(enterpriseId) } : {}),
    ...(search ? { OR: [{ name: { contains: String(search), mode: "insensitive" } }, { mineralType: { contains: String(search), mode: "insensitive" } }] } : {})
  };
  const [data, total] = await Promise.all([
    prisma.miningSite.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { enterprise: true, _count: { select: { inspections: true, permits: true } } } }),
    prisma.miningSite.count({ where })
  ]);
  res.json(okPage(data, total, page, limit));
});

app.post("/api/sites", async (req, res) => {
  const parsed = siteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid site" });
  try {
    res.status(201).json(await prisma.miningSite.create({ data: { ...parsed.data, locality: parsed.data.locality || null } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/sites/:id", async (req, res) => {
  const site = await prisma.miningSite.findUnique({
    where: { id: req.params.id },
    include: { enterprise: true, permits: { include: { enterprise: true }, orderBy: { endDate: "asc" } }, inspections: { orderBy: { inspectionDate: "desc" } } }
  });
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json({ ...site, permits: site.permits.map(withComputedPermitStatus) });
});

app.put("/api/sites/:id", async (req, res) => {
  const parsed = siteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid site" });
  try {
    res.json(await prisma.miningSite.update({ where: { id: req.params.id }, data: { ...parsed.data, locality: parsed.data.locality || null } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/sites/:id", async (req, res) => {
  try {
    await prisma.miningSite.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/permits", async (req, res) => {
  const { page, limit, skip } = pageArgs(req.query);
  const { search, status, type, enterpriseId } = req.query;
  const where: Prisma.PermitWhereInput = {
    ...(type ? { type: String(type) as never } : {}),
    ...(enterpriseId ? { enterpriseId: String(enterpriseId) } : {}),
    ...(search ? { permitNumber: { contains: String(search), mode: "insensitive" } } : {})
  };
  const all = await prisma.permit.findMany({ where, orderBy: { endDate: "asc" }, include: { enterprise: true, site: true } });
  const computed = all.map(withComputedPermitStatus).filter((permit) => !status || permit.status === status);
  res.json(okPage(computed.slice(skip, skip + limit), computed.length, page, limit));
});

app.post("/api/permits", async (req, res) => {
  const parsed = permitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid permit" });
  try {
    res.status(201).json(await prisma.permit.create({ data: { ...parsed.data, siteId: parsed.data.siteId || null, status: computePermitStatus(parsed.data) } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/permits/:id", async (req, res) => {
  const permit = await prisma.permit.findUnique({ where: { id: req.params.id }, include: { enterprise: true, site: true } });
  if (!permit) return res.status(404).json({ error: "Permit not found" });
  res.json(withComputedPermitStatus(permit));
});

app.put("/api/permits/:id", async (req, res) => {
  const parsed = permitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid permit" });
  try {
    const status = parsed.data.status === "REVOKED" ? "REVOKED" : computePermitStatus(parsed.data);
    res.json(await prisma.permit.update({ where: { id: req.params.id }, data: { ...parsed.data, siteId: parsed.data.siteId || null, status } }));
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/permits/:id", async (req, res) => {
  try {
    await prisma.permit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/inspections", async (req, res) => {
  const { page, limit, skip } = pageArgs(req.query);
  const { siteId, complianceStatus, from, to, search } = req.query;
  const where: Prisma.InspectionWhereInput = {
    ...(siteId ? { siteId: String(siteId) } : {}),
    ...(complianceStatus ? { complianceStatus: String(complianceStatus) as never } : {}),
    ...(from || to ? { inspectionDate: { ...(from ? { gte: new Date(String(from)) } : {}), ...(to ? { lte: new Date(String(to)) } : {}) } } : {}),
    ...(search ? { inspectorName: { contains: String(search), mode: "insensitive" } } : {})
  };
  const [data, total] = await Promise.all([
    prisma.inspection.findMany({ where, skip, take: limit, orderBy: { inspectionDate: "desc" }, include: { site: { include: { enterprise: true } } } }),
    prisma.inspection.count({ where })
  ]);
  res.json(okPage(data, total, page, limit));
});

app.post("/api/inspections", async (req, res) => {
  const parsed = inspectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid inspection" });
  try {
    res.status(201).json(await prisma.inspection.create({ data: parsed.data }));
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/inspections/:id", async (req, res) => {
  const inspection = await prisma.inspection.findUnique({ where: { id: req.params.id }, include: { site: { include: { enterprise: true } } } });
  if (!inspection) return res.status(404).json({ error: "Inspection not found" });
  res.json(inspection);
});

app.put("/api/inspections/:id", async (req, res) => {
  const parsed = inspectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid inspection" });
  try {
    res.json(await prisma.inspection.update({ where: { id: req.params.id }, data: parsed.data }));
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/inspections/:id", async (req, res) => {
  try {
    await prisma.inspection.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/dashboard/stats", async (_req, res) => {
  const now = new Date();
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonths = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));

  const [enterprises, activeSites, permits, inspectionsThisMonth, siteCompliance, latestInspections] = await Promise.all([
    prisma.enterprise.count(),
    prisma.miningSite.count({ where: { status: "ACTIVE" } }),
    prisma.permit.findMany({ orderBy: { createdAt: "desc" }, include: { enterprise: true, site: true } }),
    prisma.inspection.count({ where: { inspectionDate: { gte: monthStart } } }),
    prisma.inspection.findMany({ orderBy: { inspectionDate: "desc" }, distinct: ["siteId"] }),
    prisma.inspection.findMany({ take: 5, orderBy: { inspectionDate: "desc" }, include: { site: true } })
  ]);

  const computedPermits = permits.map(withComputedPermitStatus);
  const activePermits = computedPermits.filter((p) => p.status === "ACTIVE").length;
  const expiringSoon = computedPermits.filter((p) => p.status === "ACTIVE" && p.endDate <= in30).length;
  const compliantSites = siteCompliance.length ? Math.round((siteCompliance.filter((i) => i.complianceStatus === "COMPLIANT").length / siteCompliance.length) * 100) : 0;
  const permitsByStatus = ["PENDING", "ACTIVE", "EXPIRED", "REVOKED"].map((status) => ({ status, count: computedPermits.filter((p) => p.status === status).length }));
  const inspectionsByCompliance = ["COMPLIANT", "NON_COMPLIANT", "PENDING_REVIEW"].map((status) => ({ status, count: siteCompliance.filter((i) => i.complianceStatus === status).length }));
  const inspectionsTrend = sixMonths.map((date) => {
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return {
      month: date.toLocaleDateString("fr-FR", { month: "short" }),
      count: siteCompliance.filter((i) => i.inspectionDate >= date && i.inspectionDate < next).length
    };
  });

  res.json({
    kpis: { enterprises, activeSites, activePermits, expiringSoon, inspectionsThisMonth, compliantSites },
    permitsByStatus,
    inspectionsByCompliance,
    inspectionsTrend,
    recentActivity: {
      inspections: latestInspections,
      permits: computedPermits.slice(0, 5)
    }
  });
});

app.listen(port, () => {
  console.log(`SIGEM API running on http://localhost:${port}`);
});
