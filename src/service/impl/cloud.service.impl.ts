import { Injectable } from '@nestjs/common';
import { AWSManager } from '../../util/manager/aws.manager';
import { GCPManager } from '../../util/manager/gcp.manager';
import { AzureManager } from '../../util/manager/azure.manager';
import { CloudType, ResourceType } from '../../common/type';
import { CLOUD_TYPE } from '../../common/enum';
import { CloudService } from '../cloud.service';

@Injectable()
export class CloudServiceImpl implements CloudService {
  constructor(
    private readonly awsManager: AWSManager,
    private readonly gcpManager: GCPManager,
    private readonly azureManager: AzureManager,
  ) {}

  async getRelationships(cloud: CloudType, resource: ResourceType, name: string) {
    if (cloud === CLOUD_TYPE.AWS) {
      return this.awsManager.getRelationships(resource, name);
    } else if (cloud === CLOUD_TYPE.GCP) {
      return this.gcpManager.getRelationships(resource, name);
    } else if (cloud === CLOUD_TYPE.AZURE) {
      return this.azureManager.getRelationships(resource, name);
    }
    throw new Error(`Unsupported cloud provider: ${cloud}`);
  }

  async getPermission(cloud: CloudType, user: string) {
    if (cloud === CLOUD_TYPE.AWS) {
      return this.awsManager.getPermission(user);
    } else if (cloud === CLOUD_TYPE.GCP) {
      return this.gcpManager.getPermission(user);
    } else if (cloud === CLOUD_TYPE.AZURE) {
      return this.azureManager.getPermission(user);
    }
    throw new Error(`Unsupported cloud provider: ${cloud}`);
  }
}
