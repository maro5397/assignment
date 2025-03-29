import { ConfigService } from '@nestjs/config';
import { DefaultAzureCredential } from '@azure/identity';
import { NetworkManagementClient } from '@azure/arm-network';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AzureNetworkManagementFetcher {
  private readonly networkClient: NetworkManagementClient;

  constructor(private readonly configService: ConfigService) {
    const credential = new DefaultAzureCredential();
    this.networkClient = new NetworkManagementClient(credential, configService.get('AZURE_SUBSCRIPTION_ID'));
  }

  async getLoadBalancerByName(name: string) {
    const loadBalancersIterator = this.networkClient.loadBalancers.listAll();
    for await (const lb of loadBalancersIterator) {
      if (lb.name === name) return lb;
    }
    throw new NotFoundException(`There is no LoadBalancer named ${name}`);
  }

  async getNetworkInterfaces() {
    const networkInterfaces = [];
    const networkInterfaceIterator = this.networkClient.networkInterfaces.listAll();
    for await (const networkInterfaceIteratorElement of networkInterfaceIterator) {
      networkInterfaces.push(networkInterfaceIteratorElement);
    }
    return networkInterfaces;
  }
}
