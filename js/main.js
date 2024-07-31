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

// パターンの配列
let patterns = [];

// 現在のパターンのインデックス
let currentPatternIndex = 0;

// 現在のキーのインデックス
let currentKeyIndex = 0;

// 正解数
let correctCount = 0;

// 総入力数
let totalCount = 0;

// 間違いインデックスのセット
let incorrectIndices = new Set();

// エコーバックテキスト
let echoText = '';

// ステップサイズ
let stepSize = 2; // debug

// 現在のステップ
let currentStep = 0;

// ステップごとの正解率を管理するオブジェクト
let stepAccuracy = {};

const targetDiv = document.getElementById('target');
const echoDiv = document.getElementById('echo'); // 新しいdivを取得
const inputField = document.getElementById('input');
const patternCounterDiv = document.getElementById('pattern-counter'); // パターンカウンターのdivを取得
const accuracyDisplayDiv = document.getElementById('accuracy-display'); // 正解率表示エリアを取得
const stepNameDiv = document.getElementById('step-name'); // ステップ名表示エリアを取得
const patternCounterContainer = document.getElementById('pattern-counter-container');

const menuDiv = document.getElementById('menu');
const menuStepsTbody = document.getElementById('menu-steps');

function updateTarget() {
    const currentPattern = stringToArray(toHalfWidth(patterns[currentPatternIndex].pattern));
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
    updateStepName(); // ステップ名を更新
}

function updatePatternCounter() {
    const stepPatterns = patterns.filter(p => p.stepname === patterns[currentPatternIndex].stepname);
    const stepPatternIndex = stepPatterns.findIndex(p => p.pattern === patterns[currentPatternIndex].pattern);
    patternCounterDiv.textContent = `パターン ${stepPatternIndex + 1} / ${stepPatterns.length}`;
}

function updateAccuracyDisplay() {
    let accuracyText = '正答率: ー';
    if (totalCount > 0) {
        const accuracy = (correctCount / totalCount) * 100;
        accuracyText = `正答率: ${accuracy.toFixed(2)}%`;
    }
    accuracyDisplayDiv.textContent = accuracyText;
}

function updateStepName() {
    const stepName = patterns[currentPatternIndex].stepname;
    stepNameDiv.textContent = stepName ? `ステップ: ${stepName}` : 'ステップ: ー';
}

function saveStepAccuracy() {
    const stepname = patterns[currentPatternIndex - 1].stepname;
    const accuracy = (correctCount / totalCount) * 100;
    stepAccuracy[stepname] = accuracy.toFixed(2);
    localStorage.setItem('stepAccuracy', JSON.stringify(stepAccuracy));
}

function showMenu() {
    menuDiv.classList.remove('hidden');
    targetDiv.classList.add('hidden');
    echoDiv.classList.add('hidden');
    inputField.classList.add('hidden');
    patternCounterDiv.classList.add('hidden');
    accuracyDisplayDiv.classList.add('hidden');
    stepNameDiv.classList.add('hidden');
    document.querySelector('h1').classList.add('hidden');
    document.querySelector('p').classList.add('hidden');
    document.getElementById('pattern-counter-container').classList.add('hidden');
}

function hideMenu() {
    menuDiv.classList.add('hidden');
    targetDiv.classList.remove('hidden');
    echoDiv.classList.remove('hidden');
    inputField.classList.remove('hidden');
    patternCounterDiv.classList.remove('hidden');
    accuracyDisplayDiv.classList.remove('hidden');
    stepNameDiv.classList.remove('hidden');
    document.querySelector('h1').classList.remove('hidden');
    document.querySelector('p').classList.remove('hidden');
    document.getElementById('pattern-counter-container').classList.remove('hidden');
    inputField.addEventListener('input', handleInput);
}

function updateMenu() {
    menuStepsTbody.innerHTML = '';
    const stepMap = new Map();

    patterns.forEach((pattern, index) => {
        if (!stepMap.has(pattern.stepname)) {
            stepMap.set(pattern.stepname, []);
        }
        stepMap.get(pattern.stepname).push(index);
    });

    stepMap.forEach((indices, stepname) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stepname}</td>
            <td>ー</td>
            <td>ー</td>
            <td>ー</td>
        `;
        tr.addEventListener('click', () => {
            currentPatternIndex = indices[0];
            currentStep = indices[0];
            correctCount = 0;
            totalCount = 0;
            incorrectIndices.clear();
            echoText = '';
            echoDiv.innerHTML = '<span class="cursor blink">|</span>';
            hideMenu();
            updateTarget();
            inputField.focus(); // フォーカスをinputフィールドに移動
        });
        menuStepsTbody.appendChild(tr);
    });
}

// 画面をクリックするとinputにフォーカスする処理を追加
document.addEventListener('click', () => {
    inputField.focus();
});

// inputがフォーカスを得たときにcursorクラスを追加
inputField.addEventListener('focus', () => {
    document.querySelector('.cursor').classList.add('blink');
});

// inputがフォーカスを失ったときにcursorクラスを削除
inputField.addEventListener('blur', () => {
    document.querySelector('.cursor').classList.remove('blink');
});

function handleInput() {
    const inputValue = inputField.value;
    const currentPattern = stringToArray(toHalfWidth(patterns[currentPatternIndex].pattern));
    if (inputValue === currentPattern[currentKeyIndex]) {
        correctCount++;
        currentKeyIndex++;
        echoText += `<span class="char">${replaceSpaces(inputValue)}</span>`;
        inputField.value = '';
        incorrectIndices.delete(currentKeyIndex - 1);
    } else {
        incorrectIndices.add(currentKeyIndex);
    }
    totalCount++;
    echoDiv.innerHTML = echoText + `<span class="char">${replaceSpaces(inputField.value)}</span><span class="cursor blink">|</span>`; // 入力値をエコーバック
    if (currentKeyIndex === currentPattern.length) {
        currentPatternIndex++;
        currentKeyIndex = 0;
        echoText = '';
        echoDiv.innerHTML = '<span class="cursor blink">|</span>';
        incorrectIndices.clear();
        if (currentPatternIndex === patterns.length || patterns[currentPatternIndex].stepname !== patterns[currentPatternIndex - 1].stepname) {
            saveStepAccuracy();
            inputField.removeEventListener('input', handleInput);
            showMenu();
            return;
        }
        updateTarget();
    }
    updateTarget();
    inputField.focus();
}

// pattern.jsonファイルからデータを取得
fetch('pattern.json')
    .then(response => response.json())
    .then(data => {
        patterns = data.steps.flatMap(step => step.patterns.map(pattern => ({ pattern, stepname: step.stepname })));
        updateMenu();
        showMenu();
    })
    .catch(error => console.error('Error loading patterns:', error));