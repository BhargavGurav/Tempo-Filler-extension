interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeAPI;

let _vscode: VSCodeAPI;

export function getVSCodeAPI(): VSCodeAPI {
  if (!_vscode) {
    _vscode = acquireVsCodeApi();
  }
  return _vscode;
}

export function sendMessage(command: string, data?: unknown) {
  getVSCodeAPI().postMessage({ command, data });
}