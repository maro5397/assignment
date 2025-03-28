import { Injectable, Logger } from '@nestjs/common';
import { ResourceType } from '../../common/type';

@Injectable()
export class AzureManager {
  private readonly logger = new Logger(AzureManager.name);

  async getRelationships(resource: ResourceType, name: string) {
    return resource + name;
  }

  async getPermission(user: string) {
    return user;
  }
}
