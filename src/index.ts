#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import WeztermExecutor from "./wezterm_executor.js";
import WeztermOutputReader from "./wezterm_output_reader.js";
import SendControlCharacter from "./send_control_character.js";

const server = new Server(
  {
    name: "wezterm-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールの定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write_to_terminal",
        description:
          "Writes text to the active WezTerm pane - often used to run commands",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description:
                "The command to run or text to write to the terminal",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "read_terminal_output",
        description: "Reads output from the active WezTerm pane",
        inputSchema: {
          type: "object",
          properties: {
            lines: {
              type: "number",
              description:
                "Number of lines to read from the terminal (default: 50)",
            },
          },
        },
      },
      {
        name: "send_control_character",
        description: "Sends control characters to the active WezTerm pane",
        inputSchema: {
          type: "object",
          properties: {
            character: {
              type: "string",
              description: "Control character to send (e.g., 'c' for Ctrl+C)",
            },
          },
          required: ["character"],
        },
      },
      {
        name: "list_panes",
        description: "Lists all panes in the current WezTerm window",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "switch_pane",
        description: "Switches to a specific pane in WezTerm",
        inputSchema: {
          type: "object",
          properties: {
            pane_id: {
              type: "number",
              description: "ID of the pane to switch to",
            },
          },
          required: ["pane_id"],
        },
      },
      {
        name: "write_to_specific_pane",
        description: "Writes text to a specific WezTerm pane by pane ID",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description:
                "The command to run or text to write to the terminal",
            },
            pane_id: {
              type: "number",
              description: "ID of the pane to write to",
            },
          },
          required: ["command", "pane_id"],
        },
      },
    ],
  };
});

// ツールの実行
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const executor = new WeztermExecutor();
  const outputReader = new WeztermOutputReader();
  const controlCharSender = new SendControlCharacter();

  switch (request.params.name) {
    case "write_to_terminal":
      return await executor.writeToTerminal(request.params.arguments.command);

    case "read_terminal_output":
      const lines = request.params.arguments.lines || 50;
      return await outputReader.readOutput(lines);

    case "send_control_character":
      return await controlCharSender.send(request.params.arguments.character);

    case "list_panes":
      return await executor.listPanes();

    case "switch_pane":
      return await executor.switchPane(request.params.arguments.pane_id);

    case "write_to_specific_pane":
      return await executor.writeToSpecificPane(
        request.params.arguments.command,
        request.params.arguments.pane_id
      );

    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
