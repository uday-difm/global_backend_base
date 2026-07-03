import { BaseRepository } from "@/core/repository";

export class ServiceRepository extends BaseRepository {
  constructor() {
    super("service");
  }
}

export const serviceRepository = new ServiceRepository();
