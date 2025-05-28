import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default class WeztermOutputReader {
  private weztermCli: string;

  constructor() {
    this.weztermCli = "wezterm cli";
  }

  async readOutput(lines: number = 50): Promise<{ content: any[] }> {
    try {
      let command: string;

      if (lines <= 0) {
        // 全ての内容を取得（現在の画面のみ）
        command = `${this.weztermCli} get-text --escapes`;
      } else {
        // 指定された行数分を取得（スクロールバックから）
        const startLine = -lines;
        command = `${this.weztermCli} get-text --escapes --start-line ${startLine}`;
      }

      const { stdout } = await execAsync(command);

      return {
        content: [
          {
            type: "text",
            text: stdout || "(empty output)",
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to read terminal output: ${error.message}\nMake sure WezTerm is running and the mux server is enabled.\nTry running: wezterm cli list`,
          },
        ],
      };
    }
  }

  // 現在の画面内容のみを取得する新しいメソッド
  async readCurrentScreen(): Promise<{ content: any[] }> {
    try {
      const { stdout } = await execAsync(
        `${this.weztermCli} get-text --escapes`
      );

      return {
        content: [
          {
            type: "text",
            text: stdout || "(empty output)",
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to read current screen: ${error.message}`,
          },
        ],
      };
    }
  }
}
