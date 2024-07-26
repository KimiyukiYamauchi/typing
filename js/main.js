/**
 * 文字列を1文字ずつの要素の配列に変換する関数
 * @param {string} str - 変換する文字列
 * @returns {string[]} - 1文字ずつの要素の配列
 */
function stringToArray(str) {
    return str.split('');
}

/**
 * 全角文字列を半角文字列に変換する関数
 * @param {string} str - 変換する全角文字列
 * @returns {string} - 半角文字列
 */
function toHalfWidth(str) {
    return str.replace(/[！-～]/g, function (char) {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' ');
}

/**
 * 半角スペースを見える文字に変換する関数
 * @param {string} str - 変換する文字列
 * @returns {string} - 見える文字に変換された文字列
 */
function replaceSpaces(str) {
    return str.replace(/ /g, '█');
}

let patterns = [];
let currentPatternIndex = 0;
let currentKeyIndex = 0;
let correctCount = 0;
let totalCount = 0;
let incorrectIndices = new Set();
let echoText = '';

const targetDiv = document.getElementById('target');
const echoDiv = document.getElementById('echo'); // 新しいdivを取得
const inputField = document.getElementById('input');
const resultDiv = document.getElementById('result');
const patternCounterDiv = document.getElementById('pattern-counter'); // パターンカウンターのdivを取得
const accuracyDisplayDiv = document.getElementById('accuracy-display'); // 正解率表示エリアを取得

function updateTarget() {
    const currentPattern = stringToArray(toHalfWidth(patterns[currentPatternIndex]));
    const completed = currentPattern.slice(0, currentKeyIndex).map((char, index) => {
        return `<span class="char correct">${replaceSpaces(char)}</span>`;
    }).join('');
    const nextChar = currentPattern[currentKeyIndex] ? 
                        (incorrectIndices.has(currentKeyIndex) ? 
                            `<span class="char next incorrect">${replaceSpaces(currentPattern[currentKeyIndex])}</span>`
                             : `<span class="char next">${replaceSpaces(currentPattern[currentKeyIndex])}</span>`)
                             : '';
    const remaining = currentPattern.slice(currentKeyIndex + 1).map(char => `<span class="char">${replaceSpaces(char)}</span>`).join('');
    targetDiv.innerHTML = `${completed}${nextChar}${remaining}`;
    updatePatternCounter(); // パターンカウンターを更新
    updateAccuracyDisplay(); // 正解率表示を更新
}

function updatePatternCounter() {
    patternCounterDiv.textContent = `パターン ${currentPatternIndex + 1} / ${patterns.length}`;
}

function updateAccuracyDisplay() {
    let accuracyText = '正答率: ー';
    if (totalCount > 0) {
        const accuracy = (correctCount / totalCount) * 100;
        accuracyText = `正答率: ${accuracy.toFixed(2)}%`;
    }
    accuracyDisplayDiv.textContent = accuracyText;
}

function showFinalResult() {
    const accuracy = (correctCount / totalCount) * 100;
    resultDiv.innerHTML = `基本入力練習 -英字小文字のみ- :<br>正答率 ${accuracy.toFixed(2)}%`;
    targetDiv.classList.add('hidden'); // #targetを非表示にする
    echoDiv.classList.add('hidden'); // #echoを非表示にする
    inputField.classList.add('hidden'); // #inputを非表示にする
    patternCounterDiv.classList.add('hidden'); // #pattern-counterを非表示にする
    accuracyDisplayDiv.classList.add('hidden'); // 正解率表示エリアを非表示にする
    document.querySelector('h1').classList.add('hidden'); // タイトルを非表示にする
    document.querySelector('p').classList.add('hidden'); // 注意事項を非表示にする
    inputField.removeEventListener('input', handleInput); // キー入力を受け付けないようにする
}

function handleInput() {
    const inputValue = inputField.value;
    const currentPattern = stringToArray(toHalfWidth(patterns[currentPatternIndex]));
    // console.log(inputValue, currentPattern[currentKeyIndex]);
    if (inputValue === currentPattern[currentKeyIndex]) {
        correctCount++;
        currentKeyIndex++;
        echoText += `<span class="char">${replaceSpaces(inputValue)}</span>`; // 正解の場合にエコーバックテキストを追加
        inputField.value = ''; // 正解の場合にのみクリア
        incorrectIndices.delete(currentKeyIndex - 1); // 正解したら間違いインデックスを削除
    } else {
        incorrectIndices.add(currentKeyIndex); // 間違いインデックスを追加
    }
    echoDiv.innerHTML = echoText + `<span class="char">${replaceSpaces(inputField.value)}</span><span class="cursor">|</span>`; // 入力値をエコーバック
    totalCount++;
    if (currentKeyIndex === currentPattern.length) {
        currentPatternIndex++;
        currentKeyIndex = 0;
        echoText = ''; // 新しいパターンに進むときにエコーバックテキストをクリア
        echoDiv.innerHTML = '<span class="cursor">|</span>'; // 新しいパターンに進むときにエコーバックをクリアし、アンダースコアを表示
        incorrectIndices.clear(); // 新しいパターンに進むときにクリア
        if (currentPatternIndex === patterns.length) {
            showFinalResult();
            return;
        }
    }
    updateTarget();
    inputField.focus(); // 入力フィールドにフォーカスを戻す
}

inputField.addEventListener('input', handleInput);

// 画面をクリックするとinputにフォーカスする処理を追加
document.addEventListener('click', () => {
    inputField.focus();
});

// pattern.jsonファイルからデータを取得
fetch('pattern.json')
    .then(response => response.json())
    .then(data => {
        patterns = data.patterns;
        updateTarget();
        echoDiv.innerHTML = '<span class="cursor">_</span>'; // 最初のパターンが表示されるタイミングでアンダースコアを表示
        updatePatternCounter(); // 最初のパターンが表示されるタイミングでパターンカウンターを更新
        updateAccuracyDisplay(); // 最初のパターンが表示されるタイミングで正解率表示を更新
    })
    .catch(error => console.error('Error loading patterns:', error));

updateTarget();
echoDiv.innerHTML = '<span class="cursor">|</span>'; // 最初のパターンが表示されるタイミングでアンダースコアを表示
updatePatternCounter(); // 最初のパターンが表示されるタイミングでパターンカウンターを更新
updateAccuracyDisplay(); // 最初のパターンが表示されるタイミングで正解率表示を更新