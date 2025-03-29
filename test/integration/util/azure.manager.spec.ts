import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DefaultAzureCredential } from '@azure/identity';
import { NetworkManagementClient } from '@azure/arm-network';
import { AuthorizationManagementClient } from '@azure/arm-authorization';

describe('AZURE Manager Test', () => {
  beforeAll(async () => {
    await Test.createTestingModule({
      imports: [await ConfigModule.forRoot({ isGlobal: true })],
    }).compile();
  });

  it('azure load balancer test', async () => {
    const loadBalancerName = 'test-lb';
    const credential = new DefaultAzureCredential();
    const networkClient = new NetworkManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);

    const loadBalancersIterator = networkClient.loadBalancers.listAll();
    let loadBalancer;
    for await (const lb of loadBalancersIterator) {
      if (lb.name === loadBalancerName) loadBalancer = lb;
    }
    const backendPools = loadBalancer.backendAddressPools || [];

    const nicNames = [];
    const instanceIds = new Set();
    const securityGroupIds = new Set();
    for (const pool of backendPools) {
      if (pool.backendIPConfigurations) {
        for (const ipConfig of pool.backendIPConfigurations) {
          const ipConfigParts = ipConfig.id.split('/');
          const nicIndex = ipConfigParts.findIndex((part: string) => part === 'networkInterfaces');
          if (nicIndex > 0 && nicIndex + 1 < ipConfigParts.length) {
            const nicName = ipConfigParts[nicIndex + 1];
            nicNames.push(nicName);
          }
        }
      }
    }

    const nics = [];
    const nicIterator = networkClient.networkInterfaces.listAll();
    for await (const nic of nicIterator) {
      nics.push(nic);
    }
    for (const nic of nics) {
      if (nicNames.includes(nic.name)) {
        const vmParts = nic.virtualMachine.id.split('/');
        const vmName = vmParts[vmParts.length - 1];
        instanceIds.add(vmName);
        const sgParts = nic.networkSecurityGroup.id.split('/');
        const sgName = sgParts[sgParts.length - 1];
        securityGroupIds.add(sgName);
      }
    }
    console.log({
      load_balancer: loadBalancer.name,
      target_group: backendPools.map((pool) => pool.name),
      instances: Array.from(instanceIds),
      security_groups: Array.from(securityGroupIds),
    });
  });

  it('azure manager identities test', async () => {
    const user = 'tatum';
    const credential = new DefaultAzureCredential();
    const authClient = new AuthorizationManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);
    const roleAssignments = authClient.roleAssignments.listForSubscription();

    const assignedRoles = [];
    for await (const assignment of roleAssignments) {
      const assignmentParts = assignment.scope.split('/');
      if (assignmentParts[assignmentParts.length - 1] === user) {
        const roleDefinition = await authClient.roleDefinitions.getById(assignment.roleDefinitionId);
        assignedRoles.push(roleDefinition);
      }
    }
    console.log(assignedRoles);
  });
});
