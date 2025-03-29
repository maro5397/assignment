import { Inject, Injectable, Logger } from '@nestjs/common';
import { ResourceType } from '../../common/type';
import { AzureAuthorizationManagementFetcher } from '../fetcher/azure/azure-authorization-management.fetcher';
import { RESOURCE_TYPE } from '../../common/enum';
import { AzureNetworkManagementFetcher } from '../fetcher/azure/azure-network-management.fetcher';

@Injectable()
export class AzureManager {
  private readonly logger = new Logger(AzureManager.name);

  constructor(
    @Inject() private readonly authorizationManagementFetcher: AzureAuthorizationManagementFetcher,
    @Inject() private readonly networkManagementFetcher: AzureNetworkManagementFetcher,
  ) {}

  async getRelationships(resource: ResourceType, name: string) {
    this.logger.debug(`Getting relationships for resource: ${resource}, name: ${name}`);
    if (resource !== RESOURCE_TYPE.LOAD_BALANCER) {
      throw new Error('Only load_balancer resource type is supported');
    }
    const loadBalancer = await this.networkManagementFetcher.getLoadBalancerByName(name);
    const backendPools = loadBalancer.backendAddressPools;

    const networkInterfaceNames = [];
    for (const backendPool of backendPools) {
      for (const backendIPConfiguration of backendPool.backendIPConfigurations) {
        const backendIPConfigurationParts = backendIPConfiguration.id.split('/');
        const networkInterfaceIndex = backendIPConfigurationParts.findIndex(
          (part: string) => part === 'networkInterfaces',
        );
        if (networkInterfaceIndex > 0 && networkInterfaceIndex + 1 < backendIPConfigurationParts.length) {
          const networkInterfaceName = backendIPConfigurationParts[networkInterfaceIndex + 1];
          networkInterfaceNames.push(networkInterfaceName);
        }
      }
    }

    const instanceIds = new Set();
    const securityGroupIds = new Set();
    const networkInterfaces = await this.networkManagementFetcher.getNetworkInterfaces();
    for (const networkInterface of networkInterfaces) {
      if (networkInterfaceNames.includes(networkInterface.name)) {
        const virtualMachineParts = networkInterface.virtualMachine.id.split('/');
        const virtualMachineName = virtualMachineParts[virtualMachineParts.length - 1];
        instanceIds.add(virtualMachineName);
        const sgParts = networkInterface.networkSecurityGroup.id.split('/');
        const sgName = sgParts[sgParts.length - 1];
        securityGroupIds.add(sgName);
      }
    }

    return {
      load_balancer: loadBalancer.name,
      target_group: backendPools.map((pool) => pool.name),
      instances: Array.from(instanceIds),
      security_groups: Array.from(securityGroupIds),
    };
  }

  async getPermission(user: string) {
    this.logger.debug(`Getting permissions for user: ${user}`);
    const assignedRoles = [];
    const assignments = await this.authorizationManagementFetcher.getRoleAssignments();
    for (const assignment of assignments) {
      const assignmentParts = assignment.scope.split('/');
      if (assignmentParts[assignmentParts.length - 1] === user) {
        assignedRoles.push(
          await this.authorizationManagementFetcher.getRoleDefinitionsById(assignment.roleDefinitionId),
        );
      }
    }
    this.logger.log(`Successfully retrieved permissions for user: ${user}`);
    return assignedRoles;
  }
}
