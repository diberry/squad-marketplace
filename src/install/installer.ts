/**
 * Agent Installer
 * Main installation workflow.
 */

export interface InstallationMetadata {
  name: string;
  version: string;
  installedAt: string;
  from: string; // registry URL
  locked: boolean;
}

export class AgentInstaller {
  async install(agentName: string, version: string, targetDir: string): Promise<InstallationMetadata> {
    // TODO: Implement install flow: fetch -> extract -> resolve dependencies -> write metadata
    throw new Error('Not implemented');
  }

  async uninstall(agentName: string): Promise<void> {
    // TODO: Implement uninstall
    throw new Error('Not implemented');
  }
}
