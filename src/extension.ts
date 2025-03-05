import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "lottieViewer.preview",
    (uri?: vscode.Uri) => {
      if (!uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          uri = activeEditor.document.uri;
        }
      }
      if (uri) {
        previewLottieFile(uri);
      } else {
        vscode.window.showErrorMessage("No JSON file selected");
      }
    }
  );

  // Add Status Bar Button
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "lottieViewer.preview";
  statusBarItem.text = "$(play) Preview Lottie";
  statusBarItem.tooltip = "Preview Lottie Animation";
  statusBarItem.show();

  // Register document symbol provider
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      { language: "json" },
      new LottieSymbolProvider()
    )
  );

  context.subscriptions.push(disposable, statusBarItem);
}

function previewLottieFile(uri: vscode.Uri) {
  if (path.extname(uri.fsPath).toLowerCase() !== ".json") {
    vscode.window.showErrorMessage("Please select a JSON file");
    return;
  }

  try {
    const fileContent = fs.readFileSync(uri.fsPath, "utf8");
    const lottieData = JSON.parse(fileContent);

    if (!isValidLottieJson(lottieData)) {
      vscode.window.showErrorMessage("Not a valid Lottie JSON file");
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "lottieViewer",
      "Lottie Viewer",
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getLottieViewerHTML(lottieData);
  } catch (error: any) {
    vscode.window.showErrorMessage(
      `Error processing Lottie file: ${error.message}`
    );
  }
}

export function isValidLottieJson(json: any): boolean {
  if (!json) { return false; }
  return Boolean(json.v && json.w && json.h && Array.isArray(json.layers));
}

function getLottieViewerHTML(lottieData: any): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lottie Viewer</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.14/lottie.min.js"></script>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f0f0f0;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 20px;
          text-align: center;
        }
        #lottie-container {
          width: 400px;
          height: 400px;
          margin-bottom: 20px;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .control-button {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .control-button:hover {
          background-color: #0056b3;
        }
        .control-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.5);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="lottie-container"></div>
        <div class="controls">
          <button class="control-button" onclick="playAnimation()">Play</button>
          <button class="control-button" onclick="pauseAnimation()">Pause</button>
          <button class="control-button" onclick="stopAnimation()">Stop</button>
        </div>
      </div>
      <script>
        const animationData = ${JSON.stringify(lottieData)};
        let anim;

        window.onload = function() {
          anim = lottie.loadAnimation({
            container: document.getElementById('lottie-container'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData,
        });
        };

        function playAnimation() { anim.play(); }
        function pauseAnimation() { anim.pause(); }
        function stopAnimation() { anim.stop(); }
      </script>
    </body>
    </html>`;
}

class LottieSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    try {
      const json = JSON.parse(document.getText());
      if (!isValidLottieJson(json)) {return [];}

      const range = new vscode.Range(0, 0, document.lineCount, 0);
      const metadataSymbol = new vscode.DocumentSymbol(
        "Lottie Metadata",
        "Animation Metadata",
        vscode.SymbolKind.Object,
        range,
        range
      );
      return [metadataSymbol];
    } catch {
      return [];
    }
  }
}
