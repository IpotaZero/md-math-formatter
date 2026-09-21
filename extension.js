const vscode = require("vscode")
const { MarkdownMathFormatter } = require("./mathFormatter")

/**
 * 「保存時に自動整形するかどうか」の設定(mdMathFormatter.formatOnSave)を読み取る。
 * 設定項目自体は package.json の contributes.configuration 側で宣言する。
 */
function isFormatOnSaveEnabled() {
    return vscode.workspace.getConfiguration("mdMathFormatter").get("formatOnSave", true)
}

function activate(context) {
    const markdownFormatter = new MarkdownMathFormatter()

    const formatCommand = vscode.commands.registerCommand("extension.formatMath", function () {
        const editor = vscode.window.activeTextEditor
        if (!editor) return

        const document = editor.document
        const text = document.getText()
        const formattedText = markdownFormatter.format(text)

        if (formattedText === text) {
            vscode.window.showInformationMessage("数式内に修正箇所はありませんでした。")
            return
        }

        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))

        editor.edit((editBuilder) => {
            editBuilder.replace(fullRange, formattedText)
        })

        vscode.window.showInformationMessage("数式内の整形が完了しました！")
    })

    // 保存時に自動整形する。editor.edit() を使うと保存処理と競合しうるため、
    // VS Code 推奨の onWillSaveTextDocument + waitUntil(TextEdit[]) 方式を使う。
    const formatOnSave = vscode.workspace.onWillSaveTextDocument((event) => {
        const { document } = event
        if (document.languageId !== "markdown") return
        if (!isFormatOnSaveEnabled()) return

        const text = document.getText()
        const formattedText = markdownFormatter.format(text)
        if (formattedText === text) return

        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))
        event.waitUntil(Promise.resolve([vscode.TextEdit.replace(fullRange, formattedText)]))
    })

    context.subscriptions.push(formatCommand, formatOnSave)
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
}
