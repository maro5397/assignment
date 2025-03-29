import { CloudType, ResourceType } from '../common/type';

export interface CloudService {
  getRelationships(cloud: CloudType, resource: ResourceType, name: string): any;
  getPermission(cloud: CloudType, user: string): any;
}
