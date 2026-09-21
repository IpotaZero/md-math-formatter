// package.json のあるフォルダで `node scripts/build-and-install.js`
// (または `npm run build:install`) を実行すると、
// 1. vsce で拡張機能を .vsix にパッケージング
// 2. 生成された(最新の) .vsix を検出
// 3. `code --install-extension` でVS Codeにインストール
// までを一気に行う。

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const projectRoot = path.resolve(__dirname, "..")

function run(command) {
    console.log(`\n> ${command}`)
    execSync(command, { cwd: projectRoot, stdio: "inherit" })
}

function findLatestVsix() {
    const vsixFiles = fs
        .readdirSync(projectRoot)
        .filter((file) => file.endsWith(".vsix"))
        .map((file) => ({
            file,
            mtime: fs.statSync(path.join(projectRoot, file)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime)

    if (vsixFiles.length === 0) {
        throw new Error(".vsix ファイルが見つかりませんでした(vsce package に失敗している可能性があります)")
    }

    return vsixFiles[0].file
}

function main() {
    // グローバルインストール不要な npx 経由で vsce を実行する
    run("npx --yes @vscode/vsce package")

    const vsixFile = findLatestVsix()
    console.log(`\n生成された vsix: ${vsixFile}`)

    run(`code --install-extension "${vsixFile}"`)

    console.log("\nインストール完了。VS Codeのウィンドウをリロード(または再起動)してください。")
}

try {
    main()
} catch (error) {
    console.error(`\nビルド/インストールに失敗しました: ${error.message}`)
    process.exit(1)
}
