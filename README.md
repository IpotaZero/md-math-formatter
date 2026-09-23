# Markdown Math Formatter

Markdown内の数式(`$...$` / `$$...$$`)だけを対象に、LaTeXの空白ルールを自動整形するVS Code拡張機能です。数式以外のテキストには一切手を加えません。

## 機能

コマンド実行、または保存時(デフォルトで有効)に、数式ブロックの中身を次のように整形します。

| Before | After |
| --- | --- |
| `$\alpha\beta$` | `$\alpha \beta$` |
| `$y\vee z$` | `$y \vee z$` |
| `$a=b$` | `$a = b$` |
| `$a:=b$` | `$a := b$` |
| `$a+b-c$` | `$a + b - c$` |
| `$f(a,b)$` | `$f(a, b)$` |
| `$( a )$` | `$(a)$` |
| `$x^ny$` | `$x^n y$` |
| `$a_ix$` | `$a_i x$` |
| `$\bigvee_{i \in I}f(a_i)$` | `$\bigvee_{i \in I} f(a_i)$` |

単項の符号(`x^{-1}`、`(-1)` など)や、`\ker(\phi)`・`\phi_*` のような正当な隣接表記は変更されません。

## 使い方

- コマンドパレットから `Markdown: 数式フォーマッタ` を実行する
- ショートカット `Alt+F`(macOSは `Option+F`)を使う
- Markdownファイルの保存時に自動整形する(設定でオフに可能)

## 拡張機能の設定

| 設定 | 説明 | デフォルト |
| --- | --- | --- |
| `mdMathFormatter.formatOnSave` | 保存時に数式ブロックを自動整形するかどうか | `true` |

## ライセンス

[MIT](LICENSE)
