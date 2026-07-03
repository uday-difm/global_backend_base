import { serviceRepository } from "@/repositories/service.repository";
import { BaseService } from "@/core/service";

export class ServiceService extends BaseService {
  constructor() {
    super(serviceRepository);
  }

  async getServices(siteId) {
    return this.getList(siteId, {
      orderBy: { sortOrder: "asc" },
      include: { featuredImage: true },
    });
  }
}

export const serviceService = new ServiceService();
