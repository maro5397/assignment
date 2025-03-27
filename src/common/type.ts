import { CLOUD_TYPE, RESOURCE_TYPE } from './enum';

export type ResourceType = (typeof RESOURCE_TYPE)[keyof typeof RESOURCE_TYPE];
export type CloudType = (typeof CLOUD_TYPE)[keyof typeof CLOUD_TYPE];
