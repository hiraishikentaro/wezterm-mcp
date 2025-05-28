import { exec } from "child_process";
import SendControlCharacter from "../src/send_control_character";

// child_processモジュールをモック化
jest.mock("child_process");
const mockedExec = jest.mocked(exec);

describe("SendControlCharacter", () => {
  let controlCharSender: SendControlCharacter;

  beforeEach(() => {
    controlCharSender = new SendControlCharacter();
    jest.clearAllMocks();
  });

  describe("send", () => {
    it("Ctrl+Cを正常に送信できること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("send-text $'\\x03'");
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await controlCharSender.send("c");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+C");
    });

    it("Ctrl+Dを正常に送信できること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("send-text $'\\x04'");
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await controlCharSender.send("d");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+D");
    });

    it("Ctrl+Zを正常に送信できること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("send-text $'\\x1a'");
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await controlCharSender.send("z");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+Z");
    });

    it("Ctrl+Lを正常に送信できること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("send-text $'\\x0c'");
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await controlCharSender.send("l");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+L");
    });

    it("大文字の文字でも正常に動作すること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        expect(command).toContain("send-text $'\\x03'");
        callback(null, { stdout: "", stderr: "" });
        return {} as any;
      });

      const result = await controlCharSender.send("C");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+C");
    });

    it("サポートされていない制御文字の場合はエラーを投げること", async () => {
      await expect(controlCharSender.send("x")).rejects.toThrow(
        "Unknown control character: x"
      );
    });

    it("空文字の場合はエラーを投げること", async () => {
      await expect(controlCharSender.send("")).rejects.toThrow(
        "Unknown control character: "
      );
    });

    it("WezTermコマンド実行でエラーが発生した場合はエラーを投げること", async () => {
      mockedExec.mockImplementation((command: string, callback: any) => {
        callback(new Error("WezTerm not available"), null);
        return {} as any;
      });

      await expect(controlCharSender.send("c")).rejects.toThrow(
        "Failed to send control character: WezTerm not available"
      );
    });

    // 全ての制御文字のマッピングをテスト
    const controlCharTests = [
      { char: "a", sequence: "\\x01", name: "Ctrl+A" },
      { char: "e", sequence: "\\x05", name: "Ctrl+E" },
      { char: "k", sequence: "\\x0b", name: "Ctrl+K" },
      { char: "u", sequence: "\\x15", name: "Ctrl+U" },
      { char: "w", sequence: "\\x17", name: "Ctrl+W" },
    ];

    controlCharTests.forEach(({ char, sequence, name }) => {
      it(`${name}を正常に送信できること`, async () => {
        mockedExec.mockImplementation((command: string, callback: any) => {
          expect(command).toContain(`send-text $'${sequence}'`);
          callback(null, { stdout: "", stderr: "" });
          return {} as any;
        });

        const result = await controlCharSender.send(char);

        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBe(`Sent control character: ${name}`);
      });
    });
  });
});
