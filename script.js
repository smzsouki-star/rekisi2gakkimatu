// ==========================================================
// 1. グローバル定数と変数の定義
// ==========================================================

// 🚨注意: 外部JSONファイルへのパス
const JSON_FILE_PATH = 'questions.json'; 
// 一度に表示する問題数
const NUM_QUESTIONS_TO_ASK = 5; 

// クイズデータと状態管理
let questions = [];      // 読み込まれた全クイズデータ
let questionOrder = [];  // ランダムに選ばれた問題のインデックス配列
let currentQuestionIndex = 0; // 現在何問目か (0から始まる)
let correctCount = 0;   // 正解数 (リザルト画面用)
let totalAnswered = 0;  // 解答数 (問題数と同じ)

// DOM要素の取得
const dom_questionNumber = document.getElementById('question-number');
const dom_questionText = document.getElementById('question-text');
const dom_optionsArea = document.getElementById('options-area');
const dom_explanationArea = document.getElementById('explanation-area');
const dom_resultMessage = document.getElementById('result-message');
const dom_correctAnswerText = document.getElementById('correct-answer');
const dom_explanationText = document.getElementById('explanation-text');


// ==========================================================
// 2. 初期処理とデータ取得
// ==========================================================

window.onload = function() {
    fetchQuestions();
};

/**
 * 外部JSONファイルからクイズデータを非同期で読み込む
 */
function fetchQuestions() {
    dom_questionNumber.textContent = `データ読み込み中...`;
    
    fetch(JSON_FILE_PATH)
        .then(response => response.json())
        .then(data => {
            questions = data;
            if (questions.length === 0) {
                dom_questionText.textContent = "エラー: クイズデータが空です。";
                return;
            }
            initializeQuiz();
        })
        .catch(e => {
            console.error("クイズデータの取得に失敗しました。", e);
            dom_questionText.textContent = `エラー: データを読み込めませんでした。`;
        });
}

/**
 * クイズの出題順序を決定し、最初の問題を表示する
 */
function initializeQuiz() {
    questionOrder = Array.from({ length: questions.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(questions.length, NUM_QUESTIONS_TO_ASK));

    currentQuestionIndex = 0;
    correctCount = 0; // セッションごとにリセット
    totalAnswered = questionOrder.length; // 出題数を設定
    loadQuestion();
}


// ==========================================================
// 3. 問題の表示処理
// ==========================================================

/**
 * 現在の問題を出題画面に表示し、ページ上部に戻る
 */
function loadQuestion() {
    if (currentQuestionIndex >= questionOrder.length) {
        showQuizEnd();
        return;
    }

    const qIndex = questionOrder[currentQuestionIndex];
    const currentQ = questions[qIndex];

    // 画面をリセット
    dom_explanationArea.style.display = 'none';
    dom_explanationArea.style.opacity = '0'; 

    dom_questionNumber.textContent = `第 ${currentQuestionIndex + 1} 問 (全 ${questionOrder.length} 問中)`;
    dom_questionText.textContent = currentQ.q;
    
    // 選択肢の生成
    dom_optionsArea.innerHTML = '';
    const shuffledOptions = currentQ.options.sort(() => Math.random() - 0.5);

    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = option;
        button.onclick = () => checkAnswer(option);
        dom_optionsArea.appendChild(button);
    });

    // ページ最上部に戻る
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ==========================================================
// 4. 解答チェックと自動スクロール
// ==========================================================

/**
 * 選択された解答をチェックし、解説を表示する
 * @param {string} selectedOption ユーザーが選択した選択肢のテキスト
 */
function checkAnswer(selectedOption) {
    const qIndex = questionOrder[currentQuestionIndex];
    const currentQ = questions[qIndex];

    // 1. 判定とスコア更新
    const isCorrect = selectedOption === currentQ.a;
    if (isCorrect) {
        correctCount++; 
    }
    
    dom_resultMessage.textContent = isCorrect ? '✅ 正解です！' : '❌ 不正解です...';
    dom_resultMessage.className = isCorrect ? 'correct' : 'incorrect';

    // 2. ボタンの無効化と色付け
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('correct', 'incorrect'); 
        
        if (btn.textContent === currentQ.a) {
            btn.classList.add('correct'); 
        } else if (btn.textContent === selectedOption) {
            btn.classList.add('incorrect'); 
        }
    });

    // 3. 解説の表示
    dom_correctAnswerText.textContent = `正解: ${currentQ.a}`;
    dom_explanationText.textContent = `解説: ${currentQ.explanation}`;
    dom_explanationArea.style.display = 'block';

    // 4. 次の問題へのインデックスを更新
    currentQuestionIndex++;
    
    // 5. 💡 自動スクロール処理 (安定版)
    setTimeout(() => {
        dom_explanationArea.style.opacity = '1';
        dom_explanationArea.scrollIntoView({
            behavior: 'smooth', 
            block: 'start'      // 要素の最上端にスクロール
        });
    }, 100); 
}


// ==========================================================
// 5. クイズ終了処理
// ==========================================================

/**
 * クイズ終了画面を表示し、結果をフィードバックする
 */
function showQuizEnd() {
    const quizContainer = document.getElementById('quiz-container');
    
    // 正答率の計算
    const percentage = (correctCount / totalAnswered) * 100;
    const roundedPercentage = Math.round(percentage);
    
    let resultTitle = 'お疲れ様でしたｗｗ';
    let resultMessage = 'またの挑戦をお待ちしていますｗｗ';
    let commentClass = 'end-basic';

    if (roundedPercentage === 100) {
        resultTitle = '🎉 満点達成！YDP授与！ 🎉';
        resultMessage = '歴史総合の知識は完璧です！';
        commentClass = 'end-perfect';
    } else if (roundedPercentage >= 80) {
        resultTitle = '🏆 素晴らしい結果です！ 🏆';
        resultMessage = 'あと少しで満点！次は全問正解を目指しましょう。';
        commentClass = 'end-great';
    } else if (roundedPercentage >= 50) {
        resultTitle = '👍 半分以上正解です！ 👍　半分だけだけど！！';
        resultMessage = 'この調子で弱点を克服していきましょう！';
        commentClass = 'end-good';
    }

    quizContainer.innerHTML = `
        <div id="result-screen" class="${commentClass}">
            <h2 class="result-title">${resultTitle}</h2>
            <div class="score-display">
                <p>あなたの正解率</p>
                <p class="score-percentage">${roundedPercentage}%</p>
                <p class="score-detail">${correctCount}問 / 全${totalAnswered}問正解</p>
            </div>
            <p class="result-message">${resultMessage}</p>
            <button onclick="window.location.reload()" class="restart-button">最初からやり直す</button>
        </div>
    `;

    // ページ最上部に戻る
    window.scrollTo({ top: 0, behavior: 'smooth' });
}