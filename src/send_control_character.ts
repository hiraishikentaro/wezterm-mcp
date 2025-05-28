import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default class SendControlCharacter {
  private weztermCli: string;

  constructor() {
    this.weztermCli = "wezterm cli";
  }

  async send(character: string): Promise<{ content: any[] }> {
    try {
      const controlMap: { [key: string]: string } = {
        c: "\\x03", // Ctrl+C
        d: "\\x04", // Ctrl+D
        z: "\\x1a", // Ctrl+Z
        l: "\\x0c", // Ctrl+L
        a: "\\x01", // Ctrl+A
        e: "\\x05", // Ctrl+E
        k: "\\x0b", // Ctrl+K
        u: "\\x15", // Ctrl+U
        w: "\\x17", // Ctrl+W
      };

      const controlSeq = controlMap[character.toLowerCase()];
      if (!controlSeq) {
        throw new Error(`Unknown control character: ${character}`);
      }

      await execAsync(`${this.weztermCli} send-text $'${controlSeq}'`);

      return {
        content: [
          {
            type: "text",
            text: `Sent control character: Ctrl+${character.toUpperCase()}`,
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to send control character: ${error.message}`);
    }
  }
}
