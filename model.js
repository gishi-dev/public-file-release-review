export const versions = { initial: 'A 初版（比較用）', revised: 'B 修正版', teaching: 'C 意図的な誤りの教材' };
export const roles = ['E01 店長', 'E02 副店長', 'E03 受付', 'E04 受付', 'E05 Web担当', 'E06 経理', 'E07 在庫担当', 'E08 販売担当', 'E09 販売担当', 'E10 総務', '制作会社の担当', '保守担当'];
export const types = ['HTML', 'CSS', '画像', 'PDF', 'CSV', 'ZIP', '会員データ', 'バックアップ', '設定', 'メモ', '表計算', 'ソースマップ'];
export const intents = ['決めた', '決めていない', '不明'];
export const actions = ['残してよい', '非公開の場所へ移す', '削除する', '確認待ち'];
export const responses = ['担当と期限を設定', '制作会社に依頼済み', '完了の確認待ち'];
export const questions = ['配信設定から外したか', '取得処理側でも拒否するか', '過去の配信物とキャッシュの扱いを誰が判断するか', '使い終わったCSVの保管期限と削除担当', '受け取った端末側の保存'];
export const disclaimer = '記録上の判断で、公開サーバー・CDNの残存やファイルの中身を確かめた結果ではない';
export const fields = ['path', 'type', 'purpose', 'creator', 'created', 'intent'];
export function rejectSensitive(value) {
  if (typeof value !== 'string') {
    if (value && typeof value === 'object') Object.values(value).forEach(rejectSensitive);
    return;
  }
  const text = value.normalize('NFKC');
  const phone = /\b\d{2,4}[- ]\d{2,4}[- ]\d{4}\b|(?<!\d)0[1-9]\d{8,9}(?!\d)|(?<!\d)(?:0|\+?81[- ]?)(?:50|70|80|90)[- ]?\d{4}[- ]?\d{4}(?!\d)|\+81[1-9]\d{8,9}(?!\d)/;
  const parenthesizedPhone = /(?:\(0[1-9]\d{0,3}\)|\+81[- ]?\([1-9]\d{0,3}\))[- ]*\d{1,4}[- ]*\d{4}(?!\d)/;
  const databaseUri = /\bjdbc:[a-z][\w-]*:|\b(?:postgres(?:ql)?|mysql|mariadb|mongodb|rediss?|mssql|sqlserver|oracle|sqlite|cockroachdb|amqps?)(?:\+[\w-]+)?:\/\//i;
  const sensitiveSetting = /(?:\b(?:database[_ ]?url|db[_ ]?(?:url|dsn|host|name|user|password)|dsn|data source|initial catalog|user id|uid|pwd|client[_ -]?secret|(?:aws[_ -]?)?(?:secret[_ -]?)?access[_ -]?key(?:[_ -]?id)?)\b|password|api[_ -]?key|api\s*キー|token|接続先|接続文字列|パスワード)(?:\\?["']){0,2}\s*[:=]\s*\S/i;
  const databaseParameters = /\b(?:host(?:addr)?|server|address|database|dbname|port|user)\s*=\s*[^;\s]+[;\s]+(?:host(?:addr)?|server|address|database|dbname|port|user)\s*=/i;
  const authorizationHeader = /\bauthorization(?:\\?["'])?\s*[:=]\s*(?:"[^"\r\n]|'[^'\r\n]|[^\s"'])/i;
  if (phone.test(text) || parenthesizedPhone.test(text) || databaseUri.test(text) || sensitiveSetting.test(text) || databaseParameters.test(text) || authorizationHeader.test(text) ||
      /(?:https?:\/\/|www\.|\b(?:sk-|AKIA)[a-zA-Z0-9_-]*|[A-Za-z0-9_+-]{32,})/i.test(text)) throw Error('秘密情報や接続先らしい値は保存できません。値を除いた架空の一覧だけを入力してください。');
  for (const email of text.matchAll(/[\w.+-]+@([\w.-]+)/g)) if (email[1] !== 'example.invalid') throw Error('メールのドメインは example.invalid だけ使えます。');
  if (/\b(?:[a-z0-9-]+\.)+(?:com|net|org|jp|io|dev)\b/i.test(text)) throw Error('実在する可能性のあるドメインは入力できません。');
}
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= '0001-01-01' && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
}
export function validateRows(rows) {
  rejectSensitive(rows);
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw Error('一覧は1〜100行にしてください。');
  const paths = new Set();
  return rows.map(row => {
    if (!row || Object.keys(row).sort().join() !== [...fields].sort().join()) throw Error('一覧の項目は path, type, purpose, creator, created, intent の6つです。');
    const copy = {};
    for (const key of fields) {
      const value = row[key];
      if (value !== null && (typeof value !== 'string' || value.length > 240)) throw Error('各項目は240文字以内の文字列か null にしてください。');
      if (typeof value === 'string' && /[\r\n\u0085\u2028\u2029]/.test(value)) throw Error('一覧の各項目は改行を含まない1行で入力してください。');
      copy[key] = typeof value === 'string' ? value.trim() || null : null;
    }
    if (!copy.path || !/^(public|private)\/[\w.\-/]+$/.test(copy.path) || copy.path.includes('..') ||
        copy.path.endsWith('/') || copy.path.endsWith('/.')) throw Error('ファイルのパスは public/ または private/ から始め、上位フォルダーを参照しない形で入力してください。');
    copy.path = copy.path.split('/').filter(part => part && part !== '.').join('/');
    if (paths.has(copy.path)) throw Error('同じファイルのパスが重複しています。');
    if (copy.type !== null && !types.includes(copy.type)) throw Error('種類が選択肢にありません。');
    if (copy.creator !== null && !roles.includes(copy.creator)) throw Error('作った人は役割表から選んでください。');
    if (copy.intent !== null && !intents.includes(copy.intent)) throw Error('公開の意図が選択肢にありません。');
    if (copy.created !== null && !validDate(copy.created)) throw Error('作った日は西暦0001年から9999年までの実在する日付を YYYY-MM-DD 形式で指定してください。');
    paths.add(copy.path);
    return copy;
  });
}
export function category(row) {
  if (row.type === '会員データ' || row.type === 'バックアップ') return row.type;
  if (/(?:^|[\/_.-])backups?(?=[\/_.-]|$)|\.bak$/i.test(row.path)) return 'バックアップ';
  if (/\.(env|ini|conf)$/i.test(row.path) || row.type === '設定') return '設定';
  if (/\.map$/i.test(row.path) || row.type === 'ソースマップ') return 'ソースマップ';
  if (/\.(xlsx|ods)$/i.test(row.path) || row.type === '表計算') return '表計算';
  if (/\.(md|txt)$/i.test(row.path) || row.type === 'メモ') return '作業メモ';
  const archiveOrTable = row.path.match(/\.(csv|zip)$/i);
  if (archiveOrTable) return archiveOrTable[1].toUpperCase();
  if (row.type) return row.type;
  if (/\.html?$/i.test(row.path)) return 'HTML';
  if (/\.css$/i.test(row.path)) return 'CSS';
  if (/\.pdf$/i.test(row.path)) return 'PDF';
  if (/\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(row.path)) return '画像';
  return '種類未確認';
}
export function state(row) {
  if (!row.intent || row.intent === '不明') return '公開の意図が未確認';
  if (row.intent === '決めた') return '公開を決めた';
  return ['会員データ', 'バックアップ', '設定', '作業メモ', '表計算', 'ソースマップ', 'CSV', 'ZIP'].includes(category(row)) ? '公開場所に置くと困る種類' : '公開を決めていない';
}
export function candidateStatus(candidate) {
  return candidate ? '候補あり' : '再整理待ち';
}
export function requiresStorageCheck(row, action) {
  const checkedTypes = ['バックアップ', '会員データ', 'CSV', 'ZIP', '表計算'];
  return action === '削除する' && (checkedTypes.includes(row.type) || checkedTypes.includes(category(row)));
}
export function validateDecision(row, decision, candidate) {
  rejectSensitive(decision);
  if (!candidate) throw Error('再整理待ちです。現在の入力に合う候補JSONを取り込んでください。');
  if (!actions.includes(decision.action) || !decision.reason?.trim()) throw Error('扱いと、人が書いた理由が必要です。');
  if (decision.reason.length > 1000 || (decision.storage || '').length > 500) throw Error('理由は1000文字、保管先の確認は500文字以内です。');
  if (decision.action === '残してよい' && row.intent !== '決めた') throw Error('公開の意図が「決めた」の行だけ残せます。');
  if (!roles.includes(decision.recorder)) throw Error('記録者を選んでください。');
  if (decision.owner && !roles.includes(decision.owner)) throw Error('担当を役割表から選んでください。');
  if (decision.due && !validDate(decision.due)) throw Error('期限を実在する日付で指定してください。');
  if (!Array.isArray(decision.questions) || decision.questions.some(q => !questions.includes(q))) throw Error('確認事項を選択肢から選んでください。');
  if (decision.response && !responses.includes(decision.response)) throw Error('対応の状態を選んでください。');
  if (decision.action !== '残してよい') {
    const missing = [
      ['担当', decision.owner],
      ['期限', decision.due],
      ['対応', decision.response],
      ['確認事項', decision.questions.length]
    ].filter(([, value]) => !value).map(([label]) => label);
    if (missing.length) throw Error(`${missing.join('・')}が未設定です。`);
  }
  if (requiresStorageCheck(row, decision.action) && (!decision.storageChecked || !decision.storage?.trim())) throw Error('削除する前に保管先の確認を記入し、確認のチェックを付けてください。');
  if (!decision.reviewed) throw Error('候補と一覧を照合したチェックが必要です。');
}
function matchesInputs(inputs, rows) {
  return Array.isArray(inputs) && inputs.length === rows.length && rows.every((row, index) => {
    const input = inputs[index];
    return input && Object.keys(input).length === fields.length &&
      fields.every(key => Object.hasOwn(input, key) && input[key] === row[key]);
  });
}
export function importCandidates(bundle, version, revision, rows) {
  rejectSensitive(bundle);
  if (!bundle || Object.keys(bundle).sort().join() !== 'candidates,inputs,revision,version' || bundle.version !== version || bundle.revision !== revision || !matchesInputs(bundle.inputs, rows)) throw Error('候補の版・入力・更新IDが現在の一覧と一致しません。画面から現在の項目をコピーしてください。');
  if (!Array.isArray(bundle.candidates) || !bundle.candidates.length || bundle.candidates.length > rows.length) throw Error('候補の件数が一致しません。');
  const map = new Map();
  for (const c of bundle.candidates) {
    if (!c || Object.keys(c).sort().join() !== 'path,questions,reason' || !rows.some(r => r.path === c.path) || map.has(c.path) || typeof c.reason !== 'string' || !c.reason.trim() || c.reason.length > 1000 || !Array.isArray(c.questions) || !c.questions.length || c.questions.length > 5 || c.questions.some(q => typeof q !== 'string' || !q.trim() || q.length > 500)) throw Error('候補は各パスの reason と questions（文字列の配列）だけを指定してください。');
    map.set(c.path, { ...c, source: '取り込んだ候補（作成元は人が確認）' });
  }
  return map;
}
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === '\r' && text[i + 1] === '\n') {
      continue;
    } else if (ch === '"') {
      if (cell || closed) throw Error('CSVの引用符を確認してください。');
      quoted = true;
    } else if (ch === ',' || ch === '\n') {
      row.push(cell); cell = ''; closed = false;
      if (ch === '\n') { rows.push(row); row = []; }
    } else {
      if (closed) throw Error('CSVの引用符の後に区切りが必要です。');
      cell += ch;
    }
  }
  if (quoted) throw Error('CSVの引用符が閉じていません。');
  if (cell || row.length || closed) { row.push(cell); rows.push(row); }
  while (rows.at(-1)?.length === 1 && rows.at(-1)[0] === '') rows.pop();
  const header = rows[0];
  if (header?.length !== fields.length || fields.some((field, index) => header[index] !== field)) {
    throw Error('CSVの見出しは path,type,purpose,creator,created,intent の順です。');
  }
  return rows.slice(1).map(values => {
    if (values.length !== fields.length) throw Error('CSVの列数が一致しません。');
    return Object.fromEntries(fields.map((key, i) => [key, values[i] || null]));
  });
}
export function blockers(version, rows, records, candidates, incompleteAttempts = new Map()) {
  const result = [];
  if (version !== 'revised') result.push('比較用・教材の版は確定できません。B 修正版で判断してください。');
  for (const row of rows) {
    if (!records.has(row.path)) result.push(`${row.path}：${incompleteAttempts.get(row.path) || '未記録（担当・期限は未設定）'}`);
    else try { validateDecision(row, records.get(row.path), candidates.get(row.path)); } catch (error) { result.push(`${row.path}：${error.message}`); }
  }
  return result;
}
export function exportTicket(version, rows, records, candidates, history, confirmed) {
  const teaching = version === 'teaching', comparison = version === 'initial';
  return {
    notice: `${teaching ? '【教材の版・照合用】' : comparison ? '【比較用の版】' : ''}${disclaimer}`,
    version, versionLabel: versions[version], teaching, comparison,
    status: confirmed && !teaching && !comparison ? '確定' : '照合用・未確定',
    files: rows.map(row => ({ ...row, state: state(row), category: category(row), candidateStatus: candidateStatus(candidates.get(row.path)), decision: records.get(row.path) || null })),
    history
  };
}
