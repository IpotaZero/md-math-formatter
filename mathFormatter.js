// vscode API に依存しない純粋なロジック。
// extension.js から requrie され、Node.js 単体でも(テストからも)動作する。

/**
 * 数式(LaTeX)整形における1つのルールを表す。
 * 「正規表現にマッチした部分を置換する」という単一責務のみを持つ。
 */
class FormattingRule {
    constructor(name, pattern, replacement) {
        this.name = name
        this.pattern = pattern
        this.replacement = replacement
    }

    apply(text) {
        return text.replace(this.pattern, this.replacement)
    }
}

/**
 * 数式の「中身」(区切り文字 $ / $$ を含まない文字列)1つに対して、
 * 登録された整形ルールを先頭から順番に適用するフォーマッタ。
 * ルールを増減させたいときは rules 配列を編集するだけでよい。
 *
 * $ / $$ は Markdown 側の数式区切り文字であり、このクラスの関心事ではない。
 * 区切り文字の抽出・復元は呼び出し側(MarkdownMathFormatter)の責務とする。
 */
class MathExpressionFormatter {
    constructor() {
        this.rules = [
            // 1. コマンドの直後に「別のコマンド(\)」または「数字」がある場合にスペース挿入 (\alpha\beta -> \alpha \beta)
            new FormattingRule("spaceAfterCommand", /(\\[a-zA-Z]+(?![a-zA-Z]))(?=[\\0-9])/g, "$1 "),

            // 2. 変数・数字・演算子・閉じ括弧等の直後に「コマンド(\)」がある場合に前にスペース挿入 (y\vee -> y \vee)
            // ※ただし ( { [ _ ^ \ 空白 の直後は除外 (\ker(\phi) や \phi_* を保持)
            new FormattingRule("spaceBeforeCommand", /([^\{\[\(\_\^\s\\])(\\[a-zA-Z]+(?![a-zA-Z]))/g, "$1 $2"),

            // 3. _{...} または ^{...} の直後に「コマンド」または「文字」が続く場合、スペースを挿入
            // 例: \bigvee_{i \in I}f(a_i) -> \bigvee_{i \in I} f(a_i)
            // ※ (?:[^{}]|\{[^{}]*\})* により、1階層までの波括弧のネスト(例: _{i \in \{1, 2\}})を許容して安全にマッチさせます。
            new FormattingRule("spaceAfterBracedSubSuperscript", /([_^]\{(?:[^{}]|\{[^{}]*\})*\})(?=[a-zA-Z\\])/g, "$1 "),

            // 3b. _x や ^x (波括弧なしの上付き・下付き文字1つ)の直後に「文字」または「コマンド」が続く場合、スペースを挿入
            // 例: x^ny -> x^n y, a_ix -> a_i x
            // ※ LaTeXでは波括弧なしの ^ _ は直後の1文字にしか掛からないため、2文字目以降は別の文字として扱われる。
            //   よって x^abc は x^a bc(a だけが上付き)として整形するのが正しい。
            new FormattingRule("spaceAfterSingleCharSubSuperscript", /([_^][A-Za-z0-9])(?=[A-Za-z\\])/g, "$1 "),

            // 4. = および := の左右にスペースを挿入・整形 (a=b -> a = b, a:=b -> a := b)
            new FormattingRule("spaceAroundEquals", /(?<=\S)\s*(:=|(?<![!<>=:])=(?!=))\s*(?=\S)/g, " $1 "),

            // 5. 二項演算子(+ - * /)の左右にスペースを挿入・整形 (a+b -> a + b, a-b -> a - b)
            // ※ 単項の符号(-1, x^{-1}, (-y) など)は左右どちらかがオペランドでないため対象外
            //   オペランド: 英数字・閉じ括弧(}, ), ])。エスケープされた \+ \- \* \/ も対象外。
            new FormattingRule(
                "spaceAroundArithmeticOperators",
                /(?<=[A-Za-z0-9}\)\]])\s*(?<!\\)([+\-*/])\s*(?=[A-Za-z0-9\\{(\[])/g,
                " $1 "
            ),

            // 6. コンマ(,)・セミコロン(;)・コロン(:)の直後にスペースがない場合、半角スペースを挿入
            // ※ := のコロンを壊さないよう (?:(?!=)) で保護
            new FormattingRule("spaceAfterPunctuation", /(,|;|:(?!=))(?=[^\s])/g, "$1 "),

            // 7. 半角スペースが2つ以上連続している箇所を1つに圧縮
            // ※タブ・改行は対象外(表示数式の意図的な改行を壊さないため)
            new FormattingRule("collapseConsecutiveSpaces", / {2,}/g, " "),

            // 8a. 開き丸括弧の直後のスペースを除去 ( ( a ) -> (a )
            // ※ \( はLaTeXのエスケープされた文字なので対象外
            new FormattingRule("trimSpaceAfterOpenParen", /(?<!\\)\( +/g, "("),

            // 8b. 閉じ丸括弧の直前のスペースを除去 ( a ) -> a)
            // ※ \) はLaTeXのエスケープされた文字なので対象外
            new FormattingRule("trimSpaceBeforeCloseParen", / +(?<!\\)\)/g, ")"),

            // 8c. 開き角括弧の直後のスペースを除去 [ a ] -> [a
            // ※ \[ はLaTeXのエスケープされた文字なので対象外
            new FormattingRule("trimSpaceAfterOpenBracket", /(?<!\\)\[ +/g, "["),

            // 8d. 閉じ角括弧の直前のスペースを除去 a ] -> a]
            // ※ \] はLaTeXのエスケープされた文字なので対象外
            new FormattingRule("trimSpaceBeforeCloseBracket", / +(?<!\\)\]/g, "]"),

            // 8e. 開き波括弧の直後のスペースを除去 { a } -> {a
            // ※ \{ はLaTeXのエスケープされた文字(集合の中括弧など)なので対象外
            new FormattingRule("trimSpaceAfterOpenBrace", /(?<!\\)\{ +/g, "{"),

            // 8f. 閉じ波括弧の直前のスペースを除去 a } -> a}
            // ※ \} はLaTeXのエスケープされた文字(集合の中括弧など)なので対象外
            new FormattingRule("trimSpaceBeforeCloseBrace", / +(?<!\\)\}/g, "}"),

            // 8g. 上付き(^)・下付き(_)の直後のスペースを除去 (x^ 2 -> x^2, x_ i -> x_i)
            new FormattingRule("trimSpaceAfterSubSuperscript", /([_^]) +/g, "$1"),

            // 9a. 数式内容の先頭のスペースを除去
            new FormattingRule("trimLeadingSpace", /^ +/, ""),

            // 9b. 数式内容の末尾のスペースを除去
            new FormattingRule("trimTrailingSpace", / +$/, ""),
        ]
    }

    format(mathContent) {
        return this.rules.reduce((text, rule) => rule.apply(text), mathContent)
    }
}

/**
 * Markdown文書全体を受け取り、中に含まれる数式ブロック($...$ / $$...$$)を検出し、
 * 区切り文字を取り除いた「中身」だけを MathExpressionFormatter に渡して整形、
 * 整形後に区切り文字を付け直して返す。コマンド実行時・保存時の両方から使う。
 *
 * 区切り文字($ / $$)の扱いはこのクラスの責務であり、MathExpressionFormatter に
 * 漏らさないことで、後者は「数式の中身の整形」だけに集中できる。
 */
class MarkdownMathFormatter {
    constructor() {
        // 1グループ目: $$...$$ の中身 / 2グループ目: $...$ の中身(いずれか一方のみマッチする)
        this.mathBlockRegex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g
        this.mathContentFormatter = new MathExpressionFormatter()
    }

    format(markdownText) {
        return markdownText.replace(this.mathBlockRegex, (_match, displayContent, inlineContent) => {
            const isDisplayMath = displayContent !== undefined
            const delimiter = isDisplayMath ? "$$" : "$"
            const content = isDisplayMath ? displayContent : inlineContent
            const formattedContent = this.mathContentFormatter.format(content)
            return `${delimiter}${formattedContent}${delimiter}`
        })
    }
}

module.exports = {
    FormattingRule,
    MathExpressionFormatter,
    MarkdownMathFormatter,
}
