import { Controller, Get, Query } from '@nestjs/common';
import { CloudServiceImpl } from '../service/impl/cloud.service.impl';
import { RESOURCE_TYPE } from '../common/enum';
import { CloudType, ResourceType } from '../common/type';

@Controller()
export class CloudController {
  constructor(private readonly cloudService: CloudServiceImpl) {}

  @Get('relationships')
  async getRelationships(
    @Query('cloud') cloud: CloudType,
    @Query('resource') resource: ResourceType = RESOURCE_TYPE.LOAD_BALANCER,
    @Query('name') name: string,
  ) {
    return this.cloudService.getRelationships(cloud, resource, name);
  }

  @Get('permission')
  async getPermissions(@Query('cloud') cloud: CloudType, @Query('user') user: string) {
    return this.cloudService.getPermission(cloud, user);
  }
}
