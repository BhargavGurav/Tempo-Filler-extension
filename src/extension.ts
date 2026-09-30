import * as vscode from 'vscode';
import { TempoPanel } from './TempoPanel';

export function activate(context: vscode.ExtensionContext) {
  const provider = new TempoPanel(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'tempofiller.mainView',
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tempoLogger.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.tempo-logger');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tempofiller.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.tempo-logger');
    })
  );
}

export function deactivate() {}