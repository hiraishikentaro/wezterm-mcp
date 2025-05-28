import { exec } from "child_process";
import { promisify } from "util";
import WeztermExecutor from "../src/wezterm_executor";

// child_processモジュールをモック化
jest.mock("child_process");
const mockedExec = jest.mocked(exec);

describe("WeztermExecutor", () => {
  let executor: WeztermExecutor;

  beforeEach(() => {
    executor = new WeztermExecutor();
    jest.clearAllMocks();
  });

  describe("writeToTerminal", () => {
    it("正常にコマンドを送信できること", async () => {
      // モックの設定
      const mockPaneInfo = "pane_id=1 active=true";
      mockedExec.mockImplementation((command: string, callback: any) => {
        if (command.includes("list")) {
          callback(null, { stdout: mockPaneInfo, stderr: "" });
        } else if (command.includes("send-text")) {
          callback(null, { stdout: "", stderr: "" });
        }
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.writeToTerminal('echo "hello"');

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain(
        'Command sent to WezTerm: echo "hello"'
      );
      expect(result.content[0].text).toContain(mockPaneInfo);
    });

    it("特殊文字を含むコマンドを正しくエスケープできること", async () => {
      const mockPaneInfo = "pane_id=1 active=true";
      mockedExec.mockImplementation((command: string, callback: any) => {
        if (command.includes("list")) {
          callback(null, { stdout: mockPaneInfo, stderr: "" });
        } else if (command.includes("send-text")) {
          // エスケープされたコマンドが正しく渡されているかチェック
          expect(command).toContain("'\"'\"'");
          callback(null, { stdout: "", stderr: "" });
        }
        return {} as any; // ChildProcessのモック
      });

      await executor.writeToTerminal("echo 'hello world'");
    });

    it("エラーが発生した場合にエラーメッセージを返すこと", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        callback(new Error("WezTerm not running"), null);
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.writeToTerminal('echo "hello"');

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to write to terminal");
      expect(result.content[0].text).toContain("WezTerm not running");
    });
  });

  describe("writeToSpecificPane", () => {
    it("指定されたペインにコマンドを送信できること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("--pane-id 123");
        callback(null, { stdout: "", stderr: "" });
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.writeToSpecificPane("ls -la", 123);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Command sent to pane 123: ls -la");
    });

    it("ペイン指定でエラーが発生した場合にエラーメッセージを返すこと", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        callback(new Error("Pane not found"), null);
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.writeToSpecificPane("ls", 999);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to write to pane 999");
      expect(result.content[0].text).toContain("Pane not found");
    });
  });

  describe("listPanes", () => {
    it("ペイン一覧を正常に取得できること", async () => {
      const mockPaneList = `pane_id=1 active=true title="Terminal"
pane_id=2 active=false title="Editor"`;

      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("wezterm cli list");
        callback(null, { stdout: mockPaneList, stderr: "" });
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.listPanes();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(mockPaneList);
    });

    it("ペイン一覧取得でエラーが発生した場合にエラーメッセージを返すこと", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        callback(new Error("Connection failed"), null);
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.listPanes();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to list panes");
      expect(result.content[0].text).toContain("Connection failed");
    });
  });

  describe("switchPane", () => {
    it("指定されたペインに切り替えできること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("activate-pane --pane-id 42");
        callback(null, { stdout: "", stderr: "" });
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.switchPane(42);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Switched to pane 42");
    });

    it("存在しないペインに切り替えようとした場合にエラーメッセージを返すこと", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        callback(new Error("Pane does not exist"), null);
        return {} as any; // ChildProcessのモック
      });

      const result = await executor.switchPane(999);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to switch pane");
      expect(result.content[0].text).toContain("Pane does not exist");
      expect(result.content[0].text).toContain("pane ID 999");
    });
  });
});
