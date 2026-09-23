const test = require("node:test")
const assert = require("node:assert/strict")

const { MathExpressionFormatter, MarkdownMathFormatter } = require("../mathFormatter")

// MathExpressionFormatter は「数式の中身($ / $$ を含まない文字列)」を受け取る。
// 区切り文字の付与・除去は MarkdownMathFormatter の責務なので、ここでは中身だけを扱う。
const mathFormatter = new MathExpressionFormatter()
const formatMath = (text) => mathFormatter.format(text)

test("spaceAfterCommand: コマンドの直後にコマンドや数字が続く場合はスペースを挿入する", () => {
    assert.equal(formatMath("\\alpha\\beta"), "\\alpha \\beta")
    assert.equal(formatMath("\\log2"), "\\log 2")
})

test("spaceBeforeCommand: 文字・数字等の直後にコマンドが続く場合は前にスペースを挿入する", () => {
    assert.equal(formatMath("y\\vee z"), "y \\vee z")
})

test("spaceBeforeCommand: ( { [ _ ^ \\ 空白の直後は対象外", () => {
    assert.equal(formatMath("\\ker"), "\\ker")
    assert.equal(formatMath("\\ker(\\phi)"), "\\ker(\\phi)")
    assert.equal(formatMath("\\phi_*"), "\\phi_*")
})

test("spaceAfterBracedSubSuperscript: _{...} や ^{...} の直後に文字・コマンドが続く場合はスペースを挿入する", () => {
    assert.equal(formatMath("\\bigvee_{i \\in I}f(a_i)"), "\\bigvee_{i \\in I} f(a_i)")
})

test("spaceAfterBracedSubSuperscript: 1階層までのネストした波括弧も安全に扱える", () => {
    assert.equal(formatMath("x_{i \\in \\{1, 2\\}}y"), "x_{i \\in \\{1, 2\\}} y")
})

test("spaceAfterSingleCharSubSuperscript: 波括弧なしの ^x / _x の直後に文字が続く場合はスペースを挿入する", () => {
    assert.equal(formatMath("x^ny"), "x^n y")
    assert.equal(formatMath("a_ix"), "a_i x")
})

test("spaceAfterSingleCharSubSuperscript: 波括弧なしの上付き・下付きは直後の1文字にしか掛からない", () => {
    // LaTeXの仕様通り、^ の直後の1文字だけが上付きになり、残りは通常の文字として扱われる
    assert.equal(formatMath("x^abc"), "x^a bc")
})

test("spaceAfterSingleCharSubSuperscript: 直後がコマンドの場合もスペースを挿入する", () => {
    assert.equal(formatMath("x^n\\alpha"), "x^n \\alpha")
})

test("spaceAfterSingleCharSubSuperscript: 直後に文字が続かない場合は変化しない", () => {
    assert.equal(formatMath("x^n"), "x^n")
    assert.equal(formatMath("a_i"), "a_i")
    assert.equal(formatMath("x^n+y"), "x^n + y")
})

test("spaceAroundEquals: = と := の左右にスペースを挿入・整形する", () => {
    assert.equal(formatMath("a=b"), "a = b")
    assert.equal(formatMath("a:=b"), "a := b")
    assert.equal(formatMath("a  =  b"), "a = b")
})

// スペース入れた方がいいけど別に使わないから放置してるだけ。
test("spaceAroundEquals: != <= >= == のような複合演算子は壊さない", () => {
    assert.equal(formatMath("a!=b"), "a!=b")
    assert.equal(formatMath("a<=b"), "a<=b")
    assert.equal(formatMath("a==b"), "a==b")
})

test("spaceAroundArithmeticOperators: 二項演算子の左右にスペースを挿入する", () => {
    assert.equal(formatMath("a+b"), "a + b")
    assert.equal(formatMath("a-b"), "a - b")
    assert.equal(formatMath("a*b"), "a * b")
    assert.equal(formatMath("a/b"), "a / b")
})

test("spaceAroundArithmeticOperators: 単項の符号(-)はスペースを挿入しない", () => {
    assert.equal(formatMath("x^{-1}"), "x^{-1}")
    assert.equal(formatMath("(-1)"), "(-1)")
    assert.equal(formatMath("-x"), "-x")
    assert.equal(formatMath("f(x,-y)"), "f(x, -y)")
})

test("spaceAroundArithmeticOperators: 二項演算子の後にコマンドが続く場合もスペースを挿入する", () => {
    assert.equal(formatMath("a+\\alpha"), "a + \\alpha")
})

test("spaceAfterPunctuation: , ; : の直後にスペースがなければ挿入する", () => {
    assert.equal(formatMath("f(a,b)"), "f(a, b)")
    assert.equal(formatMath("a;b"), "a; b")
    assert.equal(formatMath("a:b"), "a: b")
})

test("spaceAfterPunctuation: := のコロンは壊さない", () => {
    assert.equal(formatMath("a:=b"), "a := b")
})

test("collapseConsecutiveSpaces: 連続する半角スペースは1つに圧縮する", () => {
    assert.equal(formatMath("a    b"), "a b")
})

test("trimSpaceAfterOpenParen / trimSpaceBeforeCloseParen: 丸括弧の内側の余分なスペースを除去する", () => {
    assert.equal(formatMath("( a )"), "(a)")
})

test("trimSpaceAfterOpenBracket / trimSpaceBeforeCloseBracket: 角括弧の内側の余分なスペースを除去する", () => {
    assert.equal(formatMath("[ a ]"), "[a]")
})

test("trimSpaceAfterOpenBrace / trimSpaceBeforeCloseBrace: 波括弧の内側の余分なスペースを除去する", () => {
    assert.equal(formatMath("{ a }"), "{a}")
})

test("エスケープされた \\( \\) \\[ \\] \\{ \\} は対象外", () => {
    assert.equal(formatMath("\\( a \\)"), "\\( a \\)")
    assert.equal(formatMath("\\[ a \\]"), "\\[ a \\]")
    assert.equal(formatMath("\\{ a \\}"), "\\{ a \\}")
})

test("trimSpaceAfterSubSuperscript: ^ と _ の直後のスペースを除去する", () => {
    assert.equal(formatMath("x^ 2"), "x^2")
    assert.equal(formatMath("x_ i"), "x_i")
})

test("trimLeadingSpace / trimTrailingSpace: 数式内容の先頭・末尾のスペースを除去する", () => {
    assert.equal(formatMath(" a "), "a")
})

test("既に整形済みの数式はそのまま変化しない(冪等性)", () => {
    const formatted = "a + b = c"
    assert.equal(formatMath(formatted), formatted)
})

test("MarkdownMathFormatter: 数式ブロック以外のテキストは変更しない", () => {
    const markdown = "これは a=b のような文章中のテキストです。"
    const formatter = new MarkdownMathFormatter()
    assert.equal(formatter.format(markdown), markdown)
})

test("MarkdownMathFormatter: インライン数式($...$)を整形する", () => {
    const formatter = new MarkdownMathFormatter()
    assert.equal(formatter.format("式は$a=b$です。"), "式は$a = b$です。")
})

test("MarkdownMathFormatter: ディスプレイ数式($$...$$、複数行含む)を整形する", () => {
    const formatter = new MarkdownMathFormatter()
    const input = "$$\na+b=c\n$$"
    const output = formatter.format(input)
    assert.equal(output, "$$\na + b = c\n$$")
})

test("MarkdownMathFormatter: 1つの文書内に複数の数式ブロックがあってもそれぞれ独立して整形する", () => {
    const formatter = new MarkdownMathFormatter()
    const input = "まず$a=b$、次に$$c=d$$です。"
    const output = formatter.format(input)
    assert.equal(output, "まず$a = b$、次に$$c = d$$です。")
})

test("MarkdownMathFormatter: 数式の先頭・末尾のスペースは区切り文字の外側ではなく中身から除去される", () => {
    const formatter = new MarkdownMathFormatter()
    assert.equal(formatter.format("$ a + b $"), "$a + b$")
    assert.equal(formatter.format("$$ a + b $$"), "$$a + b$$")
})
