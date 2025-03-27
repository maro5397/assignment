import { Injectable } from '@nestjs/common';
import {
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetUserPolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListUserPoliciesCommand,
} from '@aws-sdk/client-iam';
import process from 'node:process';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';

@Injectable()
export class IamFetcher {
  private readonly iamClient: IAMClient;

  constructor() {
    this.iamClient = new IAMClient({
      region: process.env.AWS_REGION,
      credentials: fromTemporaryCredentials({
        clientConfig: { region: process.env.AWS_REGION },
        params: {
          RoleArn: process.env.AWS_ROLE_ARN,
          RoleSessionName: process.env.AWS_ROLE_SESSION_NAME,
        },
      }),
    });
  }

  async listUserPolicyNames(username: string) {
    const listUserPoliciesCommand = new ListUserPoliciesCommand({ UserName: username });
    const listUserPoliciesResponse = await this.iamClient.send(listUserPoliciesCommand);
    return listUserPoliciesResponse.PolicyNames;
  }

  async getUserPolicyDocument(username: string, policyName: string) {
    const getUserPolicyCommand = new GetUserPolicyCommand({ UserName: username, PolicyName: policyName });
    const getUserPolicyResponse = await this.iamClient.send(getUserPolicyCommand);
    return JSON.parse(decodeURIComponent(getUserPolicyResponse.PolicyDocument));
  }

  async listAttachedRolePolicies(roleArn: string) {
    const roleName = this.extractRoleNameFromArn(roleArn);
    const listAttachedRolePoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
    const listAttachedRolePoliciesResponse = await this.iamClient.send(listAttachedRolePoliciesCommand);
    return listAttachedRolePoliciesResponse.AttachedPolicies;
  }

  async getPolicy(policyArn: string) {
    const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policyArn });
    const getPolicyResponse = await this.iamClient.send(getPolicyCommand);
    return getPolicyResponse.Policy;
  }

  async getPolicyVersion(policyArn: string, versionId: string) {
    const getPolicyVersionCommand = new GetPolicyVersionCommand({ PolicyArn: policyArn, VersionId: versionId });
    const getPolicyVersionResponse = await this.iamClient.send(getPolicyVersionCommand);
    return getPolicyVersionResponse.PolicyVersion;
  }

  private extractRoleNameFromArn(roleArn: string): string {
    const parts = roleArn.split('/');
    return parts[parts.length - 1];
  }
}
