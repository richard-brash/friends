import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class QuickPickItemService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.quickPickItem.findMany({
      where: { organization_id: organizationId },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      select: { id: true, label: true, sort_order: true },
    });
  }

  async create(organizationId: string, label: string, sortOrder?: number) {
    const normalized = label.trim().toLowerCase();
    const maxOrder = await this.prisma.quickPickItem.aggregate({
      where: { organization_id: organizationId },
      _max: { sort_order: true },
    });

    return this.prisma.quickPickItem.create({
      data: {
        organization_id: organizationId,
        label: normalized,
        sort_order: sortOrder ?? (maxOrder._max.sort_order ?? -1) + 1,
      },
      select: { id: true, label: true, sort_order: true },
    });
  }

  async update(id: string, organizationId: string, data: { label?: string; sort_order?: number }) {
    const item = await this.prisma.quickPickItem.findFirst({
      where: { id, organization_id: organizationId },
    });
    if (!item) {
      return null;
    }

    return this.prisma.quickPickItem.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim().toLowerCase() } : {}),
        ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
      },
      select: { id: true, label: true, sort_order: true },
    });
  }

  async remove(id: string, organizationId: string): Promise<boolean> {
    const item = await this.prisma.quickPickItem.findFirst({
      where: { id, organization_id: organizationId },
    });
    if (!item) {
      return false;
    }

    await this.prisma.quickPickItem.delete({ where: { id } });
    return true;
  }

  async seedDefaults(organizationId: string) {
    const defaults = ["shirt", "pants", "socks", "underwear"];
    const existing = await this.prisma.quickPickItem.findMany({
      where: { organization_id: organizationId },
      select: { label: true },
    });
    const existingLabels = new Set(existing.map((item) => item.label));

    const toInsert = defaults
      .filter((label) => !existingLabels.has(label))
      .map((label, index) => ({
        organization_id: organizationId,
        label,
        sort_order: index,
        updated_at: new Date(),
      }));

    if (!toInsert.length) {
      return;
    }

    await this.prisma.quickPickItem.createMany({ data: toInsert });
  }
}
