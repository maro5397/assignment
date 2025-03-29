import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ResourceType } from '../../common/type';

@Injectable()
export class GCPManager {
  private readonly logger = new Logger(GCPManager.name);

  async getRelationships(resource: ResourceType, name: string) {
    throw new NotImplementedException(`GCP cloud service is not supported (${resource}, ${name})`);
  }

  async getPermission(user: string) {
    throw new NotImplementedException(`GCP cloud service is not supported (${user})`);
  }
}
