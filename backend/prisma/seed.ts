import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.adminUser.upsert({
    where: { email: "admin@sigem.cm" },
    update: {},
    create: {
      name: "Administrateur SIGEM",
      email: "admin@sigem.cm",
      password: await bcrypt.hash("password123", 10)
    }
  });

  await prisma.inspection.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.miningSite.deleteMany();
  await prisma.enterprise.deleteMany();

  const enterprises = await Promise.all([
    prisma.enterprise.create({
      data: {
        name: "Cameroon Gold Fields SA",
        registrationNumber: "RC/YAO/2021/B/1842",
        legalRepresentative: "Marie Ndongo",
        email: "contact@goldfields.cm",
        phone: "+237 699 11 22 33",
        address: "Boulevard du 20 Mai, Yaounde",
        region: "Est",
        status: "ACTIVE"
      }
    }),
    prisma.enterprise.create({
      data: {
        name: "Societe Miniere de l'Adamaoua",
        registrationNumber: "RC/NGA/2020/A/0447",
        legalRepresentative: "Issa Hamadou",
        email: "info@sma.cm",
        phone: "+237 677 88 44 21",
        address: "Quartier administratif, Ngaoundere",
        region: "Adamaoua",
        status: "ACTIVE"
      }
    }),
    prisma.enterprise.create({
      data: {
        name: "Bauxite du Sud Cameroun",
        registrationNumber: "RC/EBO/2019/B/0921",
        legalRepresentative: "Claire Menye",
        phone: "+237 655 08 45 19",
        address: "Avenue principale, Ebolowa",
        region: "Sud",
        status: "SUSPENDED"
      }
    })
  ]);

  const sites = await Promise.all([
    prisma.miningSite.create({ data: { name: "Site aurifere de Betare-Oya", region: "Est", locality: "Betare-Oya", latitude: 5.6, longitude: 14.1, mineralType: "Gold", areaHectares: 125.5, enterpriseId: enterprises[0].id } }),
    prisma.miningSite.create({ data: { name: "Gisement diamantifere de Yokadouma", region: "Est", locality: "Yokadouma", mineralType: "Diamond", areaHectares: 84, enterpriseId: enterprises[0].id, status: "UNDER_REVIEW" } }),
    prisma.miningSite.create({ data: { name: "Fer de Mbalam Nord", region: "Nord", locality: "Mbalam", mineralType: "Iron ore", areaHectares: 300, enterpriseId: enterprises[1].id } }),
    prisma.miningSite.create({ data: { name: "Plateau bauxitique de Minim-Martap", region: "Adamaoua", locality: "Minim-Martap", mineralType: "Bauxite", areaHectares: 210, enterpriseId: enterprises[1].id } }),
    prisma.miningSite.create({ data: { name: "Carriere de Kribi Sud", region: "Sud", locality: "Kribi", mineralType: "Gold", areaHectares: 45, enterpriseId: enterprises[2].id, status: "INACTIVE" } })
  ]);

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  await Promise.all([
    prisma.permit.create({ data: { permitNumber: "SIGEM-EXP-2026-001", type: "EXPLOITATION", startDate: addDays(-120), endDate: addDays(24), status: "ACTIVE", enterpriseId: enterprises[0].id, siteId: sites[0].id, notes: "Renewal review required before expiry." } }),
    prisma.permit.create({ data: { permitNumber: "SIGEM-EXR-2026-014", type: "EXPLORATION", startDate: addDays(20), endDate: addDays(390), status: "PENDING", enterpriseId: enterprises[0].id, siteId: sites[1].id } }),
    prisma.permit.create({ data: { permitNumber: "SIGEM-IND-2025-033", type: "INDUSTRIAL", startDate: addDays(-360), endDate: addDays(180), status: "ACTIVE", enterpriseId: enterprises[1].id, siteId: sites[3].id } }),
    prisma.permit.create({ data: { permitNumber: "SIGEM-ART-2024-118", type: "ARTISANAL", startDate: addDays(-500), endDate: addDays(-10), status: "EXPIRED", enterpriseId: enterprises[2].id, siteId: sites[4].id } }),
    prisma.permit.create({ data: { permitNumber: "SIGEM-REV-2025-006", type: "EXPLORATION", startDate: addDays(-200), endDate: addDays(100), status: "REVOKED", enterpriseId: enterprises[1].id, siteId: sites[2].id, notes: "Revoked after non-compliance notice." } })
  ]);

  await Promise.all([
    prisma.inspection.create({ data: { siteId: sites[0].id, inspectorName: "Jean Bikoro", inspectionDate: addDays(-8), complianceStatus: "COMPLIANT", findings: "Safety register up to date and boundary markers visible.", followUpActions: "Submit monthly extraction figures." } }),
    prisma.inspection.create({ data: { siteId: sites[1].id, inspectorName: "Aline Mbarga", inspectionDate: addDays(-22), complianceStatus: "PENDING_REVIEW", findings: "Community consultation records incomplete.", followUpActions: "Provide signed minutes within 15 days." } }),
    prisma.inspection.create({ data: { siteId: sites[2].id, inspectorName: "Paul Tchoumi", inspectionDate: addDays(-48), complianceStatus: "NON_COMPLIANT", findings: "Environmental mitigation plan not implemented.", followUpActions: "Suspend extraction in affected zone pending corrective plan." } }),
    prisma.inspection.create({ data: { siteId: sites[3].id, inspectorName: "Nadine Etoundi", inspectionDate: addDays(-90), complianceStatus: "COMPLIANT", findings: "Permit display and workforce records verified." } }),
    prisma.inspection.create({ data: { siteId: sites[4].id, inspectorName: "Andre Fouda", inspectionDate: addDays(-160), complianceStatus: "NON_COMPLIANT", findings: "Inactive site remains unsecured.", followUpActions: "Install warning signage and submit closure report." } })
  ]);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
