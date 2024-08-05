class TypingGame {
    constructor() {
        this.patterns = [];
        this.currentPatternIndex = 0;
        this.currentKeyIndex = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        this.incorrectIndices = new Set();
        this.echoText = '';
        this.stepAccuracy = {};
        this.startTime = null; // Added
        this.handleInputBound = this.handleInput.bind(this);

        this.initializeElements();
        this.loadPatterns();
    }

    initializeElements() {
        this.targetDiv = document.getElementById('target');
        this.echoDiv = document.getElementById('echo');
        this.inputField = document.getElementById('input');
        this.patternCounterDiv = document.getElementById('pattern-counter');
        this.accuracyDisplayDiv = document.getElementById('accuracy-display');
        this.stepNameDiv = document.getElementById('step-name');
        this.speedDisplayDiv = document.getElementById('speed-display'); // Added
        this.menuDiv = document.getElementById('menu');
        this.menuStepsTbody = document.getElementById('menu-steps');

        document.addEventListener('click', () => this.inputField.focus());
    }

    async loadPatterns() {
        try {
            const response = await fetch('pattern.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.patterns = data.steps.flatMap(step => step.patterns.map(pattern => ({ pattern, stepname: step.stepname })));
            this.updateMenu();
            this.showMenu();
        } catch (error) {
            console.error('Error loading patterns:', error);
            let errorMessage = 'パターンの読み込み中にエラーが発生しました。';
            if (error instanceof SyntaxError) {
                errorMessage += '無効なデータ形式です。';
            } else if (error instanceof TypeError) {
                errorMessage += 'ネットワークエラーが発生しました。';
            }
            errorMessage += 'ページを再読み込みしてください。';
            alert(errorMessage);
        }
    }

    updateTarget() {
        const currentPattern = stringToArray(toHalfWidth(this.patterns[this.currentPatternIndex].pattern));
        const elements = [];

        for (let i = 0; i < currentPattern.length; i++) {
            if (i < this.currentKeyIndex) {
                elements.push(`<span class="char correct">${replaceSpaces(currentPattern[i])}</span>`);
            } else if (i === this.currentKeyIndex) {
                const className = this.incorrectIndices.has(i) ? 'char next incorrect' : 'char next';
                elements.push(`<span class="${className}">${replaceSpaces(currentPattern[i])}</span>`);
            } else {
                elements.push(`<span class="char">${replaceSpaces(currentPattern[i])}</span>`);
            }
        }

        this.targetDiv.innerHTML = elements.join('');
        this.updatePatternCounter();
        this.updateAccuracyDisplay();
        this.updateStepName();
        this.updateSpeedDisplay();
    }

    updatePatternCounter() {
        const stepPatterns = this.patterns.filter(p => p.stepname === this.patterns[this.currentPatternIndex].stepname);
        const stepPatternIndex = stepPatterns.findIndex(p => p.pattern === this.patterns[this.currentPatternIndex].pattern);
        this.patternCounterDiv.textContent = `パターン ${stepPatternIndex + 1} / ${stepPatterns.length}`;
    }

    updateAccuracyDisplay() {
        let accuracyText = '正答率: ー';
        if (this.totalCount > 0) {
            const accuracy = (this.correctCount / this.totalCount) * 100;
            accuracyText = `正答率: ${accuracy.toFixed(2)}%`;
        }
        this.accuracyDisplayDiv.textContent = accuracyText;
    }

    updateStepName() {
        const stepName = this.patterns[this.currentPatternIndex].stepname;
        this.stepNameDiv.textContent = stepName ? `ステップ: ${stepName}` : 'ステップ: ー';
    }

    saveStepAccuracy() {
        const stepname = this.patterns[this.currentPatternIndex - 1].stepname;
        const accuracy = (this.correctCount / this.totalCount) * 100;
        const newAccuracy = parseFloat(accuracy.toFixed(2));
        const elapsedTime = (Date.now() - this.startTime); // ステップ実行中の経過時間
        const keyPressTime = (elapsedTime/this.correctCount).toFixed(2); // 1キーの入力にかかる時間
        const keysPerMinute = (60*1000/keyPressTime).toFixed(2);    // 1分あたりのキー入力数
        this.startTime = null;

        // ローカルストレージから既存のデータを取得
        const savedAccuracy = JSON.parse(localStorage.getItem('stepAccuracy')) || {};

        // 新しい正確性が既存のデータより高い場合、または既存のデータがない場合のみ保存
        if (!savedAccuracy[stepname] || newAccuracy > parseFloat(savedAccuracy[stepname].accuracy)) {
            savedAccuracy[stepname] = {
                accuracy: newAccuracy.toString(),
                keysPerMinute: keysPerMinute.toString()
            };
            localStorage.setItem('stepAccuracy', JSON.stringify(savedAccuracy));
            
            // クラスのプロパティも更新
            this.stepAccuracy = savedAccuracy;
            
            // メニューを更新
            this.updateMenu();
        }
    }

    toggleElementVisibility(show, ...elements) {
        const method = show ? 'remove' : 'add';
        elements.forEach(el => el.classList[method]('hidden'));
    }

    showMenu() {
        this.toggleElementVisibility(false, this.targetDiv, this.echoDiv, this.inputField, this.patternCounterDiv, this.accuracyDisplayDiv, this.stepNameDiv, this.speedDisplayDiv, document.querySelector('h1'), document.querySelector('p'), document.getElementById('pattern-counter-container'));
        this.updateMenu(); // メニューを更新
        this.toggleElementVisibility(true, this.menuDiv);
        this.inputField.removeEventListener('input', this.handleInputBound);
    }

    hideMenu() {
        this.toggleElementVisibility(true, this.targetDiv, this.echoDiv, this.inputField, this.patternCounterDiv, this.accuracyDisplayDiv, this.stepNameDiv, this.speedDisplayDiv, document.querySelector('h1'), document.querySelector('p'), document.getElementById('pattern-counter-container'));
        this.toggleElementVisibility(false, this.menuDiv);
        this.inputField.removeEventListener('input', this.handleInputBound);
        this.inputField.addEventListener('input', this.handleInputBound);
        this.inputField.focus();
    }

    updateMenu() {
        const fragment = document.createDocumentFragment();
        const stepMap = new Map();

        // ローカルストレージから保存された正確性データを取得
        const savedAccuracy = JSON.parse(localStorage.getItem('stepAccuracy')) || {};

        this.patterns.forEach((pattern, index) => {
            if (!stepMap.has(pattern.stepname)) {
                stepMap.set(pattern.stepname, []);
            }
            stepMap.get(pattern.stepname).push(index);
        });

        // console.table(savedAccuracy);

        stepMap.forEach((indices, stepname) => {
            const tr = document.createElement('tr');
            const accuracy = savedAccuracy[stepname] ? `${savedAccuracy[stepname].accuracy}%` : 'ー';
            const speed = savedAccuracy[stepname] ? `${savedAccuracy[stepname].keysPerMinute} 文字/分` : 'ー';
            tr.innerHTML = `
                <td>${stepname}</td>
                <td>${speed}</td>
                <td>${accuracy}</td>
                <td>ー</td>
            `;
            tr.addEventListener('click', () => {
                this.currentPatternIndex = indices[0];
                this.currentStep = indices[0];
                this.correctCount = 0;
                this.totalCount = 0;
                this.incorrectIndices.clear();
                this.echoText = '';
                this.echoDiv.innerHTML = '<span class="cursor blink">|</span>';
                this.hideMenu();
                this.updateTarget();
                this.inputField.focus();
            });
            fragment.appendChild(tr);
        });

        this.menuStepsTbody.innerHTML = '';
        this.menuStepsTbody.appendChild(fragment);
    }

    handleInput() {
        if (!this.startTime) {
            this.startTime = Date.now(); // タイピング開始時間を記録
        }

        const inputValue = this.inputField.value;
        const currentPattern = stringToArray(toHalfWidth(this.patterns[this.currentPatternIndex].pattern));
        if (inputValue === currentPattern[this.currentKeyIndex]) {
            this.correctCount++;
            this.currentKeyIndex++;
            this.echoText += `<span class="char">${replaceSpaces(inputValue)}</span>`;
            this.inputField.value = '';
            this.incorrectIndices.delete(this.currentKeyIndex - 1);
        } else {
            this.incorrectIndices.add(this.currentKeyIndex);
        }
        this.totalCount++;
        this.echoDiv.innerHTML = this.echoText + `<span class="char">${replaceSpaces(this.inputField.value)}</span><span class="cursor blink">|</span>`;
        if (this.currentKeyIndex === currentPattern.length) {
            this.currentPatternIndex++;
            this.currentKeyIndex = 0;
            this.echoText = '';
            this.echoDiv.innerHTML = '<span class="cursor blink">|</span>';
            this.incorrectIndices.clear();
            if (this.currentPatternIndex === this.patterns.length || this.patterns[this.currentPatternIndex].stepname !== this.patterns[this.currentPatternIndex - 1].stepname) {
                this.saveStepAccuracy();
                this.showMenu();
                return;
            }
            this.updateTarget();
        }
        this.updateTarget();
        this.inputField.focus();
    }

    updateSpeedDisplay() {
        let keysPerMinute = '―';
        if (this.startTime) {
            const elapsedTime = (Date.now() - this.startTime); // ステップ実行中の経過時間
            const keyPressTime = this.correctCount > 2 ? 
            (elapsedTime/this.correctCount).toFixed(2) : 0; // 1キーの入力にかかる時間
            keysPerMinute = keyPressTime > 0 ? (60*1000/keyPressTime).toFixed(2) : '―';
        }
        this.speedDisplayDiv.textContent = `スピード: ${keysPerMinute} 文字/分`;
    }
}

// ゲームの初期化
const game = new TypingGame();

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