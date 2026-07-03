import { BaseRepository } from "@/core/repository";

export class TeamMemberRepository extends BaseRepository {
  constructor() {
    super("teamMember");
  }
}

export const teamMemberRepository = new TeamMemberRepository();
