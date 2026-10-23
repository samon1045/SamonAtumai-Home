const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('command-input');

function appendOutput(text, className = '') {
  const div = document.createElement('div');
  div.className = `output-line ${className}`;
  div.textContent = text;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

function appendHtml(htmlContent) {
  const div = document.createElement('div');
  div.className = 'output-line';
  div.innerHTML = htmlContent;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

let history = [];
let historyIndex = -1;
let accessAutoTimer = null; // 自動アクセスチェックタイマー

commandInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const rawInput = commandInput.value.trim();
    if (!rawInput) return;

    history.push(rawInput);
    historyIndex = history.length;

    appendHtml(`<span style="color: #cccccc;">PS C:\\WINDOWS\\system32></span> ${escapeHtml(rawInput)}`);
    commandInput.value = '';

    const parts = rawInput.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' '); // 引数の結合

    let result = '';

    switch (cmd) {
      case 'help':
        result = `=== [ 利用可能なコマンド一覧 ] ===
・top            : パソコンのシステム情報を表示
・news           : 最新のニュースを15件表示
・weather        : 本日の天気予報を表示
・time           : 現在の時間を表示
・access         : パソコンへのアクセスや不審なイベント履歴を表示
・access auto    : 10分に1回自動でアクセスログをチェック
・access stop    : 自動アクセスチェックを停止
・ping <Target>  : 指定したIP/ドメインへPing疎通テストを実行
・process / ps   : CPU使用率の高いプロセスTOP10を表示
・whoami         : 現在のログインユーザー情報を表示
・uptime         : パソコンの稼働時間（起動からの経過時間）を表示
・calc <計算式>  : 簡易計算を実行 (例: calc 128 * 4)
・echo <文字>    : 入力した文字を画面に出力
・base64 <文字列>: 文字列をBase64変換/復元 (例: base64 Hello または base64 -d SGVsbG8=)
・random <小> <大>: 指定範囲のランダムな数字を生成
・apikey         : i-<ランダム数字> 形式のAPIキーを自動生成
・history        : 実行したコマンドの履歴一覧を表示
・stop all       : すべてのバックグラウンド自動処理を強制停止
・ip <IP>        : 指定したIPアドレスの住所・詳細情報を検索
・zip <ZIP>      : 指定した郵便番号の住所を検索
・net            : ネットワークの通信テスト・状況を表示
・search / view  : ウェブビューで検索またはURLを表示
・cls / clear    : 画面をクリアします`;
        appendOutput(result, 'info-text');
        break;

      case 'cls':
      case 'clear':
        terminal.innerHTML = '';
        break;

      case 'top':
        appendOutput('システム情報を収集中...', 'info-text');
        result = await window.api.runTop();
        appendOutput(result);
        break;

      case 'news':
        appendOutput('最新ニュースを取得中...', 'info-text');
        result = await window.api.runNews();
        appendOutput(result);
        break;

      case 'weather':
        appendOutput('天気予報を取得中...', 'info-text');
        result = await window.api.runWeather();
        appendOutput(result);
        break;

      case 'time':
        result = window.api.runTime();
        appendOutput(result);
        break;

      case 'access':
        if (arg === 'auto') {
          if (accessAutoTimer) {
            appendOutput('[Error] 既に access auto による自動チェックが実行中です。', 'error-text');
            break;
          }
          appendOutput('[Access Auto] 自動セキュリティチェックを開始しました（10分間隔）。停止するには "access stop" と入力してください。', 'success-text');
          
          result = await window.api.runAccess();
          appendOutput(result);

          accessAutoTimer = setInterval(async () => {
            appendOutput('[Access Auto] 定期セキュリティチェックを実行中...', 'info-text');
            const autoResult = await window.api.runAccess();
            appendOutput(autoResult);
          }, 10 * 60 * 1000);

        } else if (arg === 'stop') {
          if (!accessAutoTimer) {
            appendOutput('[Error] 自動チェックは実行されていません。', 'error-text');
            break;
          }
          clearInterval(accessAutoTimer);
          accessAutoTimer = null;
          appendOutput('[Access Auto] 自動セキュリティチェックを停止しました。', 'info-text');

        } else if (arg === '') {
          appendOutput('アクセスログをスキャン中...', 'info-text');
          result = await window.api.runAccess();
          appendOutput(result);
        } else {
          appendOutput(`[Error] 不明な引数です: ${arg} (例: access auto または access stop)`, 'error-text');
        }
        break;

      case 'ping':
        if (!arg) {
          appendOutput('[Error] 宛先を指定してください。 (例: ping google.com または ping 8.8.8.8)', 'error-text');
          break;
        }
        appendOutput(`[Ping] ${arg} にパケットを送信中...`, 'info-text');
        result = await window.api.runPing(arg);
        appendOutput(result);
        break;

      case 'process':
      case 'ps':
        appendOutput('プロセス情報をスキャン中...', 'info-text');
        result = await window.api.runProcess();
        appendOutput(result);
        break;

      case 'whoami':
        result = await window.api.runWhoami();
        appendOutput(result);
        break;

      case 'uptime':
        result = await window.api.runUptime();
        appendOutput(result);
        break;

      case 'calc':
        if (!arg) {
          appendOutput('[Error] 計算式を入力してください。 (例: calc 100 * 1.1 または calc (5 + 3) / 2)', 'error-text');
          break;
        }
        try {
          // 安全な文字のみを許可する正規表現でフィルタリング
          const sanitizedFormula = arg.replace(/[^0-9+\-*/().\s]/g, '');
          if (!sanitizedFormula) {
            appendOutput('[Error] 無効な演算式です。数字と算術記号 (+ - * /) のみ使用可能です。', 'error-text');
            break;
          }
          const calcResult = Function(`"use strict"; return (${sanitizedFormula})`)();
          appendOutput(`=== [ CALC RESULT ] ===\n${arg} = ${calcResult}`, 'success-text');
        } catch (err) {
          appendOutput(`[Error] 計算に失敗しました: 式の構文を確認してください。`, 'error-text');
        }
        break;

      case 'echo':
        appendOutput(arg);
        break;

      case 'base64':
        if (!arg) {
          appendOutput('[Error] 文字列を指定してください。 (例: base64 テキスト または デコード時: base64 -d SGVsbG8=)', 'error-text');
          break;
        }
        if (arg.startsWith('-d ')) {
          const targetStr = arg.slice(3).trim();
          try {
            const decoded = decodeURIComponent(escape(atob(targetStr)));
            appendOutput(`=== [ BASE64 DECODE ] ===\n${decoded}`);
          } catch (e) {
            appendOutput(`[Error] Base64デコードに失敗しました。正しいエンコード文字列か確認してください。`, 'error-text');
          }
        } else {
          try {
            const encoded = btoa(unescape(encodeURIComponent(arg)));
            appendOutput(`=== [ BASE64 ENCODE ] ===\n${encoded}`);
          } catch (e) {
            appendOutput(`[Error] Base64エンコードに失敗しました。`, 'error-text');
          }
        }
        break;

      case 'random':
        const numParts = arg.split(' ').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
        let min = 1;
        let max = 100;
        if (numParts.length === 1) {
          max = numParts[0];
        } else if (numParts.length >= 2) {
          min = numParts[0];
          max = numParts[1];
        }
        if (min > max) [min, max] = [max, min];
        const randNum = Math.floor(Math.random() * (max - min + 1)) + min;
        appendOutput(`=== [ RANDOM GENERATOR ] ===\n生成された数値 (${min} ~ ${max}): ${randNum}`, 'success-text');
        break;

      case 'apikey':
      case 'keygen':
        // i-<8桁のランダム数字> を生成
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
        const generatedApiKey = `i-${randomDigits}`;
        appendOutput(`=== [ API KEY GENERATED ] ===\n生成されたAPIキー: ${generatedApiKey}`, 'success-text');
        break;

      case 'history':
        if (history.length === 0) {
          appendOutput('コマンド履歴はありません。', 'info-text');
        } else {
          let historyLines = ['=== [ コマンド実行履歴 ] ==='];
          history.forEach((h, i) => {
            historyLines.push(` ${i + 1}: ${h}`);
          });
          appendOutput(historyLines.join('\n'));
        }
        break;

      case 'stop':
        if (arg === 'all') {
          let stoppedCount = 0;
          if (accessAutoTimer) {
            clearInterval(accessAutoTimer);
            accessAutoTimer = null;
            stoppedCount++;
          }
          appendOutput(`[Stop All] バックグラウンドタスクを停止しました (${stoppedCount} 件のタイマーを破棄)。`, 'success-text');
        } else {
          appendOutput('[Error] 引数を指定してください (例: stop all または access stop)', 'error-text');
        }
        break;

      case 'ip':
        if (!arg) {
          appendOutput('[Error] IPアドレスを入力してください。 (例: ip 153.120.10.5)', 'error-text');
          break;
        }
        appendOutput(`IP ${arg} を解析中...`, 'info-text');
        result = await window.api.runIp(arg);
        appendOutput(result);
        break;

      case 'zip':
        if (!arg) {
          appendOutput('[Error] 郵便番号を入力してください。 (例: zip 1000001)', 'error-text');
          break;
        }
        appendOutput(`郵便番号 ${arg} を検索中...`, 'info-text');
        result = await window.api.runZip(arg);
        appendOutput(result);
        break;

      case 'net':
        appendOutput('ネットワーク診断を実行中...', 'info-text');
        result = await window.api.runNet();
        appendOutput(result);
        break;

      case 'search':
      case 'view':
        if (!arg) {
          appendOutput('[Error] 検索ワードまたはURLを指定してください。 (例: search 焼肉 または search https://google.com)', 'error-text');
          break;
        }
        
        let targetUrl = arg;
        if (!arg.startsWith('http://') && !arg.startsWith('https://')) {
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(arg)}`;
        }

        appendOutput(`ウェブビューで読み込み中: ${targetUrl}`, 'info-text');

        document.getElementById('terminal').style.display = 'none';
        const viewContainer = document.getElementById('view-container');
        viewContainer.style.display = 'flex';
        
        document.getElementById('view-url-display').textContent = targetUrl;
        const webviewElem = document.getElementById('my-webview');
        webviewElem.src = targetUrl;
        break;

      default:
        appendOutput(`'${cmd}' は、内部コマンドまたは外部コマンド、操作可能なプログラムまたはバッチ ファイルとして認識されていません。\n'help' と入力するとコマンド一覧が表示されます。`, 'error-text');
        break;
    }
  } else if (e.key === 'ArrowUp') {
    if (history.length > 0 && historyIndex > 0) {
      historyIndex--;
      commandInput.value = history[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    if (history.length > 0 && historyIndex < history.length - 1) {
      historyIndex++;
      commandInput.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      commandInput.value = '';
    }
  }
});

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
