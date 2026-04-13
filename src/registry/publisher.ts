/**
 * Publisher
 * Manage agent publishing workflow.
 */

export class AgentPublisher {
  async publish(agentDir: string, registryUrl: string): Promise<string> {
    // TODO: Implement publish workflow: package -> security scan -> release -> index update
    throw new Error('Not implemented');
  }
}
