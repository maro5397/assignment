import { CloudType, ResourceType } from '../common/type';

export interface CloudService {
  getRelationships(cloud: CloudType, resource: ResourceType, name: string);
  getPermission(cloud: CloudType, user: string);
}
