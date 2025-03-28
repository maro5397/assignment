import { Injectable, Logger } from '@nestjs/common';
import { ResourceType } from "../../common/type";

@Injectable()
export class GCPManager {
  private readonly logger = new Logger(GCPManager.name);

  async getRelationships(resource: ResourceType, name: string) {
    return resource + name;
  }

  async getPermission(user: string) {
    return user;
  }
}
