import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';

export interface VersionInfo {
  version: string;
  commit: string;
  buildTime: string;
}

@Injectable()
export class AppService {
  private versionInfo: VersionInfo | null = null;

  getHello(): string {
    return 'Hello World!';
  }

  getVersion(): VersionInfo {
    if (!this.versionInfo) {
      let commit = 'unknown';
      try {
        commit = execSync('git rev-parse HEAD').toString().trim();
      } catch {
        // git not available
      }
      this.versionInfo = {
        version: '0.0.1',
        commit,
        buildTime: new Date().toISOString(),
      };
    }
    return this.versionInfo;
  }
}
