import { Injectable } from '@nestjs/common';
import { AuthorizationManagementClient } from '@azure/arm-authorization';
import { ConfigService } from '@nestjs/config';
import { DefaultAzureCredential } from '@azure/identity';

@Injectable()
export class AzureAuthorizationManagementFetcher {
  private readonly authClient: AuthorizationManagementClient;

  constructor(private readonly configService: ConfigService) {
    const credential = new DefaultAzureCredential();
    this.authClient = new AuthorizationManagementClient(credential, configService.get('AZURE_SUBSCRIPTION_ID'));
  }

  async getRoleAssignments() {
    const roleAssignments = this.authClient.roleAssignments.listForSubscription();
    const assignedRoles = [];
    for await (const assignment of roleAssignments) {
      assignedRoles.push(assignment);
    }
    return assignedRoles;
  }

  async getRoleDefinitionsById(roleDefinitionId: string) {
    return this.authClient.roleDefinitions.getById(roleDefinitionId);
  }
}
