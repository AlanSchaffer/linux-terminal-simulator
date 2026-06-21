// ═══════════════════════════════════════════════════════════════════
//  SIMULATED LINUX TERMINAL - CORRIGIDO
// ═══════════════════════════════════════════════════════════════════

let username = '';
const HOSTNAME = '_403';
let cwd = '';
let vfs = {};
let cmdHistory = JSON.parse(localStorage.getItem('_403_history') || '[]');
let histIdx = -1;
let aliases = {};
let envVars = {};


// ── Sistema de Armazenamento Global do Tema ──────────────────────
function setTheme(themeName) {
    const theme = themeName || 'default';
    // Lista com todos os seus temas
    const allThemes = ['theme-dracula', 'theme-gruvbox', 'theme-matrix', 'theme-nord', 'theme-catppuccin', 'theme-monokai', 'theme-cyberpunk'];
    
    // Remove de ambos (html e body) para garantir limpeza total
    document.documentElement.classList.remove(...allThemes);
    document.body.classList.remove(...allThemes);
    
    // A MÁGICA AQUI: Aplica o novo tema direto no HTML (o :root do CSS)
    if (theme !== 'default') {
        document.documentElement.classList.add(`theme-${theme}`);
    }
    
    // Grava permanentemente no navegador
    localStorage.setItem('selected-theme', theme);
}

// Executa IMEDIATAMENTE no carregamento do arquivo para evitar piscadas na tela
(function() {
    const savedTheme = localStorage.getItem('selected-theme') || 'default';
    setTheme(savedTheme);
})();

// Aguarda o HTML carregar para gerenciar os cliques dos menus
window.addEventListener('DOMContentLoaded', () => {
    const themeButtons = document.querySelectorAll('.theme-dropdown button');
    const themeNames = ['default', 'dracula', 'gruvbox', 'matrix', 'nord', 'catppuccin', 'monokai', 'cyberpunk'];
    themeButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => setTheme(themeNames[i]));
});
    // Mantém a inicialização do seu login original intacta
    initLoginListener();

    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        // Abre/fecha o menu ao clicar
        themeSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            themeSelector.classList.toggle('open');
        });
    }

    // Fecha o menu se clicar em qualquer outro ponto da tela
    window.addEventListener('click', () => {
        if (themeSelector) {
            themeSelector.classList.remove('open');
        }
    });
});



// ── Filesystem helpers 

function resolvePath(path) {
    // Se o argumento for um Array, extrai automaticamente o primeiro elemento
    if (Array.isArray(path)) path = path[0];
    
    if (!path || path === '') return cwd;
    if (path === '~') return `/home/${username}`;
    if (path.startsWith('~/')) return `/home/${username}/${path.slice(2)}`;
    if (!path.startsWith('/')) path = (cwd === '/' ? '' : cwd) + '/' + path;
    const parts = path.split('/');
    const stack = [];
    for (const p of parts) {
        if (p === '' || p === '.') continue;
        if (p === '..') { if (stack.length) stack.pop(); }
        else stack.push(p);
    }
    return '/' + stack.join('/');
}

function fsGet(path) {
    return vfs[resolvePath(path)] ?? null;
}

function fsList(path) {
    const abs = resolvePath(path);
    const prefix = abs === '/' ? '/' : abs + '/';
    return Object.entries(vfs)
        .filter(([k]) => k !== abs && k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map(([k, v]) => ({ name: k.split('/').pop(), ...v }));
}

function shortPath() {
    const home = `/home/${username}`;
    if (cwd === home) return '~';
    if (cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length);
    return cwd || '/';
}

function fsTouch(path, content = '') {
    const abs = resolvePath(path);
    vfs[abs] = { type: 'file', content, perms: '-rw-r--r--', size: content.length, mdate: nowStr() };
}

function fsMkdir(path) {
    vfs[resolvePath(path)] = { type: 'dir', perms: 'drwxr-xr-x', size: 4096, mdate: nowStr() };
}

function nowStr() {
    const d = new Date();
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return `${m} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function humanBytes(b) {
    if (b >= 1073741824) return (b/1073741824).toFixed(1)+'G';
    if (b >= 1048576)    return (b/1048576).toFixed(1)+'M';
    if (b >= 1024)       return (b/1024).toFixed(1)+'K';
    return b+'B';
}

function initFS() {
    // 1. Limpeza absoluta antes de qualquer coisa
    vfs = {}; 
    const H = `/home/${username}`;

    // 1.2 adicione estas linhas:
    envVars.HOME = H;
    envVars.USER = username;
    envVars.PWD = H;
    envVars.SHELL = '/bin/bash';
    envVars.PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';
    
    // 2. Tenta carregar do localStorage
    const savedVFS = localStorage.getItem(`_403_vfs_${username}`);
    
    if (savedVFS) {
        try {
            vfs = JSON.parse(savedVFS);
            cwd = H;
            console.log("Sistema carregado do localStorage com sucesso.");
            return; 
        } catch (e) {
            console.error("Erro no JSON, reiniciando sistema...");
        }
    }

    // 3. SE NÃO EXISTIR LOCALSTORAGE, cria o sistema base
    // Usamos um array único e garantimos que cada pasta só seja criada uma vez
    const basePaths = [
        '/', '/home', H,
        `${H}/Downloads`, `${H}/Desktop`, `${H}/Documents`,
        `${H}/Music`, `${H}/Pictures`, `${H}/Videos`,
        '/etc', '/etc/apt', '/tmp', '/usr', '/usr/bin',
        '/usr/local', '/usr/local/bin', '/bin', '/sbin',
        '/var', '/var/log', '/root', '/opt', '/proc',
        '/sys', '/dev', '/lib', '/lib64', '/mnt', '/media'
    ];

    basePaths.forEach(path => {
        if (!vfs[path]) { // Só cria se ainda não existir
            fsMkdir(path);
        }
    });

    // Adiciona arquivos do sistema
    fsTouch('/etc/hostname', HOSTNAME);
    // ... adicione os outros fsTouch aqui ...

    // 4. Salva o estado limpo
    localStorage.setItem(`_403_vfs_${username}`, JSON.stringify(vfs));
    cwd = H;
}

// ── DOM refs ──────────────────────────────────────────────────────
const $loginScreen = document.getElementById('login-screen');
const $termScreen  = document.getElementById('terminal-screen');
const $terminal    = document.getElementById('terminal');
const $loginInput  = document.getElementById('login-input');

// ── Login ─────────────────────────────────────────────────────────
function initLoginListener() {
    // 1. Configura o foco automático no terminal UMA ÚNICA VEZ
    $termScreen.addEventListener('click', () => {
        const activeInput = $terminal.querySelector('.line:last-child input');
        if (activeInput && !activeInput.disabled) {
            activeInput.focus();
        }
    });

    // 2. Configura o evento de pressionar Enter no login
    $loginInput.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        
        const name = $loginInput.value.trim().replace(/[^a-z0-9_-]/g, '').toLowerCase();
        if (!name) return;
        
        // Inicializa o sistema
        username = name;
        initFS();
        
        // Troca as telas
        $loginScreen.style.display = 'none';
        $termScreen.style.display  = 'flex';
        $termScreen.style.flexDirection = 'column';
        
        // Inicia o terminal
        printWelcome();
        newLine();
    });
}



function printWelcome() {
    addOut([
        '',
        `_403 Terminal  —  ${new Date().toLocaleString('en-US')}`,
        `Welcome to the terminal, ${username}! Type 'help' to see the commands.`,
        '',
    ].join('\n'), 'ok');
}

// ── Prompt ────────────────────────────────────────────────────────
function promptHTML() {
    return `<span class="p-user">${username}</span>` +
           `<span class="p-at">@</span>` +
           `<span class="p-host">${HOSTNAME}</span>` +
           `<span class="p-at">:</span>` +
           `<span class="p-path">${shortPath()}</span>` +
           `<span class="p-dollar">$ </span>`;
}

function newLine() {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = `<span class="prompt">${promptHTML()}</span>` +
                     `<input type="text" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">`; +
    $terminal.appendChild(line);

    const input = line.querySelector('input');
    input.focus();
    histIdx = -1;

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const raw = input.value.trim();
            input.disabled = true;
            
            if (raw) {
            cmdHistory.unshift(raw);
            if (cmdHistory.length > 200) cmdHistory.pop();
            localStorage.setItem('_403_history', JSON.stringify(cmdHistory));
        }
            exec(raw);
            scrollBottom();
            if (!$termScreen.dataset.exiting) newLine();

        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx < cmdHistory.length - 1) input.value = cmdHistory[++histIdx];

        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx > 0) input.value = cmdHistory[--histIdx];
            else { histIdx = -1; input.value = ''; }

        } else if (e.key === 'Tab') {
            e.preventDefault();
            tabComplete(input);

        } else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            $terminal.innerHTML = '';
            newLine();

        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            addOut('^C');
            input.disabled = true;
            newLine();
        }
    });
}

function scrollBottom() { $terminal.scrollTop = $terminal.scrollHeight; }

function addOut(text, cls = '') {
    const d = document.createElement('div');
    d.className = 'output' + (cls ? ' ' + cls : '');
    d.textContent = text;
    $terminal.appendChild(d);
}

// ── Tab autocomplete ──────────────────────────────────────────────
function tabComplete(input) {
    const val = input.value;
    const toks = val.trimStart().split(' ');
    const last = toks[toks.length - 1];
    const dirPart  = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : '';
    const filePart = last.slice(dirPart.length);
    const searchIn = dirPart ? resolvePath(dirPart) : cwd;
    const matches  = fsList(searchIn)
        .filter(c => c.name.startsWith(filePart))
        .map(c => c.name + (c.type === 'dir' ? '/' : ''));

    if (matches.length === 1) {
        toks[toks.length - 1] = dirPart + matches[0];
        input.value = toks.join(' ');
    } else if (matches.length > 1) {
        addOut(matches.join('  '));
    }
}

// ── Command execution ─────────────────────────────────────────────
function exec(raw) {
    if (!raw) return;

    // Basic support for && and ||
    if (raw.includes(' && ')) {
        const parts = raw.split(' && ');
        for (const part of parts) {
            const r = execSingle(part.trim());
            if (r === false) break; // failed, break chain
        }
        return;
    }
    if (raw.includes(' || ')) {
        const parts = raw.split(' || ');
        for (const part of parts) {
            const r = execSingle(part.trim());
            if (r !== false) break; // success, break chain
        }
        return;
    }
    
    execSingle(raw);
}

function saveVFS() {
    localStorage.setItem(`_403_vfs_${username}`, JSON.stringify(vfs));
}

function execSingle(raw) {
    if (!raw) return true;

    const firstWord = raw.split(' ')[0];
    if (aliases[firstWord]) raw = aliases[firstWord] + raw.slice(firstWord.length);

    let appendTo = null, writeTo = null;
    const appMatch   = raw.match(/^(.*?)\s*>>\s*(.+)$/s);
    const writeMatch = raw.match(/^(.*?)\s*>\s*(.+)$/s);
    if (appMatch)        { raw = appMatch[1].trim();   appendTo = resolvePath(appMatch[2].trim()); }
    else if (writeMatch) { raw = writeMatch[1].trim(); writeTo  = resolvePath(writeMatch[2].trim()); }

    let pipeCmd = null;
    const pipeIdx = raw.indexOf(' | ');
    if (pipeIdx !== -1) { pipeCmd = raw.slice(pipeIdx + 3).trim(); raw = raw.slice(0, pipeIdx).trim(); }

    const toks = tokenize(raw);
    const [cmd, ...args] = toks;
    let result = run(cmd, args, null);
    if (result === undefined) result = null;

    if (pipeCmd !== null && result !== null) {
        const ptoks = tokenize(pipeCmd);
        const [pcmd, ...pargs] = ptoks;
        result = run(pcmd, pargs, result);
        if (result === undefined) result = null;
    }

    if (writeTo !== null) {
        const content = result ?? '';
        vfs[writeTo] = { type: 'file', content, perms: '-rw-r--r--', size: content.length, mdate: nowStr() };
        saveVFS();
        return true;
    }
    if (appendTo !== null) {
        const prev = vfs[appendTo]?.content ?? '';
        const content = prev + (prev ? '\n' : '') + (result ?? '');
        vfs[appendTo] = { type: 'file', content, perms: '-rw-r--r--', size: content.length, mdate: nowStr() };
        saveVFS();
        return true;
    }

    saveVFS();
    if (result !== null) addOut(result);
    return result !== 'FAIL';
}

function tokenize(str) {
    const tokens = [];
    let cur = '', q = null;
    for (const c of str) {
        if (q) { if (c === q) q = null; else cur += c; }
        else if (c === '"' || c === "'") q = c;
        else if (c === ' ') { if (cur) { tokens.push(cur); cur = ''; } }
        else cur += c;
    }
    if (cur) tokens.push(cur);
    return tokens;
}

// ── Command runner ────────────────────────────────────────────────
function run(cmd, args, stdin) {
    const flags    = args.filter(a => a.startsWith('-'));
    const params   = args.filter(a => !a.startsWith('-'));
    const hasFlag  = (...f) => f.some(x => flags.some(fl => fl === x || (x.length === 2 && fl.length > 2 && fl.includes(x[1]))));

    switch (cmd) {

    // ── Navigation ───────────────────────────────────────────────
    case 'batata': return 'O codigo atualizou com sucesso!';
    case 'pwd': return cwd;

    case 'cd': {
        const target = params[0] || envVars.HOME;
        const abs = resolvePath(target);
        const n = fsGet(abs);
        if (!n) return `bash: cd: ${target}: No such file or directory`;
        if (n.type !== 'dir') return `bash: cd: ${target}: Not a directory`;
        cwd = abs;
        envVars.PWD = abs;
        return null;
    }

    case 'ls': {
        const showAll  = hasFlag('-a', '-A');
        const showLong = hasFlag('-l');
        const showHuman= hasFlag('-h');
        const target = params[0] || cwd;
        const abs = resolvePath(target);
        const n = fsGet(abs);
        if (!n) return `ls: cannot access '${target}': No such file or directory`;

        let entries = n.type === 'dir' ? fsList(abs) : [{ name: target.split('/').pop(), ...n }];
        if (!showAll) entries = entries.filter(e => !e.name.startsWith('.'));
        entries.sort((a, b) => a.name.localeCompare(b.name));
        if (!entries.length) return '';

        if (showLong) {
            const header = n.type === 'dir' ? `total ${entries.length * 8}` : '';
            const lines = entries.map(e => {
                const p = e.perms || (e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
                const sz = showHuman ? humanBytes(e.size||4096).padStart(5) : String(e.size||4096).padStart(8);
                const nm = e.name + (e.type === 'dir' ? '/' : '');
                return `${p}  1 ${username} ${username} ${sz} ${e.mdate||nowStr()} ${nm}`;
            });
            return [header, ...lines].filter(Boolean).join('\n');
        }
        return entries.map(e => e.name + (e.type === 'dir' ? '/' : '')).join('  ');
    }

    case 'tree': {
        const abs = resolvePath(params[0] || cwd);
        const build = (path, pre) => {
            const kids = fsList(path).sort((a,b) => a.name.localeCompare(b.name));
            return kids.map((k, i) => {
                const last = i === kids.length - 1;
                const line = pre + (last ? '└── ' : '├── ') + k.name + (k.type==='dir' ? '/' : '') + '\n';
                return line + (k.type==='dir' ? build(path+(path==='/'?'':'/')+k.name, pre+(last?'    ':'│   ')) : '');
            }).join('');
        };
        const name = (abs==='/'?'/':abs.split('/').pop()) + '/';
        return name + '\n' + build(abs, '');
}

    // ── File operations ───────────────────────────────────────────
    case 'mkdir': {
        if (!params.length) return 'mkdir: missing operand';
        for (const p of params) {
            const abs = resolvePath(p);
            if (fsGet(abs) && !hasFlag('-p')) return `mkdir: cannot create directory '${p}': File exists`;
            if (hasFlag('-p')) {
                const parts = abs.split('/').filter(Boolean);
                let cur = '';
                for (const part of parts) { cur += '/' + part; if (!vfs[cur]) fsMkdir(cur); }
            } else {
                fsMkdir(abs);
            }
        }
        return null;
    }

    case 'touch': {
        if (!params.length) return 'touch: missing file operand';
        params.forEach(p => {
            const abs = resolvePath(p);
            if (vfs[abs]) vfs[abs].mdate = nowStr();
            else fsTouch(abs, '');
        });
        return null;
    }

    case 'rm': {
        const recursive = hasFlag('-r', '-R');
        const force     = hasFlag('-f');
        if (!params.length) return 'rm: missing operand';

        let output = [];

        for (const p of params) {
            if (p === '/') {
                $termScreen.style.display = 'none';
                const panicDiv = document.createElement('div');
                panicDiv.style.position = 'fixed';
                panicDiv.style.top = '0';
                panicDiv.style.left = '0';
                panicDiv.style.width = '100vw';
                panicDiv.style.height = '100vh';
                panicDiv.style.backgroundColor = '#c24b75';
                panicDiv.style.display = 'flex';
                panicDiv.style.justifyContent = 'center';
                panicDiv.style.alignItems = 'center';
                panicDiv.style.zIndex = '99999';
                const img = document.createElement('img');
                img.src = 'kernel_panic.jpg';
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                panicDiv.appendChild(img);
                document.body.appendChild(panicDiv);
                return null;
            }

            const abs = resolvePath(p);
            const n = fsGet(abs);

            if (!n) {
                if (!force) output.push(`rm: cannot remove '${p}': No such file or directory`);
                continue;
            }

            if (n.type === 'dir') {
                if (!recursive) {
                    output.push(`rm: cannot remove '${p}': Is a directory`);
                    continue;
                }
                // Exclui a pasta e tudo dentro dela
                Object.keys(vfs).forEach(k => {
                    if (k === abs || k.startsWith(abs + '/')) {
                        delete vfs[k];
                    }
                });
            } else {
                // Exclui apenas o arquivo
                delete vfs[abs];
            }
        }
        
        return output.length ? output.join('\n') : null;
    }

    case 'cp': {
        if (params.length < 2) return 'cp: missing destination file operand';
        const srcAbs = resolvePath(params[0]);
        const srcN   = fsGet(srcAbs);
        if (!srcN) return `cp: '${params[0]}': No such file or directory`;
        if (srcN.type === 'dir' && !hasFlag('-r','-R')) return `cp: -r not specified; omitting directory '${params[0]}'`;
        const dstAbs0 = resolvePath(params[params.length-1]);
        const dstN    = fsGet(dstAbs0);
        const dstBase = dstN?.type === 'dir' ? dstAbs0+'/'+srcAbs.split('/').pop() : dstAbs0;
        if (srcN.type === 'dir') {
            Object.keys(vfs).filter(k => k === srcAbs || k.startsWith(srcAbs+'/')).forEach(k => {
                vfs[dstBase + k.slice(srcAbs.length)] = { ...vfs[k], mdate: nowStr() };
            });
        } else {
            vfs[dstBase] = { ...srcN, mdate: nowStr() };
        }
        return null;
    }

    case 'mv': {
        if (params.length < 2) return 'mv: missing destination file operand';
        const srcAbs = resolvePath(params[0]);
        const srcN   = fsGet(srcAbs);
        if (!srcN) return `mv: '${params[0]}': No such file or directory`;
        const dstAbs0 = resolvePath(params[params.length-1]);
        const dstN    = fsGet(dstAbs0);
        const dstAbs  = dstN?.type === 'dir' ? dstAbs0+'/'+srcAbs.split('/').pop() : dstAbs0;
        vfs[dstAbs] = { ...srcN, mdate: nowStr() };
        delete vfs[srcAbs];
        return null;
    }

    case 'cat': {
        if (!params.length) return stdin ?? 'cat: stdin not supported';
        return params.map(p => {
            const n = fsGet(resolvePath(p));
            if (!n) return `cat: ${p}: No such file or directory`;
            if (n.type === 'dir') return `cat: ${p}: Is a directory`;
            return n.content ?? '';
        }).join('\n');
    }

    case 'tac': {
        const src = params[0] ? fsGet(resolvePath(params[0]))?.content : stdin;
        if (src === undefined || src === null) return 'tac: No such file or directory';
        return src.split('\n').reverse().join('\n');
    }

    case 'head': {
        const n = parseInt(args[args.indexOf('-n')+1]) || 10;
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'head: missing file operand';
        return src.split('\n').slice(0, n).join('\n');
    }
    case 'tail': {
        const n = parseInt(args[args.indexOf('-n')+1]) || 10;
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'tail: missing file operand';
        return src.split('\n').slice(-n).join('\n');
    }

    case 'wc': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'wc: missing file operand';
        const lines = src.split('\n').length;
        const words = src.trim().split(/\s+/).filter(Boolean).length;
        const chars = src.length;
        if (hasFlag('-l')) return String(lines);
        if (hasFlag('-w')) return String(words);
        if (hasFlag('-c')) return String(chars);
        return `${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(chars).padStart(7)}${params[0] ? ' '+params[0] : ''}`;
    }

    case 'grep': {
        if (!params.length) return 'usage: grep PATTERN [FILE]';
        const pat = params[0];
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return `grep: ${params[1]||'stdin'}: No such file or directory`;
        const re = new RegExp(pat, hasFlag('-i') ? 'i' : '');
        const matched = src.split('\n').filter(l => re.test(l));
        if (hasFlag('-c')) return String(matched.length);
        if (hasFlag('-v')) return src.split('\n').filter(l => !re.test(l)).join('\n');
        return matched.join('\n');
    }

    case 'sed': {
        if (!params.length) return 'usage: sed SCRIPT [FILE]';
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? '') : (stdin ?? '');
        const m = params[0].match(/^s\/(.+?)\/(.*)\/([gi]*)$/);
        if (!m) return `sed: '${params[0]}': invalid script`;
        try { return src.replace(new RegExp(m[1], m[3]||'g'), m[2]); }
        catch { return 'sed: invalid regex'; }
    }

    case 'awk': {
        if (!params.length) return 'usage: awk PROGRAM [FILE]';
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? '') : (stdin ?? '');
        const pm = params[0].match(/\{print \$(\d+)\}/);
        if (pm) { const col = parseInt(pm[1])-1; return src.split('\n').map(l => l.trim().split(/\s+/)[col]??'').join('\n'); }
        if (params[0] === '{print}') return src;
        return `(awk: '${params[0]}' — partial support)`;
    }

    case 'sort': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'sort: missing file operand';
        const lines = src.split('\n');
        const sorted = hasFlag('-n') ? lines.sort((a,b)=>parseFloat(a)-parseFloat(b)) : lines.sort();
        return (hasFlag('-r') ? sorted.reverse() : sorted).join('\n');
    }

    case 'uniq': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'uniq: missing file operand';
        return src.split('\n').filter((l,i,a) => i===0 || l!==a[i-1]).join('\n');
    }

    case 'theme': {
    const chosen = params[0];
    const validThemes = ['default', 'dracula', 'gruvbox', 'matrix', 'nord', 'monokai', 'catppuccin', 'cyberpunk'];
    
    if (!chosen) {
        return `Available themes: ${validThemes.join(', ')}\nUsage: theme [theme_name]`;
    }
    if (!validThemes.includes(chosen.toLowerCase())) {
        return `theme: '${chosen}' is not a valid theme.`;
    }
    
    setTheme(chosen.toLowerCase());
    return `Theme changed to '${chosen}' successfully!`;
}


    case 'cut': {
        const d = args[args.indexOf('-d')+1] || '\t';
        const fStr = args[args.indexOf('-f')+1] || '1';
        const cols = fStr.split(',').map(x=>parseInt(x)-1);
        const src = params.find(p => !p.startsWith('-'))
            ? (fsGet(resolvePath(params.find(p=>!p.startsWith('-'))))?.content ?? null)
            : stdin;
        if (src === null || src === undefined) return 'cut: missing file operand';
        return src.split('\n').map(l => cols.map(c => l.split(d)[c]??'').join(d)).join('\n');
    }

    case 'tr': {
        const src = stdin ?? '';
        if (params.length < 2) return 'usage: echo text | tr SET1 SET2';
        let result = src;
        for (let i = 0; i < Math.min(params[0].length, params[1].length); i++)
            result = result.split(params[0][i]).join(params[1][i]);
        return result;
    }

    case 'diff': {
        if (params.length < 2) return 'usage: diff FILE1 FILE2';
        const n1 = fsGet(resolvePath(params[0])), n2 = fsGet(resolvePath(params[1]));
        if (!n1) return `diff: ${params[0]}: No such file or directory`;
        if (!n2) return `diff: ${params[1]}: No such file or directory`;
        const l1 = (n1.content||'').split('\n'), l2 = (n2.content||'').split('\n');
        const out = [];
        for (let i = 0; i < Math.max(l1.length, l2.length); i++) {
            if (l1[i] !== l2[i]) {
                if (l1[i] !== undefined) out.push(`< ${l1[i]}`);
                if (l2[i] !== undefined) out.push(`> ${l2[i]}`);
            }
        }
        return out.join('\n') || '(identical files)';
    }
    case 'echo': {
        let text = params.join(' ');
        if (hasFlag('-e')) text = text.replace(/[^a-z0-9_-]/g, '').replace(/\\t/g,'\t').replace(/\\r/g,'\r');
        text = text.replace(/\$\{?(\w+)\}?/g, (_, k) => envVars[k] ?? '');
        return text;
    }

    case 'printf': return params.join('');

    case 'file': {
        if (!params.length) return 'file: missing operand';
        return params.map(p => {
            const n = fsGet(resolvePath(p));
            if (!n) return `${p}: ERROR: cannot open '${p}' (No such file or directory)`;
            if (n.type === 'dir') return `${p}: directory`;
            const ext = p.split('.').pop().toLowerCase();
            const types = {txt:'ASCII text',sh:'Bourne-Again shell script',py:'Python script',js:'JavaScript source',json:'JSON data',md:'ASCII text',html:'HTML document',c:'C source',cpp:'C++ source',h:'C header',rs:'Rust source'};
            return `${p}: ${types[ext] || 'ASCII text'}`;
        }).join('\n');
    }

    case 'stat': {
        if (!params.length) return 'stat: missing operand';
        const abs = resolvePath(params[0]);
        const n = fsGet(abs);
        if (!n) return `stat: cannot statx '${params[0]}': No such file or directory`;
        return [
            `  File: ${abs}`,
            `  Size: ${n.size||4096}\t\tBlocks: 8\tIO Block: 4096   ${n.type==='dir'?'directory':'regular file'}`,
            `Device: 802h\tInode: ${Math.floor(Math.random()*999999+100000)}\tLinks: 1`,
            `Access: (${n.perms||'-rw-r--r--'})  Uid: (1000/${username})  Gid: (1000/${username})`,
            `Modify: ${new Date().toISOString()}`,
        ].join('\n');
    }

    case 'find': {
        const startDir = params[0] || cwd;
        const abs = resolvePath(startDir);
        const nameIdx = args.indexOf('-name'), typeIdx = args.indexOf('-type');
        const namePattern = nameIdx !== -1 ? args[nameIdx+1] : null;
        const typeFilter  = typeIdx  !== -1 ? args[typeIdx+1]  : null;
        let results = Object.keys(vfs).filter(k => k===abs || k.startsWith(abs+'/'));
        if (namePattern) {
            const re = new RegExp('^'+namePattern.replace(/\./g,'\\.').replace(/\*/g,'.*').replace(/\?/g,'.')+'$');
            results = results.filter(k => re.test(k.split('/').pop()));
        }
        if (typeFilter === 'f') results = results.filter(k => vfs[k].type==='file');
        if (typeFilter === 'd') results = results.filter(k => vfs[k].type==='dir');
        return results.join('\n') || '';
    }

    case 'ln': {
        if (params.length < 2) return 'usage: ln [-s] TARGET LINK_NAME';
        const src = resolvePath(params[0]), dst = resolvePath(params[1]);
        const n = fsGet(src);
        if (!n) return `ln: failed to create symbolic link '${params[0]}': No such file or directory`;
        vfs[dst] = { ...n, mdate: nowStr() };
        return null;
    }

    case 'chmod': {
        if (params.length < 2) return 'usage: chmod MODE FILE';
        if (!vfs[resolvePath(params[1])]) return `chmod: cannot access '${params[1]}': No such file or directory`;
        return null;
    }

    case 'chown': return params.length < 2 ? 'usage: chown OWNER FILE' : null;

    case 'readlink':
    case 'realpath': return resolvePath(params[0] || cwd);

    case 'basename': {
        if (!params.length) return 'basename: missing operand';
        const b = params[0].split('/').pop();
        return params[1] ? b.replace(new RegExp(params[1].replace('.','\\.')+'$'),'') : b;
    }

    case 'dirname': {
        if (!params.length) return 'dirname: missing operand';
        const parts = params[0].split('/'); parts.pop();
        return parts.join('/') || '/';
    }

    // ── Text utilities ────────────────────────────────────────────
    case 'base64': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'base64: missing input';
        try { return hasFlag('-d') ? atob(src.trim()) : btoa(unescape(encodeURIComponent(src))); }
        catch { return 'base64: invalid input'; }
    }

    case 'md5sum': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'md5sum: missing input';
        const fake = Array.from({length:32}, ()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
        return `${fake}  ${params[0]||'-'}`;
    }
    case 'sha256sum': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'sha256sum: missing input';
        const fake = Array.from({length:64}, ()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
        return `${fake}  ${params[0]||'-'}`;
    }

    case 'xxd': {
        if (!params.length) return 'xxd: missing file operand';
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `xxd: ${params[0]}: No such file or directory`;
        return (n.content||'').slice(0,128).split('').map((c,i) =>
            i%16===0 ? `${i.toString(16).padStart(8,'0')}: ${c.charCodeAt(0).toString(16).padStart(2,'0')}` : c.charCodeAt(0).toString(16).padStart(2,'0')
        ).join(' ');
    }

    case 'nl': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.split('\n').map((l,i)=>`${String(i+1).padStart(6)}\t${l}`).join('\n');
    }

    case 'rev': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.split('\n').map(l=>l.split('').reverse().join('')).join('\n');
    }

    case 'tee': {
        if (params.length) fsTouch(resolvePath(params[0]), stdin ?? '');
        return stdin ?? '';
    }

    case 'column': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src;
    }

    case 'morse': {
        const M = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',' ':'/'};
        return params.join(' ').toUpperCase().split('').map(c=>M[c]||c).join(' ');
    }

    // ── System info ───────────────────────────────────────────────
    case 'uname': {
        if (hasFlag('-a')) return `Linux ${HOSTNAME} 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.69-1 (2023-12-30) x86_64 GNU/Linux`;
        if (hasFlag('-r')) return '6.1.0-18-amd64';
        if (hasFlag('-s')) return 'Linux';
        if (hasFlag('-n')) return HOSTNAME;
        if (hasFlag('-m')) return 'x86_64';
        if (hasFlag('-o')) return 'GNU/Linux';
        return 'Linux';
    }

    case 'hostname': return HOSTNAME;

    case 'date': {
        if (hasFlag('-u')) return new Date().toUTCString();
        if (params.length && params[0].startsWith('+')) {
            const d = new Date(), f = params[0].slice(1);
            return f.replace('%Y',d.getFullYear()).replace('%m',String(d.getMonth()+1).padStart(2,'0')).replace('%d',String(d.getDate()).padStart(2,'0')).replace('%H',String(d.getHours()).padStart(2,'0')).replace('%M',String(d.getMinutes()).padStart(2,'0')).replace('%S',String(d.getSeconds()).padStart(2,'0'));
        }
        return new Date().toString();
    }

    case 'cal': {
        const d = new Date(), m = d.getMonth(), y = d.getFullYear();
        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const firstDay = new Date(y,m,1).getDay();
        const daysInMonth = new Date(y,m+1,0).getDate();
        const cells = Array(firstDay).fill('  ');
        for (let dd=1;dd<=daysInMonth;dd++) cells.push(String(dd).padStart(2));
        const weeks = [];
        for (let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7).join(' '));
        return [`   ${MONTHS[m]} ${y}   `,'Su Mo Tu We Th Fr Sa',...weeks].join('\n');
    }

    case 'uptime': {
        const days = Math.floor(Math.random()*30)+1;
        return ` ${new Date().toLocaleTimeString('en-US')} up ${days} days,  3:22,  1 user,  load average: 0.08, 0.15, 0.12`;
    }

    case 'free': {
        const h = hasFlag('-h');
        const fmt = n => (h ? humanBytes(n).padStart(9) : String(n).padStart(14));
        return [
            '               total        used        free      shared  buff/cache   available',
            `Mem:   ${fmt(8*1024**2)} ${fmt(2*1024**2)} ${fmt(4*1024**2)} ${fmt(512*1024)} ${fmt(2*1024**2)} ${fmt(5.5*1024**2)}`,
            `Swap:  ${fmt(2*1024**2)} ${fmt(0)} ${fmt(2*1024**2)}`,
        ].join('\n');
    }

    case 'df': {
        const h = hasFlag('-h');
        return [
            `Filesystem   ${h?'Size':'1K-blocks'}    Used   Avail Use% Mounted on`,
            `/dev/sda1    ${h?'50G':'52428800'}  ${h?'12G':'12582912'} ${h?'36G':'37748736'} 25% /`,
            `tmpfs        ${h?'3.9G':'4063232'}      0  ${h?'3.9G':'4063232'}  0% /dev/shm`,
            `/dev/sda2    ${h?'200G':'209715200'} ${h?'45G':'47185920'} ${h?'145G':'152832000'} 24% /home`,
        ].join('\n');
    }
    case 'du': {
        const target = params[0] || cwd;
        const abs = resolvePath(target);
        const entries = Object.keys(vfs).filter(k => k===abs || k.startsWith(abs+'/'));
        const size = entries.reduce((a,k) => a+(vfs[k].size||4096), 0);
        return `${hasFlag('-h') ? humanBytes(size) : Math.ceil(size/1024)}\t${target}`;
    }

    case 'ps': {
        const pid = Math.floor(Math.random()*9000)+1000;
        if (hasFlag('-aux') || (args.includes('aux'))) {
            return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  168936 12288 ?        Ss   00:00   0:01 /sbin/init\n${username}   ${pid}  0.0  0.0   13456  4096 pts/0   Ss   ${new Date().toLocaleTimeString('en-US')}   0:00 bash`;
        }
        return `  PID TTY          TIME CMD\n    1 ?        00:00:01 init\n ${pid} pts/0    00:00:00 bash\n ${pid+1} pts/0    00:00:00 ps`;
    }

    case 'top':
    case 'htop': {
        const pid = Math.floor(Math.random()*9000)+1000;
        return [
            `top - ${new Date().toLocaleTimeString('en-US')} up 3 days, load average: 0.08, 0.15, 0.12`,
            `Tasks: 95 total,   1 running,  94 sleeping`,
            `%Cpu(s):  2.3 us,  0.7 sy,  0.0 ni, 96.8 id`,
            `MiB Mem:  7912.0 total,  4321.0 free,  2011.0 used`,
            `MiB Swap: 2048.0 total,  2048.0 free,     0.0 used`,
            '',
            `  PID USER     PR  NI    VIRT    RES %CPU %MEM COMMAND`,
            `    1 root     20   0  168936  12288  0.0  0.2 systemd`,
            ` ${pid} ${username.padEnd(8)} 20   0   13456   4096  0.0  0.1 bash`,
        ].join('\n');
    }

    case 'lsblk':
        return 'NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0    50G  0 disk\n├─sda1   8:1    0    48G  0 part /\n└─sda2   8:2    0     2G  0 part [SWAP]\nsdb      8:16   0   200G  0 disk\n└─sdb1   8:17   0   200G  0 part /home';

    case 'lscpu':
        return 'Architecture:             x86_64\nCPU op-mode(s):           32-bit, 64-bit\nCPU(s):                   8\nModel name:               Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz\nCPU max MHz:              5000.0000 MHz\nL3 cache:                 12288 KiB\nNUMA node(s):             1';

    case 'dmesg':
        return `[    0.000000] Linux version 6.1.0-18-amd64\n[    0.000000] Debian 6.1.69-1\n[    1.234567] Booting Debian GNU/Linux 13 (trixie)\n[    2.345678] systemd[1]: Reached target Multi-User System.`;

    case 'vmstat':
        return 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa\n 1  0      0 4321000 12288 2097152   0    0     1     2   50  100  2  1 97  0';

    case 'id': return `uid=1000(${username}) gid=1000(${username}) groups=1000(${username}),4(adm),24(cdrom),27(sudo),46(plugdev)`;
    case 'whoami': return username;
    case 'who':
    case 'w': return `${username}   pts/0   ${new Date().toLocaleString('en-US')} (:0)`;
    case 'last': return `${username}   pts/0   :0   ${new Date().toLocaleString('en-US')}   still logged in\nwtmp begins ${new Date(Date.now()-30*24*3600*1000).toLocaleDateString('en-US')}`;
    case 'groups': return `${username} adm cdrom sudo dip plugdev`;

    case 'env':
    case 'printenv':
        if (params.length) return params.map(p => envVars[p]??'').join('\n');
        return Object.entries(envVars).map(([k,v])=>`${k}=${v}`).join('\n');

    case 'export': {
        if (!params.length) return Object.entries(envVars).map(([k,v])=>`declare -x ${k}="${v}"`).join('\n');
        params.forEach(p => { const eq=p.indexOf('='); if(eq!==-1) envVars[p.slice(0,eq)]=p.slice(eq+1); });
        return null;
    }

    case 'unset': { params.forEach(p=>delete envVars[p]); return null; }
    case 'set': return Object.entries(envVars).map(([k,v])=>`${k}='${v}'`).join('\n');

    // ── Process management ────────────────────────────────────────
    case 'kill':
    case 'killall':
    case 'pkill':
        return params.length ? `(${cmd}: signal sent to ${params.join(', ')})` : `${cmd}: specify a process`;

    case 'jobs':   return '(no background jobs)';
    case 'bg':     return 'bash: bg: no current job';
    case 'fg':     return 'bash: fg: no current job';
    case 'nohup':  return 'nohup: ignoring input';
    case 'nice':   return `(nice: running with priority ${params[0]||'10'})`;
    case 'sleep':  return `(sleeping for ${params[0]||'1'}s — simulated)`;
    case 'true':   return null;
    case 'false':  return 'false: exited with code 1';

    case 'time': {
        if (!params.length) return 'usage: time COMMAND';
        const r = run(params[0], params.slice(1), null);
        return (r ? r+'\n\n' : '') + 'real\t0m0.001s\nuser\t0m0.000s\nsys\t0m0.000s';
    }

    case 'watch': {
        if (!params.length) return 'watch: missing command';
        return `(watch: '${params.join(' ')}' every 2s — displaying once)\n`+(run(params[0], params.slice(1), null)||'');
    }

    case 'xargs': return stdin ? (run(params[0]||'echo', [stdin], null)||'') : '(xargs: empty stdin)';
    // ── Network ───────────────────────────────────────────────────
    case 'ping': {
        if (!params.length) return 'ping: usage: ping HOST';
        const host = params[0];
        const count = parseInt(args[args.indexOf('-c')+1]) || 4;
        const ip = host==='localhost'?'127.0.0.1':host==='google.com'?'142.250.78.78':`${Math.floor(Math.random()*200+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        const lines = [`PING ${host} (${ip}) 56(84) bytes of data.`];
        for (let i=0;i<Math.min(count,4);i++) lines.push(`64 bytes from ${ip}: icmp_seq=${i+1} ttl=64 time=${(Math.random()*20+1).toFixed(3)} ms`);
        lines.push(`\n--- ${host} ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss`);
        return lines.join('\n');
    }

    case 'traceroute':
    case 'tracepath':
        return params.length ? `traceroute to ${params[0]}, 30 hops max:\n 1  192.168.1.1  1.234 ms\n 2  10.0.0.1  5.678 ms\n 3  * * *\n 4  ${params[0]}  15.432 ms` : `${cmd}: missing host`;

    case 'ifconfig':
    case 'ip': {
        const ip = `192.168.1.${Math.floor(Math.random()*200+10)}`;
        return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet ${ip}  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 00:1a:2b:3c:4d:5e  txqueuelen 1000  (Ethernet)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`;
    }

    case 'netstat':
    case 'ss':
        return `Netid  State   Recv-Q Send-Q  Local Address:Port  Peer Address:Port\ntcp    LISTEN  0      128     0.0.0.0:22         0.0.0.0:*\ntcp    LISTEN  0      128     0.0.0.0:80         0.0.0.0:*\ntcp    ESTAB   0      0       192.168.1.100:22   192.168.1.1:54321`;

    case 'nmap':
        return params.length
            ? `Nmap scan report for ${params[0]}\nHost is up (0.0015s).\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n443/tcp open  https\nNmap done: 1 IP (1 host up) in 0.52s`
            : 'nmap: missing host';

    case 'wget': {
        if (!params.length) return 'wget: missing URL';
        const file = params[0].split('/').pop() || 'index.html';
        fsTouch(resolvePath(file), `<!-- Downloaded from ${params[0]} -->`);
        return `--${new Date().toISOString()}--  ${params[0]}\nConnecting... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1024 (1.0K)\nSaving to: '${file}'\n100%[========================>] 1,024  in 0s\n'${file}' saved.`;
    }

    case 'curl': {
        if (!params.length) return 'usage: curl [options] URL';
        const url = params.find(p=>p.startsWith('http'))||params[0];
        if (url.includes('wttr.in')) return `Weather forecast — Rio de Janeiro:\n   ☁  Partly cloudy\n   28°C  Humidity: 75%  ↙ 15 km/h`;
        if (url.includes('api.') || url.includes('.json')) return `{"status":"ok","url":"${url}","simulated":true}`;
        return `<!-- Content from ${url} (simulated) -->\n<html><body>OK</body></html>`;
    }

    case 'ssh':
        return params.length ? `ssh: connect to host ${params[0]} port 22: Connection refused (simulated)` : 'usage: ssh [user@]host';

    case 'scp': return '(scp: simulated transfer completed)';

    // ── Package management ────────────────────────────────────────
    case 'apt':
    case 'apt-get': {
        const sub = params[0];
        if (!sub) return 'usage: apt [update|upgrade|install|remove|search|list|show]';
        if (sub === 'update') {
            const bytes = Math.floor(Math.random() * 900) + 100;
            const pkgs = Math.floor(Math.random() * 50) + 1;
            return `Hit:1 http://deb.debian.org/debian trixie InRelease
Get:2 http://security.debian.org/debian-security trixie-security InRelease [48.0 kB]
Get:3 http://deb.debian.org/debian trixie-updates InRelease [50.0 kB]
Fetched ${bytes} kB in 1s (${bytes} kB/s)
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
${pkgs} packages can be upgraded. Run 'apt list --upgradable' to see them.`;
        }
        if (sub==='upgrade') return 'Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove.';
        if (sub==='install') {
    if (!params[1]) return 'apt: missing package name';
    
    // Simula a criação do executável
    const binPath = `/usr/bin/${params[1]}`;
    fsTouch(binPath, '(binary executable)');
    vfs[binPath].perms = '-rwxr-xr-x'; // Dá permissão de execução
    
    return `Reading package lists... Done\nInstalling ${params[1]}...\nSetting up ${params[1]}... Done`;
}
        if (sub==='autoremove') return '0 extra packages removed.';
        if (sub==='search')  return `${params[1]||'package'}/trixie 1.0.0 amd64\n  Package description (simulated)`;
        if (sub==='list')    return 'bash/trixie 5.2.15-2+b2 amd64 [installed]\ncurl/trixie 7.88.1-10 amd64 [installed]\ngit/trixie 2.39.5 amd64 [installed]\nnano/trixie 7.2-1 amd64 [installed]\npython3/trixie 3.11.4-1 amd64 [installed]';
        if (sub==='show')   return `Package: ${params[1]||'?'}\nVersion: 1.0.0\nArchitecture: amd64\nDescription: Simulated package`;
        return `apt: '${sub}': subcommand not supported`;
    }

    case 'dpkg': {
        if (hasFlag('-l')) return 'ii  bash         5.2.15-2+b2  amd64  GNU Bourne Again SHell\nii  coreutils    9.1-1        amd64  GNU core utilities\nii  git          2.39.5       amd64  Fast, scalable, distributed revision control system';
        return `dpkg: ${params[0]||'unknown subcommand'}`;
    }

    case 'snap': {
        const sub = params[0];
        if (sub==='list') return 'Name  Version  Rev  Tracking  Publisher';
        if (sub==='install') return `(snap: installing '${params[1]}' — simulated)`;
        return `snap: ${sub||'missing subcommand'}`;
    }

    // ── Services ──────────────────────────────────────────────────
    case 'systemctl': {
        const sub = params[0], svc = params[1]||'system';
        if (!sub) return 'usage: systemctl [start|stop|restart|status|enable|disable|list-units]';
        if (sub==='status') return `● ${svc}.service\n   Loaded: loaded (/lib/systemd/system/${svc}.service; enabled)\n   Active: active (running) since ${new Date().toLocaleString('en-US')}\nMain PID: ${Math.floor(Math.random()*9000+1000)} (${svc})`;
        if (sub==='start')   return `(${svc} started)`;
        if (sub==='stop')    return `(${svc} stopped)`;
        if (sub==='restart') return `(${svc} restarted)`;
        if (sub==='enable')  return `Created symlink /etc/systemd/system/multi-user.target.wants/${svc}.service`;
        if (sub==='disable') return `Removed /etc/systemd/system/multi-user.target.wants/${svc}.service`;
        if (sub==='list-units') return 'UNIT                 LOAD   ACTIVE SUB     DESCRIPTION\nssh.service          loaded active running OpenSSH Daemon\nnginx.service        loaded active running A high performance web server\ncron.service         loaded active running Regular background program processing';
        if (sub==='daemon-reload') return null;
        return `systemctl: '${sub}': unrecognized`;
    }

    case 'service': {
        const svc=params[0], sub=params[1];
        return svc ? `(service ${svc} ${sub||'status'} — simulated)` : 'usage: service NAME [start|stop|restart|status]';
    }

    case 'journalctl':
        return `-- Logs begin at ${new Date(Date.now()-7*24*3600*1000).toLocaleDateString('en-US')} --\n${new Date().toLocaleString('en-US')} ${HOSTNAME} kernel: Linux version 6.1.0-18-amd64\n${new Date().toLocaleString('en-US')} ${HOSTNAME} systemd: Started Debian GNU/Linux.\n${new Date().toLocaleString('en-US')} ${HOSTNAME} sshd: Server listening on port 22.`;

    case 'crontab':
        if (hasFlag('-l')) return '# No crontabs for this user\n# m h dom mon dow command';
        if (hasFlag('-e')) return '(crontab -e: use a real terminal to edit)';
        if (hasFlag('-r')) return '(crontab removed)';
        return 'usage: crontab [-l] [-e] [-r]';
        
    case 'sudo': {
        if (!args.length) return 'usage: sudo COMMAND';
        
        const targetCmd = args[0];
        const targetArgs = args.slice(1);
        
        // Verifica se o comando rodado com sudo é "rm /" ou "rm /*"
        if (targetCmd === 'rm' && (targetArgs.includes('/') || targetArgs.includes('/*'))) {
            $termScreen.style.display = 'none';
            const panicDiv = document.createElement('div');
            panicDiv.style.position = 'fixed';
            panicDiv.style.top = '0';
            panicDiv.style.left = '0';
            panicDiv.style.width = '100vw';
            panicDiv.style.height = '100vh';
            panicDiv.style.backgroundColor = '#c24b75';
            panicDiv.style.display = 'flex';
            panicDiv.style.justifyContent = 'center';
            panicDiv.style.alignItems = 'center';
            panicDiv.style.zIndex = '99999';
            panicDiv.style.cursor = 'pointer'; 
            const img = document.createElement('img');
            img.src = 'kernel_panic.jpg';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            panicDiv.addEventListener('click', () => { location.reload(); });
            panicDiv.appendChild(img);
            document.body.appendChild(panicDiv);
            return null;
        }

        // Repassa os argumentos INTACTOS (mantendo o -rf)
        return `[sudo] password for ${username}: \n` + (run(targetCmd, targetArgs, null) ?? '');
    }


    case 'su': return `Password:\n(su: authenticated as ${params||'root'} — simulated)`;
    case 'passwd': return `Changing password for ${username}.\nCurrent password:\nNew password:\nRetype new password:\npassword updated successfully.`;

    case 'useradd':
    case 'adduser':
        return params ? `Adding user '${params}'...\nCreating home directory '/home/${params}'.\nDone.` : `${cmd}: missing name`;

    case 'userdel':
    case 'deluser':
        return params ? `Removing user '${params}'... (simulated)` : `${cmd}: missing name`;

    case 'groupadd': return params ? `Group '${params}' created.` : 'groupadd: missing name';


    // ── Dev tools ─────────────────────────────────────────────────
    case 'git': {
        const sub = params;
        if (!sub) return 'usage: git [--version] [--help] <command> [<args>]';
        if (sub==='init') return `Initialized empty Git repository in ${cwd}/.git/`;
        if (sub==='clone') return `Cloning into '${(params||'repo').split('/').pop()}'...\nremote: Enumerating objects: 10, done.\nTotal 10 (delta 0), done.`;
        if (sub==='status') return `On branch master\n\nnothing to commit, working tree clean`;
        if (sub==='log') return `commit a1b2c3d4e5f6 (HEAD -> master)\nAuthor: ${username} <${username}@example.com>\nDate:   ${new Date().toLocaleString('en-US')}\n\n    Initial commit`;
        if (sub==='add') return null;
        if (sub==='commit') { const msg=args[args.indexOf('-m')+1]||'update'; return `[master a1b2c3d] ${msg}\n 1 file changed, 1 insertion(+)`; }
        if (sub==='push') return `Enumerating objects: 3\nCounting objects: 100% (3/3)\nTo github.com:${username}/repo.git\n   a1b2c3d..d4e5f6g  master -> master`;
        if (sub==='pull') return 'Already up to date.';
        if (sub==='branch') return params ? `Branch '${params}' created.` : `* master\n  develop\n  feature/new-feature`;
        if (sub==='checkout') return `Switched to ${args.includes('-b')?'new ':''}branch '${params||'master'}'`;
        if (sub==='merge') return `Updating a1b2c3d..d4e5f6g\nFast-forward\n 1 file changed`;
        if (sub==='diff') return '(no differences)';
        if (sub==='stash') return 'Saved working directory and index state WIP on master: a1b2c3d';
        if (sub==='remote') return `origin  git@github.com:${username}/repo.git (fetch)\norigin  git@github.com:${username}/repo.git (push)`;
        if (sub==='fetch') return '(fetch completed)';
        if (sub==='tag') return params ? `Tag '${params}' created.` : 'v1.0.0\nv1.1.0\nv2.0.0';
        if (sub==='reset') return `HEAD is now at a1b2c3d`;
        if (sub==='config') return null;
        if (sub==='--version') return 'git version 2.39.5';
        return `git: '${sub}' is not a git command. See 'git --help'.`;
    }

    case 'python':
    case 'python3': {
        if (!params.length) return 'Python 3.14.5 (main, May 10 2026)\nType "help", "copyright" for more information.\n>>> (interactive mode not supported)';
        const n = fsGet(resolvePath(params));
        return n ? `(executing ${params} — simulated)` : `python3: can't open file '${params}': [Errno 2] No such file or directory`;
    }

    case 'node':
    case 'nodejs':
        return params.length ? `(executing ${params} with Node.js — simulated)` : `Welcome to Node.js v20.11.0.\n> (interactive mode not supported)`;

    case 'npm': {
        const sub = params;
        if (sub==='install'||sub==='i') return `added ${Math.floor(Math.random()*500+100)} packages in ${(Math.random()*5+1).toFixed(1)}s`;
        if (sub==='start') return `> project@1.0.0 start\n> node index.js\n\nServer running at http://localhost:3000`;
        if (sub==='run') return `> project@1.0.0 ${params}\nexecuting '${params}'...`;
        if (sub==='list'||sub==='ls') return `project@1.0.0 ${cwd}\n├── express@4.18.2\n├── lodash@4.17.21\n└── axios@1.6.0`;
        if (sub==='init') { fsTouch(resolvePath('package.json'),`{\n  "name": "${cwd.split('/').pop()}",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {}\n}`); return 'package.json created.'; }
        if (sub==='--version'||sub==='-v') return '10.2.4';
        return `npm: '${sub}': unknown command`;
    }

    case 'yarn': {
        const sub=params;
        if (!sub||sub==='install') return `yarn install v1.22.21\n[1/4] Resolving packages...\n[2/4] Fetching packages...\n✨ Done in 3.21s.`;
        if (sub==='add') return `success Saved lockfile.\nDone in 1.23s.`;
        return `yarn ${sub}: completed`;
    }

    case 'gcc':
    case 'g++':
    case 'cc': {
        if (!params.length) return `${cmd}: no input files`;
        const outFile = args[args.indexOf('-o')+1] || 'a.out';
        vfs[resolvePath(outFile)] = { type:'file', content:'(binary)', perms:'-rwxr-xr-x', size:8192, mdate:nowStr() };
        return `(compiled: ${params.filter(p=>!p.startsWith('-')).join(' ')} → ${outFile})`;
    }

    case 'make':
        return `make: Entering directory '${cwd}'\ngcc -Wall -o program main.c\nmake: Leaving directory '${cwd}'`;

    case 'cargo': {
        const sub=params;
        if (sub==='new') { fsMkdir(resolvePath(params)); return `Created binary \`${params}\` package`; }
        if (sub==='build') return `Compiling project v0.1.0\n    Finished dev [unoptimized] target(s) in 2.34s`;
        if (sub==='run') return `Compiling project v0.1.0\n     Running \`target/debug/project\`\nHello, world!`;
        return `cargo: '${sub}': unrecognized`;
    }

    case 'which': {
        if (!params.length) return 'usage: which COMMAND';
        const bin = {bash:'/bin/bash',python3:'/usr/bin/python3',python:'/usr/bin/python3',node:'/usr/bin/node',git:'/usr/bin/git',npm:'/usr/bin/npm',gcc:'/usr/bin/gcc',make:'/usr/bin/make',nano:'/bin/nano',vim:'/usr/bin/vim',ssh:'/usr/bin/ssh',curl:'/usr/bin/curl',wget:'/usr/bin/wget',grep:'/usr/bin/grep',awk:'/usr/bin/awk',sed:'/bin/sed',find:'/usr/bin/find',tar:'/usr/bin/tar',zip:'/usr/bin/zip'};
        return params.map(p => bin[p] || `which: no ${p} in (${envVars.PATH})`).join('\n');
    }

    case 'whereis':
        return params.length ? `${params}: /usr/bin/${params} /usr/share/man/man1/${params}.1.gz` : 'usage: whereis COMMAND';

    case 'locate':
        return params.length ? (Object.keys(vfs).filter(k=>k.includes(params)).join('\n') || `locate: no match found for '${params}'`) : 'locate: missing pattern';

    case 'man': {
        if (!params.length) return 'What manual page do you want?';
        const pages = {
            ls:'LS(1)\n\nNAME\n  ls - list directory contents\n\nSYNOPSIS\n  ls [OPTION]... [FILE]...\n\nOPTIONS\n  -a  include hidden entries\n  -l  use a long listing format\n  -h  human-readable sizes\n  -r  reverse order',
            cd:'CD(1)\n\nNAME\n  cd - change the working directory\n\nSYNOPSIS\n  cd [DIR]\n\n  cd ~   → home directory\n  cd ..  → parent directory\n  cd -   → previous directory',
            grep:'GREP(1)\n\nNAME\n  grep - print lines matching a pattern\n\nSYNOPSIS\n  grep [OPTION]... PATTERN [FILE]...\n\nOPTIONS\n  -i  ignore case distinctions\n  -v  invert match\n  -c  print count\n  -r  recursive',
            git:'GIT(1)\n\nNAME\n  git - the stupid content tracker\n\nMAIN COMMANDS\n  init, clone, add, commit, push, pull\n  status, log, branch, checkout, merge, diff',
            find:'FIND(1)\n\nNAME\n  find - search for files in a directory hierarchy\n\nEXAMPLES\n  find . -name "*.txt"\n  find /home -type f\n  find . -type d',
        };
        return pages[params] || `No manual entry for ${params}`;
    }
    // ── Editors (simulated) ───────────────────────────────────────
    case 'nano':
    case 'vim':
    case 'vi':
    case 'nvim':
    case 'emacs':
    case 'gedit':
    case 'code': {
        if (!params.length) return `(${cmd}: no file specified)\nTip: use 'echo "text" > file' to create files`;
        const abs = resolvePath(params[0]);
        if (!vfs[abs]) fsTouch(abs, '');
        return `(${cmd}: '${params[0]}' — simulated editing)\nTip: use 'echo "text" > ${params[0]}' to write`;
    }

    // ── Archive ───────────────────────────────────────────────────
    case 'tar': {
        if (!args.length) return 'tar: You must specify one of the \'-Acdtrux\', \'---delete\' or \'---test-label\' options\nExamples: tar -czf file.tar.gz folder/  |  tar -xzf file.tar.gz';
        const create  = flags.some(f=>f.includes('c'));
        const extract = flags.some(f=>f.includes('x'));
        const list    = flags.some(f=>f.includes('t'));
        if (extract) return `(tar: extracting ${params[0]||'archive.tar'} — simulated)`;
        if (list) return `${params[0]||'archive.tar'}:\n./\n./readme.txt\n./folder/\n./folder/file.txt`;
        if (create) { const f=params[0]||'archive.tar.gz'; vfs[resolvePath(f)]={type:'file',content:'(binary)',perms:'-rw-r--r--',size:2048,mdate:nowStr()}; return `(tar: ${f} created)`; }
        return '(tar: simulated operation)';
    }

    case 'zip': {
        if (!params.length) return 'zip: missing operand';
        const f = params[0].endsWith('.zip') ? params[0] : params[0]+'.zip';
        vfs[resolvePath(f)] = {type:'file',content:'(binary)',perms:'-rw-r--r--',size:1024,mdate:nowStr()};
        return `  adding: ${params.slice(1).join(', ')} (deflated 60%)\n${f} created.`;
    }

    case 'unzip':
        return params.length ? `Archive: ${params[0]}\n  inflating: file.txt\n(simulated)` : 'unzip: missing archive name';

    case 'gzip': {
        if (!params.length) return 'gzip: missing file operand';
        const abs=resolvePath(params[0]); if(vfs[abs]){vfs[abs+'.gz']={...vfs[abs]};delete vfs[abs];} return null;
    }
    case 'gunzip': {
        if (!params.length) return 'gunzip: missing file operand';
        const abs=resolvePath(params[0]); if(vfs[abs]){const nf=abs.replace(/\.gz$/,'');vfs[nf]={...vfs[abs]};delete vfs[abs];} return null;
    }
    case 'bzip2':
    case 'xz':
    case 'zstd': return `(${cmd}: simulated compression)`;

    // ── Misc utilities ────────────────────────────────────────────
    case 'history': {
        if (!cmdHistory.length) return '(empty history)';
        const n = parseInt(params[0]) || cmdHistory.length;
        return cmdHistory.slice(0,n).map((c,i)=>`  ${String(i+1).padStart(4)}  ${c}`).reverse().join('\n');
    }

    case 'alias': {
        if (!params.length) return Object.entries(aliases).map(([k,v])=>`alias ${k}='${v}'`).join('\n') || '(no aliases)';
        params.forEach(p=>{const eq=p.indexOf('=');if(eq!==-1)aliases[p.slice(0,eq)]=p.slice(eq+1).replace(/^['"]|['"]$/g,'');});
        return null;
    }
    case 'unalias': { params.forEach(p=>delete aliases[p]); return null; }

    case 'type': {
        if (!params.length) return 'type: missing operand';
        const builtins=['cd','echo','pwd','export','alias','history','type','source','set','unset'];
        return params.map(p=>builtins.includes(p)?`${p} is a shell builtin`:aliases[p]?`${p} is aliased to '${aliases[p]}'`:`${p} is /usr/bin/${p}`).join('\n');
    }

    case 'source':
    case '.': return `(source: '${params[0]||''}' loaded — simulated)`;

    case 'seq': {
        if (!params.length) return 'seq: missing operand';
        const [a,b,c] = params.map(Number);
        const [start,end,step] = c!==undefined?[a,c,b]:b!==undefined?[a,b,1]:[1,a,1];
        const r=[];
        for(let i=start;step>0?i<=end:i>=end;i+=step)r.push(i);
        return r.join('\n');
    }

    case 'yes': return Array(8).fill(params[0]||'y').join('\n')+'\n(interrupted)';

    case 'bc': {
    if (params.length) {
        const expr = params.join(' ');
        if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) return 'bc: invalid expression';
        try { return String(eval(expr)); } catch { return 'bc: invalid expression'; }
    }
    return 'bc 1.07.1 — arithmetic calculator\n(usage: echo "2+2" | bc)';
    }

    case 'expr': {
    const expr = args.join(' ');
    if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) return 'expr: invalid expression';
    try { return String(eval(expr)); }
    catch { return 'expr: invalid expression'; }
    }

    case 'factor': {
        if (!params.length) return 'factor: missing operand';
        const n = parseInt(params[0]);
        if (isNaN(n)||n<1) return `factor: '${params[0]}': is not a valid number`;
        const factors=[];let num=n;
        for(let i=2;i*i<=num;i++) while(num%i===0){factors.push(i);num/=i;}
        if(num>1) factors.push(num);
        return `${n}: ${factors.join(' ')}`;
    }

    case 'strace':
    case 'ltrace': return `(${cmd}: tracing '${params.join(' ')}' — simulated)`;

    case 'ldd':
        return params.length ? `\tlinux-vdso.so.1 (0x00007fff12345678)\n\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6\n\t/lib64/ld-linux-x86-64.so.2` : 'ldd: missing file operand';

    case 'gdb': return `GNU gdb (Debian 13.2-1) 13.2\n(gdb) (interactive mode not supported)`;
    case 'valgrind': return `==12345== Memcheck, a memory error detector\n==12345== HEAP SUMMARY: in use at exit: 0 bytes in 0 blocks\n==12345== All heap blocks were freed -- no leaks are possible`;

    case 'openssl': {
        const sub=params[0];
        if (sub==='version') return 'OpenSSL 3.0.11 19 Sep 2023';
        if (sub==='rand') return Array.from({length:parseInt(params[1])||8},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('');
        return `OpenSSL 3.0.11 — usage: openssl [version|rand|enc|genrsa|...]`;
    }

    case 'ssh-keygen': {
        const t=args[args.indexOf('-t')+1]||'rsa';
        const f=args[args.indexOf('-f')+1]||`${envVars.HOME}/.ssh/id_${t}`;
        fsTouch(f,'-----BEGIN OPENSSH PRIVATE KEY-----\n(simulated key)\n-----END OPENSSH PRIVATE KEY-----');
        fsTouch(f+'.pub',`${t}-key AAAA...SIMULATED== ${username}@${HOSTNAME}`);
        return `Generating public/private ${t} key pair.\nYour identification has been saved in ${f}.\nYour public key has been saved in ${f}.pub.`;
    }

    case 'gpg': return `(gpg: operation '${params[0]||''}' — simulated)`;

    case 'ascii': return 'ASCII table (32-127):\n'+Array.from({length:96},(_,i)=>`${i+32}: ${String.fromCharCode(i+32)}`).reduce((a,v,i)=>i%8===0?a+'\n'+v:a+'\t'+v,'').trim();

    case 'weather': return `Weather forecast — Rio de Janeiro, BR\n   ☁  Partly cloudy\n   Temperature: 28°C\n   Humidity: 75%  |  Wind: 15 km/h SW\n   Tip: use 'curl wttr.in/rio' for detailed forecast`;
    // ── Fun / Easter eggs ─────────────────────────────────────────
    case 'cowsay':
    case 'cowthink': {
        const text = params.join(' ') || 'Moo!';
        const border = '-'.repeat(text.length+2);
        const bubble = cmd==='cowthink' ? `( ${text} )` : `< ${text} >`;
        return [` ${border}`, ` ${bubble}`, ` ${border}`, '         \\   ^__^', '          \\  (oo)\\_______', '             (__)\\       )\\/\\', '                 ||----w |', '                 ||     ||'].join('\n');
    }

        case 67:
        case '67':{
        // Alvo do GIF do meme do 67
        const gifUrl = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2lmOGVvNnRtNzRkeGU2bXBzOWR4eGNvMTJ6eWwwNGdrYWo0eGxtNCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/08uBcURaMq6vA93TGc/giphy.gif';

        // Cria uma linha no terminal para renderizar a imagem
        const line = document.createElement('div');
        line.className = 'output';
        
        const img = document.createElement('img');
        img.src = gifUrl;
        img.style.maxWidth = '300px'; // Ajuste o tamanho como preferir
        img.style.marginTop = '10px';
        img.style.borderRadius = '4px';

        line.appendChild(img);
        $terminal.appendChild(line);
        scrollBottom();

        return null;
    }

        

    case 'fortune': {
        const fortunes = [
            'A journey of a thousand miles begins with a single step. — Lao Tzu',
            '"It works on my machine." — Every developer, ever.',
            'sudo make me a sandwich.',
            'rm -rf / — Do not try this at home.',
            'The best time to backup was yesterday. The second best is now.',
            'Talk is cheap. Show me the code. — Linus Torvalds',
            'First, solve the problem. Then, write the code.',
            'Debugging is twice as hard as writing the code.',
            'Always code as if the guy who maintains your code will be a violent psychopath who knows where you live.',
            'There are 10 types of people: those who understand binary and those who don\'t.',
            'A computer is a stupid machine with the ability to do incredibly smart things. — Bill Bryson',
        ];
        return fortunes[Math.floor(Math.random()*fortunes.length)];
    }

    case 'sl': return [
        '        ====        ________                ___________       ',
        '    _D _|  |_______/        \\__I_I_____===__|_________|       ',
        '     |(_)---  |   H\\________/ |   |        =|___ ___|        ',
        '     /     |  |   H  |  |     |   |         ||_| |_||        ',
        '    |      |  |   H  |__--------------------| [___] |         ',
        '    | ________|___H__/__|_____/[][]~\\_______|       |         ',
        '    |/ |   |-----------I_____I [][] []  D   |=======|         ',
        '  __/ =| o |=-O=====O=====O=====O\\ ____Y___________|_        ',
        ' |/-=|___|= ||    ||    ||    ||  \\________/                 ',
        '  \\_/      \\__/  \\__/  \\__/  \\__/    =====          \\_/ ',
        '',
        '  [ 🚂 SL: Did you mean ls? ]',
    ].join('\n');

    case 'cmatrix':
    case 'matrix': {
        const chars = '01アイウエオカキクケコサシスセソタチ';
        return Array.from({length:8}, ()=>
            Array.from({length:40}, ()=>chars[Math.floor(Math.random()*chars.length)]).join(' ')
        ).join('\n')+'\n\n[ Press Ctrl+C to exit — simulated ]';
    }

    case 'lolcat': return stdin ?? (params.length ? run('cat', params, null) : '(lolcat: empty input)');

    case 'toilet': return `(toilet: "${params.join(' ')||'Linux'}" — simulated)`;
    case 'banner': return `###  ${params.join(' ').toUpperCase()}  ###`;
    case 'figlet': return `(figlet: "${params.join(' ')||'Linux'}" — simulated)`;

    case 'neofetch':
    case 'fastfetch':
    case 'screenfetch': {
        const files = Object.keys(vfs).filter(k=>k.startsWith(envVars.HOME)).length;
        return [
            `       _,met$$$$$gg.          ${username}@${HOSTNAME}`,
            `    ,g$$$$$$$$$$$$$$$P.       ${'─'.repeat((username+HOSTNAME).length+1)}`,
            `  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 13 (trixie) x86_64`,
            ` ,$$P'              \`$$$.     Kernel: 6.1.0-18-amd64`,
            `',$$P       ,ggs.     \`$$b:   Uptime: ${Math.floor(Math.random()*30)+1} days, 3 hours`,
            `\`d$$'     ,$$P"'   .    $$$   Shell: bash 5.2.15`,
            ` $$P      d$'     ,$$P  $$P   Terminal: xterm-256color`,
            ` $$:      $$.   -'$$:  ,d$$'  CPU: Intel i7-10750H (8) @ 5.0GHz`,
            ` $$\\;      Y$b._   \`___dsP    GPU: NVIDIA GeForce GTX 1650`,
            `   Y$$.    \`./\\YS$$$$P"'      Memory: 2011MiB / 7912MiB`,
            `    \`$$b      "-.__            Disk: 57G / 250G`,
            `     \`Y$$                      Files: ${files} in $HOME`,
            `      \`Y$$.`,
            `        \`$$b.`,
            `          \`Y$$b.`,
            `             \`"Y$b._`,
            `                 \`""""`,
        ].join('\n');
    }

    // ── Session ───────────────────────────────────────────────────
    case 'clear':
    case 'reset':
        $terminal.innerHTML = '';
        return null;

    case 'exit':
    case 'logout': {
        addOut(`Closing session... Goodbye, ${username}!`);
        $termScreen.dataset.exiting = '1';
        setTimeout(() => {
            $terminal.innerHTML = '';
            $termScreen.style.display = 'none';
            delete $termScreen.dataset.exiting;
            $loginScreen.style.display = 'flex';
            $loginInput.value = '';
            $loginInput.focus();
            username = ''; vfs = {}; cmdHistory = []; aliases = {};
        }, 1200);
        return null;
    }

    case 'reboot':
        addOut('Rebooting the system...');
        setTimeout(() => location.reload(), 1500);
        return null;

    case 'poweroff':
    case 'halt':
    case 'shutdown': {
        const off = hasFlag('-h','-P') || params[0]==='now' || params.includes('now') || cmd!=='shutdown';
        addOut(off ? 'Shutting down the system...' : `shutdown: scheduled.`);
        if (off) setTimeout(() => { $terminal.innerHTML=''; addOut('System halted. Refresh the page to restart.'); }, 1500);
        return null;
    }
    // ── Help ──────────────────────────────────────────────────────
    case 'help':
    case '--help':
        return [
            '_403 — Simulated Linux Terminal',
            '',
            'NAVIGATION   cd  ls  ll  la  l  pwd  tree  dir',
            'FILES        touch  mkdir  rm  cp  mv  cat  tac  head  tail  wc  file  stat',
            '             find  ln  truncate  fallocate  shred  dd  rsync',
            'TEXT         echo  grep  sed  awk  sort  uniq  cut  tr  diff  nl  rev  tee',
            '             fold  expand  unexpand  shuf  paste  join  comm  look  iconv',
            'HEX/ENCODE   base64  md5sum  sha256sum  xxd  od  hexdump  strings  morse',
            '             binary  hex  fromhex  rot13  urlencode  urldecode  ascii',
            'SYSTEM       uname  hostname  date  cal  uptime  free  df  du  ps  top  htop',
            '             lsblk  lscpu  lshw  lspci  lsusb  dmesg  vmstat  iostat  sar',
            '             pidstat  sensors  acpi  hdparm  smartctl  sysctl  lsmod',
            '             modprobe  insmod  rmmod  dmidecode  update-grub',
            'IDENTITY     id  whoami  who  w  last  groups  finger',
            'ENVIRONMENT  env  export  printenv  set  unset  alias  unalias  history  type  source',
            'NETWORK      ping  traceroute  mtr  ifconfig  ip  arp  route  netstat  ss',
            '             nmap  wget  curl  ssh  scp  telnet  ftp  sftp  nc  iperf3  ab',
            '             whois  dig  host  nslookup  proxychains  myip  ipinfo  ports  headers',
            'SECURITY     iptables  ufw  tcpdump  hydra  john  hashcat  nikto  sqlmap',
            '             ssh-keygen  openssl  gpg  aircrack-ng  msfconsole  burpsuite',
            'PACKAGES     apt  apt-get  dpkg  snap  dpkg-reconfigure',
            'SERVICES     systemctl  service  journalctl  crontab  at  batch',
            'PROCESSES    kill  killall  pkill  jobs  bg  fg  nice  nohup  sleep  time  watch  xargs  lsof  fuser',
            'COMPRESSION  tar  zip  unzip  gzip  gunzip  bzip2  xz  dd',
            'DISK         fdisk  mkfs  fsck  blkid  mount  umount  lsof',
            'DEV          git  python3  pip3  node  npm  yarn  php  ruby  perl  lua  go',
            '             gcc  g++  make  cmake  cargo  docker  docker-compose  kubectl',
            '             terraform  ansible  which  whereis  locate  man  gdb  valgrind',
            'EDITORS      nano  vim  vi  nvim  emacs  (all simulated)',
            'USERS        passwd  su  sudo  useradd  userdel  groupadd  addgroup  delgroup',
            '             chsh  chfn  chage  visudo  update-alternatives  mesg  write  wall',
            'TERMINAL     screen  tmux  script',
            'MATH         bc  expr  factor  seq  numfmt  units',
            'UTILITIES    weather  randpw  uuid  notify-send  xdg-open  at  convert  ffmpeg',
            'FUN/EASTER   cowsay  fortune  sl  figlet  cmatrix  lolcat  neofetch  banner',
            'SHORTCUTS    ctf  cheatsheet  _403  ll  la  cls  ports  myip  binary  hex  rot13',
            'SESSION      clear  reset  exit  logout  reboot  shutdown  poweroff',
            '',
            'Shortcuts: ↑↓ history | Tab autocomplete | Ctrl+C cancel | Ctrl+L clear',
            'Redirection: cmd > file  |  cmd >> file  |  cmd1 | cmd2',
            'Logic:       cmd1 && cmd2 (on ok)  |  cmd1 || cmd2 (on fail)',
            '',
            'Tip: try \'ctf\' for hacking resources or \'cheatsheet bash\'',
        ].join('\n');


    // ════════════════════════════════════════════════════════════════
    //  NEW COMMANDOS — SECURITY, NETWORK, SYSTEM, DEV, MISC
    // ════════════════════════════════════════════════════════════════
    // ── DNS / Advanced Network ────────────────────────────────────
    case 'whois': {
        if (!params.length) return 'usage: whois DOMAIN';
        const d = params[0];
        return `Domain Name: ${d.toUpperCase()}\nRegistrar: Example Registrar, Inc.\nCreation Date: 2010-01-15\nExpiry Date: 2027-01-15\nName Server: ns1.${d}\nName Server: ns2.${d}\nDNSSEC: unsigned\nStatus: clientTransferProhibited`;
    }

    case 'dig': {
        if (!params.length) return 'usage: dig [@server] DOMAIN [TYPE]';
        const domain = params.find(p => !p.startsWith('@')) || 'example.com';
        const type = params[0] || 'A';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `; <<>> DiG 9.18.19 <<>> ${domain}\n;; QUESTION SECTION:\n;${domain}.\t\tIN\t${type}\n\n;; ANSWER SECTION:\n${domain}.\t\t300\tIN\t${type}\t${ip}\n\n;; Query time: 12 msec\n;; SERVER: 8.8.8.8#53`;
    }

    case 'host': {
        if (!params.length) return 'usage: host NAME [SERVER]';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `${params[0]} has address ${ip}\n${params[0]} has IPv6 address 2001:db8::1\n${params[0]} mail is handled by 10 mail.${params[0]}`;
    }
    case 'nslookup': {
        if (!params.length) return 'usage: nslookup NAME [SERVER]';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `Server:\t\t8.8.8.8\nAddress:\t8.8.8.8#53\n\nNon-authoritative answer:\nName:\t${params[0]}\nAddress: ${ip}`;
    }

    case 'arp': {
        if (hasFlag('-a')) return `? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0\n? (192.168.1.100) at 11:22:33:44:55:66 [ether] on eth0`;
        return `Address               HWtype  HWaddress           Flags Mask            Iface\n192.168.1.1           ether   aa:bb:cc:dd:ee:ff   C                     eth0`;
    }

    case 'route': {
        if (hasFlag('-n')) return `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`;
        return `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\ndefault         _gateway        0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`;
    }

    case 'mtr': {
        if (!params.length) return 'usage: mtr HOST';
        return `Start: ${new Date().toLocaleString('en-US')}\nHOST: ${HOSTNAME}                   Loss%   Snt   Last   Avg  Best  Wrst StDev\n  1.|-- 192.168.1.1               0.0%    10    1.2   1.3   1.1   1.8   0.2\n  2.|-- 10.0.0.1                  0.0%    10    5.4   5.6   5.1   6.2   0.3\n  3.|-- ${params}               0.0%    10   12.3  12.5  12.0  13.1  0.3`;
    }

    case 'iperf3': {
        if (!params.length) return 'usage: iperf3 -s (server) | iperf3 -c HOST (client)';
        if (hasFlag('-s')) return `-----------------------------------------------------------\nServer listening on port 5201\n-----------------------------------------------------------\nAccepting connections...`;
        const bw = (Math.random()*900+100).toFixed(1);
        return `Connecting to host ${params}, port 5201\n[  5] local 192.168.1.100 port 54321 connected to ${params} port 5201\n[ ID] Interval           Transfer     Bitrate\n[  5]   0.00-10.00  sec   ${(parseFloat(bw)/80).toFixed(2)} GBytes  ${bw} Mbits/sec  sender\n[  5]   0.00-10.00  sec   ${(parseFloat(bw)/80*0.99).toFixed(2)} GBytes  ${(parseFloat(bw)*0.99).toFixed(1)} Mbits/sec  receiver`;
    }

    case 'nc':
    case 'netcat':
    case 'ncat':
        if (hasFlag('-l')) return `(${cmd}: listening on port ${params||'4444'} — simulated)`;
        return params.length ? `(${cmd}: connecting to ${params}:${params[1]||'80'} — simulated)` : `usage: ${cmd} [-l] HOST PORT`;

    case 'telnet':
        return params.length ? `Trying ${params}...\nConnected to ${params}.\nEscape character is '^]'.\n(telnet: simulated connection)` : 'usage: telnet HOST [PORT]';

    case 'ftp':
    case 'sftp':
        return params.length ? `Connected to ${params}.\n220 FTP server ready.\nName (${params}:${username}): (${cmd}: simulated session)` : `usage: ${cmd} HOST`;

    case 'proxychains':
    case 'proxychains4':
        if (!params.length) return 'usage: proxychains COMMAND [ARGS]';
        return `[proxychains] config file found: /etc/proxychains4.conf\n[proxychains] preloading /usr/lib/libproxychains.so.4\n[proxychains] DLL init: proxychains-ng 4.16\n` + (run(params, params.slice(1), null) || '');
    // ── Security / Pentest (educational) ─────────────────────────
    case 'iptables': {
        const sub = params;
        if (hasFlag('-L')) return `Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh\nDROP       all  --  anywhere             anywhere\n\nChain FORWARD (policy DROP)\n\nChain OUTPUT (policy ACCEPT)`;
        if (hasFlag('-A') || hasFlag('-D') || hasFlag('-I')) return `(iptables: rule applied — simulated)`;
        if (hasFlag('-F')) return '(iptables: rules cleared — simulated)';
        return 'usage: iptables [-L] [-A CHAIN] [-D CHAIN] [-F] [-I CHAIN] ...';
    }

    case 'ufw': {
        const sub = params;
        if (!sub || sub==='status') return `Status: active\n\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW       Anywhere\n80/tcp                     ALLOW       Anywhere\n443/tcp                    ALLOW       Anywhere`;
        if (sub==='enable')  return 'Firewall is active and enabled on system startup';
        if (sub==='disable') return 'Firewall stopped and disabled on system startup';
        if (sub==='allow')   return `Rule added: allow ${params||'port'}`;
        if (sub==='deny')    return `Rule added: deny ${params||'port'}`;
        if (sub==='delete')  return `Rule deleted`;
        if (sub==='reset')   return 'All rules removed. Firewall disabled.';
        return `ufw: '${sub}': unknown subcommand`;
    }

    case 'tcpdump': {
        if (!params.length && !flags.length) return 'usage: tcpdump [-i INTERFACE] [-n] [FILTER]';
        const iface = args[args.indexOf('-i')+1] || 'eth0';
        const lines = Array.from({length:6}, (_,i) => {
            const src = `192.168.1.${Math.floor(Math.random()*254+1)}`;
            const dst = `192.168.1.${Math.floor(Math.random()*254+1)}`;
            const port = [80,443,22,53,8080][Math.floor(Math.random()*5)];
            return `${new Date().toISOString().slice(11,23)} IP ${src}.${Math.floor(Math.random()*60000+1024)} > ${dst}.${port}: Flags [S], seq 0, win 64240, length 0`;
        });
        return `tcpdump: verbose output suppressed, use -v or -vv for full protocol decode\nlistening on ${iface}, link-type EN10MB (Ethernet), snapshot length 262144 bytes\n${lines.join('\n')}\n^C\n6 packets captured\n6 packets received by filter\n0 packets dropped by kernel`;
    }

    case 'wireshark':
    case 'tshark':
        return `(${cmd}: packet analyzer — requires graphical environment)\nTip: use 'tcpdump' for packet capture in the terminal`;

    case 'hydra':
        return 'Hydra v9.5 — Dictionary authentication testing tool.\n[INFO] Use ONLY on your own systems or with WRITTEN authorization.\n[INFO] Unauthorized use is illegal.\n[TIP] To practice legally: TryHackMe, HackTheBox, local DVWA.';

    case 'john':
        return 'John the Ripper 1.9.0-jumbo-1 — Hash analysis tool.\nFunctions: identify hash algorithms, test password policies.\n[INFO] Use ONLY on hashes from your own systems or with WRITTEN authorization.\n[TIP] Practice with: hashcat example hashes, CTFs on TryHackMe/HackTheBox.';

    case 'hashcat':
        return 'hashcat v6.2.6 — GPU-based hash analysis tool.\nModes: 0=MD5, 1000=NTLM, 1800=sha512crypt, 22000=WPA2, ...\n[INFO] Use ONLY on your own hashes or systems with WRITTEN authorization.\n[TIP] Practice hash identification with: haiti, hash-identifier, hashid.';

    case 'nikto': {
        if (!params.length) return 'usage: nikto -h TARGET\nExample: nikto -h http://target.com';
        const host = args[args.indexOf('-h')+1] || params;
        return `- Nikto v2.1.6\n---------------------------------------------------------------------------\n+ Target IP:          ${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.1\n+ Target Hostname:    ${host}\n+ Target Port:        80\n+ Start Time:         ${new Date().toLocaleString('en-US')}\n---------------------------------------------------------------------------\n+ Server: Apache/2.4.54\n+ /admin/: Possible admin area found\n+ /backup/: Possible backup directory\n+ OSVDB-3092: /.htaccess: .htaccess file found\n+ 8783 requests: 0 error(s) and 3 item(s) reported\n[WARNING] Simulated terminal. Real Nikto requires target authorization.`;
    }

    case 'sqlmap':
        return 'sqlmap 1.7.10 — Automatic SQL injection detection tool.\n[INFO] Automates SQL injection testing on web applications.\n[INFO] Use ONLY on your own applications or with WRITTEN authorization.\n[TIP] To practice: OWASP Juice Shop (local), DVWA, WebGoat, PortSwigger Labs.';

    case 'msfconsole':
    case 'metasploit':
        return [
            '       =[ metasploit v6.3.44-dev                          ]',
            '+ -- --=[ 2376 exploits - 1232 auxiliary - 413 post       ]',
            '+ -- --=[ 1163 payloads - 46 encoders - 11 nops           ]',
            '',
            'msf6 > (interactive mode not supported in this simulated terminal)',
            '[!] Use only in authorized CTFs and your own labs.',
        ].join('\n');
    case 'burpsuite':
    case 'burp':
        return '(Burp Suite: graphical tool — requires graphical interface)\nTip: use the free Community version at https://portswigger.net/burp';

    case 'aircrack-ng':
    case 'airodump-ng':
    case 'aireplay-ng':
        return `(${cmd}: WiFi auditing tool — requires wireless card with monitor mode)\n[!] Use only on your own networks or with explicit authorization.\n    Unauthorized use is illegal.`;
    // ── Hardware / Low-level System ───────────────────────────────
    case 'lshw': {
        if (hasFlag('-short')) return `H/W path     Device  Class       Description\n============================================================\n                       system      Laptop\n/0                     bus         Motherboard\n/0/0                   memory      8GiB System Memory\n/0/1                   processor   Intel i7-10750H\n/0/2     eth0    network     Intel Ethernet`;
        return `${HOSTNAME}\n    description: Notebook\n    product: Generic Laptop\n    vendor: Generic\n  *-cpu\n       description: CPU\n       product: Intel(R) Core(TM) i7-10750H @ 2.60GHz\n       width: 64 bits\n  *-memory\n       description: System Memory\n       size: 8GiB\n  *-network\n       description: Ethernet interface\n       logical name: eth0`;
    }

    case 'lspci': {
        if (hasFlag('-v')) return `00:00.0 Host bridge: Intel Corporation Device [8086:9b53]\n  Flags: bus master, fast devsel\n  Kernel driver in use: skl_uncore\n\n00:02.0 VGA compatible controller: Intel Corporation CometLake-H GT2 [UHD Graphics]\n  Flags: bus master, fast devsel\n  Kernel driver in use: i915\n\n01:00.0 3D controller: NVIDIA Corporation TU117M [GeForce GTX 1650]\n  Flags: bus master, fast devsel\n  Kernel driver in use: nvidia`;
        return `00:00.0 Host bridge: Intel Corporation Device\n00:02.0 VGA compatible controller: Intel Corporation UHD Graphics\n01:00.0 3D controller: NVIDIA Corporation GeForce GTX 1650\n00:14.0 USB controller: Intel Corporation Device\n00:1f.3 Audio device: Intel Corporation Device`;
    }

    case 'lsusb':
        return `Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub\nBus 001 Device 004: ID 8087:0026 Intel Corp. AX201 Bluetooth\nBus 001 Device 003: ID 04f2:b68b Chicony Electronics Co., Ltd Webcam\nBus 001 Device 002: ID 046d:c52b Logitech, Inc. Unifying Receiver\nBus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`;

    case 'dmidecode': {
        if (hasFlag('-t')) {
            const type = args[args.indexOf('-t')+1] || '1';
            if (type==='1' || type==='system') return `Handle 0x0001, DMI type 1, 27 bytes\nSystem Information\n\tManufacturer: Generic\n\tProduct Name: Laptop\n\tVersion: 1.0\n\tSerial Number: SN123456789\n\tSKU Number: Not Specified\n\tFamily: Notebook`;
            if (type==='4' || type==='processor') return `Handle 0x0004, DMI type 4, 48 bytes\nProcessor Information\n\tSocket Designation: U3E1\n\tType: Central Processor\n\tFamily: Core i7\n\tManufacturer: Intel(R) Corporation\n\tVersion: Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz\n\tMax Speed: 5000 MHz`;
        }
        return `# dmidecode 3.4\n# SMBIOS present.\nHandle 0x0000, DMI type 0, 26 bytes\nBIOS Information\n\tVendor: American Megatrends Inc.\n\tVersion: F.25\n\tRelease Date: 01/15/2023`;
    }

    case 'sensors':
        return `coretemp-isa-0000\nAdapter: ISA adapter\nPackage id 0:  +52.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 0:        +51.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 1:        +50.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 2:        +52.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 3:        +49.0°C  (high = +100.0°C, crit = +100.0°C)\n\nnvme-pci-0100\nAdapter: PCI adapter\nComposite:    +38.9°C  (low  = -273.1°C, high = +84.8°C)`;

    case 'acpi':
        return `Battery 0: Discharging, ${Math.floor(Math.random()*80+15)}%, ${Math.floor(Math.random()*3+1)}:${String(Math.floor(Math.random()*60)).padStart(2,'0')} remaining\nBattery 0: design capacity 4630 mAh, last full capacity 4100 mAh = 88%\nAdapter 0: on-line`;

    case 'hdparm': {
        if (!params.length) return 'usage: hdparm [options] DEVICE\nExample: hdparm -I /dev/sda';
        const dev = params[0];
        if (hasFlag('-I')) return `/dev/sda:\n\n ATA device, with non-removable media\n\tModel Number:       Samsung SSD 870 EVO 500GB\n\tSerial Number:      S59YNX0R123456\n\tFirmware Revision:  SVT01B6Q\n\tTransport: Serial, ATA8-AST, SATA 1.0a, SATA II Extensions, SATA Rev 2.5, SATA Rev 3.0\n\tCapabilities:\n\t\tLBA, IORDY`;
        return `(hdparm: operation on ${dev} — simulated)`;
    }

    case 'smartctl': {
        if (!params.length) return 'usage: smartctl -a DEVICE\nExample: smartctl -a /dev/sda';
        return `smartctl 7.3 2022-02-28 r5338\n\n=== START OF INFORMATION SECTION ===\nDevice Model:     Samsung SSD 870 EVO 500GB\nSerial Number:    S59YNX0R123456\nFirmware Version: SVT01B6Q\nUser Capacity:    500,107,862,016 bytes [500 GB]\nSector Size:      512 bytes logical/physical\nDevice is:        In smartctl database\n\n=== START OF READ SMART DATA SECTION ===\nSMART overall-health self-assessment test result: PASSED\n\nID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      RAW_VALUE\n  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  0\n  9 Power_On_Hours           0x0032   097   097   000    Old_age   3241\n177 Wear_Leveling_Count      0x0013   097   097   000    Pre-fail  39`;
    }

    case 'iostat': {
        const h = hasFlag('-h');
        return `Linux 6.1.0-18-amd64 (${HOSTNAME})\t${new Date().toLocaleDateString('en-US')}\n\navg-cpu:  %user   %nice %system %iowait  %steal   %idle\n           2.30    0.00    0.70    0.10    0.00   96.90\n\nDevice\t\ttps\tkB_read/s\tkB_wrtn/s\tkB_read\tkB_wrtn\nsda\t\t${(Math.random()*10).toFixed(2)}\t\t${(Math.random()*1000).toFixed(2)}\t\t${(Math.random()*500).toFixed(2)}\t${Math.floor(Math.random()*9999999)}\t${Math.floor(Math.random()*9999999)}`;
    }

    case 'sar':
        return `Linux 6.1.0-18-amd64 (${HOSTNAME})\t${new Date().toLocaleDateString('en-US')}\n\n${new Date().toLocaleTimeString('en-US')}     CPU     %user     %nice   %system   %iowait    %steal     %idle\n${new Date().toLocaleTimeString('en-US')}     all      2.30      0.00      0.70      0.10      0.00     96.90`;

    case 'pidstat':
        return `Linux 6.1.0-18-amd64 (${HOSTNAME})\n\n${new Date().toLocaleTimeString('en-US')}   UID       PID    %usr %system  %guest   %wait    %CPU   CPU  Command\n${new Date().toLocaleTimeString('en-US')}  1000      ${Math.floor(Math.random()*9000+1000)}    0.50    0.10    0.00    0.00    0.60     0  bash\n${new Date().toLocaleTimeString('en-US')}     0         1    0.00    0.01    0.00    0.00    0.01     0  systemd`;

    case 'sysctl': {
        if (!params.length && !flags.length) return 'usage: sysctl [-a] [VARIABLE[=VALUE]]';
        if (hasFlag('-a')) return `kernel.hostname = ${HOSTNAME}\nkernel.ostype = Linux\nkernel.osrelease = 6.1.0-18-amd64\nnet.ipv4.ip_forward = 0\nnet.ipv4.tcp_syncookies = 1\nvm.swappiness = 60\nfs.file-max = 9223372036854775807`;
        if (params && params.includes('=')) { const [k,v]=params.split('='); return `${k} = ${v}`; }
        if (params) return `${params[0]} = 1`;
        return '(sysctl: parameter not specified)';
    }

    case 'lsmod':
        return `Module                  Size  Used by\nnvidia_drm             77824  4\nnvidia_modeset       1249280  6 nvidia_drm\nnvidia              56209408  116 nvidia_modeset\ni915                 3538944  8\ndrm_kms_helper        258048  2 i915,nvidia_drm\ndrm                   622592  12\nbluetooth            1007616  30\nsnd_hda_intel          57344  4`;

    case 'modprobe':
        return params.length ? `(modprobe: module '${params}' ${hasFlag('-r')?'removed':'loaded'} — simulated)` : 'usage: modprobe [-r] MODULE';

    case 'insmod':
        return params.length ? `(insmod: module '${params}' inserted — simulated)` : 'usage: insmod MODULE.ko';

    case 'rmmod':
        return params.length ? `(rmmod: module '${params}' removed — simulated)` : 'usage: rmmod MODULE';

    case 'update-grub':
    case 'grub-update':
        return `Generating grub configuration file ...\nFound linux image: /boot/vmlinuz-6.1.0-18-amd64\nFound initrd image: /boot/initrd.img-6.1.0-18-amd64\ndone`;
    // ── Disco / Filesystem ────────────────────────────────────────
    case 'lsof': {
        const pid = Math.floor(Math.random()*9000)+1000;
        if (hasFlag('-i')) return `COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nsshd     1234     root    3u  IPv4  12345      0t0  TCP *:ssh (LISTEN)\nnginx    5678     root    6u  IPv6  23456      0t0  TCP *:http (LISTEN)`;
        return `COMMAND     PID     USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME\nbash       ${pid}  ${username}  cwd    DIR    8,1     4096  ${Math.floor(Math.random()*999999)} ${cwd}\nbash       ${pid}  ${username}  txt    REG    8,1  1183448  ${Math.floor(Math.random()*999999)} /bin/bash\nbash       ${pid}  ${username}    0u   CHR  136,0      0t0       3 /dev/pts/0`;
    }

    case 'fuser': {
        if (!params.length) return 'usage: fuser [-k] [-n NAMESPACE] FILE|PORT';
        return `${params}:     ${Math.floor(Math.random()*9000+1000)}`;
    }

    case 'rsync': {
        if (params.length < 2) return 'usage: rsync [options] SOURCE DESTINATION\nExample: rsync -avz /source/ user@host:/dest/';
        return `sending incremental file list\n./\nfile1.txt\nfile2.txt\n\nsent 1,234 bytes  received 57 bytes  861.33 bytes/sec\ntotal size is 1,024  speedup is 0.79`;
    }

    case 'mount': {
        if (!params.length) return `sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\n/dev/sda1 on / type ext4 (rw,relatime)\n/dev/sda2 on /home type ext4 (rw,relatime)\ntmpfs on /tmp type tmpfs (rw,nosuid,nodev)`;
        return `(mount: ${params.join(' ')} — simulated)`;
    }

    case 'umount':
        return params.length ? `(umount: ${params} unmounted — simulated)` : 'usage: umount MOUNT_POINT';

    case 'fdisk': {
        if (hasFlag('-l')) return `Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors\nDisk model: SAMSUNG SSD\nUnits: sectors of 1 * 512 = 512 bytes\n\nDevice     Start      End  Sectors Size Type\n/dev/sda1   2048 98566143 98564096  47G Linux filesystem\n/dev/sda2 98566144 104857566  6291423   3G Linux swap`;
        return `(fdisk: use 'fdisk -l' to list partitions)`;
    }

    case 'mkfs':
    case 'mkfs.ext4':
    case 'mkfs.xfs':
        if (!params.length) return `usage: ${cmd} DEVICE`;
        return `mke2fs 1.47.0 (5-Feb-2023)\nCreating filesystem with ${Math.floor(Math.random()*1000000)} 4k blocks and ${Math.floor(Math.random()*100000)} inodes\nSuper-block backups stored on blocks: 32768, 98304\n\nAllocating group tables: done\nWriting inode tables: done\nCreating journal (16384 blocks): done\nWriting superblocks and filesystem accounting information: done`;

    case 'fsck':
    case 'e2fsck':
        if (!params.length) return `usage: ${cmd} [options] DEVICE`;
        return `e2fsck 1.47.0 (5-Feb-2023)\n${params}: clean, 45123/2621440 files, 1234567/10485504 blocks`;

    case 'blkid':
        return `/dev/sda1: UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="12345678-01"\n/dev/sda2: UUID="swap-1234-5678-abcd-ef12" TYPE="swap" PARTUUID="12345678-02"`;

    case 'shred': {
        if (!params.length) return 'usage: shred [-n PASSES] [-z] [-u] FILE';
        const passes = parseInt(args[args.indexOf('-n')+1]) || 3;
        return `shred: ${params}: pass 1/${passes} (random)...\nshred: ${params}: pass 2/${passes} (random)...\nshred: ${params}: pass ${passes}/${passes} (random)...${hasFlag('-u')?('\nshred: '+params+': removing'):''}`;
    }

    case 'truncate': {
        if (!params.length) return 'usage: truncate -s SIZE FILE';
        const size = args[args.indexOf('-s')+1] || '0';
        if (!params) return 'truncate: missing file operand';
        const abs = resolvePath(params);
        if (!vfs[abs]) fsTouch(abs,'');
        vfs[abs].content = '';
        vfs[abs].size = parseInt(size) || 0;
        return null;
    }

    case 'fallocate': {
        if (!params.length) return 'usage: fallocate -l SIZE FILE';
        const size = args[args.indexOf('-l')+1] || '1M';
        if (!params) return 'fallocate: missing file operand';
        fsTouch(resolvePath(params),'');
        return null;
    }

    case 'dd': {
        if (!args.length) return 'usage: dd if=INPUT of=OUTPUT [bs=SIZE] [count=N]\nExample: dd if=/dev/zero of=file.bin bs=1M count=10';
        const inf  = args.find(a=>a.startsWith('if='))?.slice(3) || '/dev/stdin';
        const outf = args.find(a=>a.startsWith('of='))?.slice(3) || '/dev/stdout';
        const bs   = args.find(a=>a.startsWith('bs='))?.slice(3) || '512';
        const cnt  = args.find(a=>a.startsWith('count='))?.slice(6) || '1';
        const bytes = (parseInt(bs.replace(/[KMG]/,'')) * (bs.includes('G')?1073741824:bs.includes('M')?1048576:bs.includes('K')?1024:1)) * parseInt(cnt);
        fsTouch(resolvePath(outf), Array(Math.min(parseInt(cnt),10)).fill('\0').join(''));
        return `${cnt}+0 records in\n${cnt}+0 records out\n${bytes} bytes (${humanBytes(bytes)}) copied, ${(Math.random()*2+0.1).toFixed(3)} s, ${humanBytes(bytes/1.5)}/s`;
    }
    // ── Advanced Text ─────────────────────────────────────────────
    case 'shuf': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'shuf: missing file operand';
        const lines = src.split('\n');
        for (let i=lines.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lines[i],lines[j]]=[lines[j],lines[i]];}
        const n = parseInt(args[args.indexOf('-n')+1]);
        return (n ? lines.slice(0,n) : lines).join('\n');
    }

    case 'fold': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        const width = parseInt(args[args.indexOf('-w')+1]) || 80;
        return src.split('\n').map(l => {
            const chunks = [];
            for (let i=0;i<l.length;i+=width) chunks.push(l.slice(i,i+width));
            return chunks.join('\n') || '';
        }).join('\n');
    }

    case 'expand': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        const tabs = parseInt(args[args.indexOf('-t')+1]) || 8;
        return src.replace(/\t/g, ' '.repeat(tabs));
    }

    case 'unexpand': {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.replace(/ {8}/g, '\t');
    }

    case 'paste': {
        if (params.length < 2) return 'usage: paste FILE1 FILE2';
        const n1 = fsGet(resolvePath(params[0])), n2 = fsGet(resolvePath(params[1]));
        if (!n1) return `paste: ${params[0]}: No such file or directory`;
        if (!n2) return `paste: ${params[1]}: No such file or directory`;
        const l1=(n1.content||'').split('\n'), l2=(n2.content||'').split('\n');
        return l1.map((l,i)=>`${l}\t${l2[i]||''}`).join('\n');
    }

    case 'join': {
        if (params.length < 2) return 'usage: join FILE1 FILE2';
        return '(join: merging files by a common field — simulated)';
    }

    case 'comm': {
        if (params.length < 2) return 'usage: comm FILE1 FILE2';
        const n1=fsGet(resolvePath(params[0])), n2=fsGet(resolvePath(params[1]));
        if (!n1||!n2) return 'comm: No such file or directory';
        const s1=new Set((n1.content||'').split('\n'));
        const s2=new Set((n2.content||'').split('\n'));
        const lines=[];
        for(const l of s1) if(!s2.has(l)) lines.push(l);
        for(const l of s2) if(!s1.has(l)) lines.push('\t\t'+l);
        for(const l of s1) if(s2.has(l)) lines.push('\t'+l);
        return lines.join('\n');
    }

    case 'od': {
        if (!params.length) return 'usage: od [-c|-x|-d] FILE';
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `od: ${params[0]}: No such file or directory`;
        const content = n.content || '';
        const lines = [];
        for (let i=0;i<Math.min(content.length,64);i+=8) {
            const chunk = content.slice(i,i+8);
            const oct = i.toString(8).padStart(7,'0');
            const hex = chunk.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
            lines.push(`${oct} ${hex}`);
        }
        return lines.join('\n');
    }

    case 'hexdump':
    case 'hd': {
        if (!params.length) return `usage: ${cmd} [-C] FILE`;
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `${cmd}: ${params[0]}: No such file or directory`;
        const content = n.content || '';
        const lines = [];
        for (let i=0;i<Math.min(content.length,64);i+=16) {
            const chunk = content.slice(i,i+16);
            const addr = i.toString(16).padStart(8,'0');
            const hex1 = chunk.slice(0,8).split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
            const hex2 = chunk.slice(8).split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
            const asc  = chunk.replace(/[^\x20-\x7e]/g,'.');
            lines.push(`${addr}  ${hex1.padEnd(23)}  ${hex2.padEnd(23)}  |${asc}|`);
        }
        lines.push(content.length.toString(16).padStart(8,'0'));
        return lines.join('\n');
    }

    case 'strings': {
        if (!params.length) return 'usage: strings FILE';
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `strings: ${params[0]}: No such file or directory`;
        return (n.content||'').split('\n').filter(l=>l.trim().length>=4).join('\n') || '(no printable strings)';
    }

    case 'iconv': {
        if (!params.length) return 'usage: iconv -f FROM -t TO [FILE]\nExample: iconv -f UTF-8 -t ISO-8859-1 file.txt';
        const from = args[args.indexOf('-f')+1] || 'UTF-8';
        const to   = args[args.indexOf('-t')+1] || 'UTF-8';
        const src  = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'iconv: missing file operand';
        return `(iconv: converting from ${from} to ${to} — simulated)\n${src}`;
    }

    case 'look': {
        if (!params.length) return 'usage: look PREFIX [FILE]';
        const words = ['algorithm','analysis','archive','archives','banco','bash','binary','compiler','command','data','debug','distribution','encoding','filesystem','firewall','grep','hardware','hostname','interface','kernel','linux','memory','network','output','process','protocol','redirection','script','server','system','socket','terminal','thread','user','variable'];
        return words.filter(w=>w.startsWith(params[0].toLowerCase())).join('\n') || '(no match found)';
    }
    // ── Dev / Languages ───────────────────────────────────────────
    case 'pip':
    case 'pip3': {
        const sub = params[0];
        if (!sub) return `${cmd} ${cmd==='pip3'?'23.2.1':'23.2.1'} from /usr/lib/python3/dist-packages/pip (python 3.11)`;
        if (sub==='install') return params[1] ? `Collecting ${params[1]}\n  Downloading ${params[1]}-1.0.0-py3-none-any.whl (42 kB)\nInstalling collected packages: ${params[1]}\nSuccessfully installed ${params[1]}-1.0.0` : 'pip: missing package name';
        if (sub==='uninstall') return params[1] ? `Found existing installation: ${params[1]}\nUninstalling ${params[1]}-1.0.0:\nSuccessfully uninstalled ${params[1]}-1.0.0` : 'pip: missing operand';
        if (sub==='list') return `Package         Version\n--------------- -------\nnumpy           1.24.3\npandas          2.0.3\nrequests        2.31.0\nFlask           3.0.0\nscapy           2.5.0`;
        if (sub==='freeze') return `Flask==3.0.0\nnumpy==1.24.3\npandas==2.0.3\nrequests==2.31.0`;
        if (sub==='show') return `Name: ${params[1]||'package'}\nVersion: 1.0.0\nSummary: Package description\nHome-page: https://pypi.org/project/${params[1]||'package'}/\nLocation: /usr/lib/python3/dist-packages`;
        if (sub==='search') return `NOTICE: pip search has been disabled by PyPI.\nGo to https://pypi.org/search/?q=${params[1]||''}`;
        return `pip: '${sub}': unknown command`;
    }

    case 'virtualenv':
    case 'venv': {
        const name = params[0] || 'venv';
        fsMkdir(resolvePath(name));
        fsMkdir(resolvePath(name+'/bin'));
        fsMkdir(resolvePath(name+'/lib'));
        fsTouch(resolvePath(name+'/bin/activate'), `# Activate with: source ${name}/bin/activate`);
        return `created virtual environment CPython3.11.4.final.0-64 in ${name}\n  creator CPython3Posix(dest=${cwd}/${name}, clear=False, no_vcs_ignore=False, global=True)`;
    }

    case 'php': {
        if (!params.length) return `PHP 8.2.10 (cli) (built: Sep  1 2023)\nCopyright (c) The PHP Group\n> (interactive mode not supported)`;
        const n = fsGet(resolvePath(params[0]));
        return n ? `(executing ${params[0]} with PHP — simulated)` : `php: can't open file '${params[0]}': No such file or directory`;
    }

    case 'ruby':
        return params.length ? `(executando ${params[0]} com Ruby — simulado)` : `ruby 3.2.0 (2022-12-25 revision a528908271) [x86_64-linux]\nirb(main):001> (interactive mode not supported)`;

    case 'perl':
        return params.length ? `(executando ${params[0]} com Perl — simulado)` : 'perl v5.36.0 — (interactive mode not supported)';

    case 'lua':
        return params.length ? `(executando ${params[0]} com Lua — simulado)` : `Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio\n> (interactive mode not supported)`;

    case 'go': {
        const sub = params[0];
        if (!sub) return 'go: no subcommand specified. Try: build, run, test, get, mod, fmt';
        if (sub==='run') return params[1] ? `(go run ${params[1]} — simulated)` : 'go run: missing file operand';
        if (sub==='build') return `(go build — compiled successfully — simulated)`;
        if (sub==='test') return `ok  	package	0.123s`;
        if (sub==='fmt') return null;
        if (sub==='version') return 'go version go1.21.4 linux/amd64';
        if (sub==='mod') { if(params[1]==='init') { fsTouch(resolvePath('go.mod'),`module ${params[2]||'my-module'}\n\ngo 1.21`); return null; } return '(go mod — simulated)'; }
        return `go: '${sub}': unknown subcommand`;
    }
    case 'docker': {
        const sub = params[0];
        if (!sub) return 'usage: docker [command]\nCommands: run, ps, images, pull, build, stop, rm, rmi, exec, logs, inspect';
        if (sub==='ps') return `CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS     NAMES\na1b2c3d4e5f6   nginx     "/docker-entrypoint.…"  2 minutes ago   Up 2 minutes   80/tcp    web`;
        if (sub==='images') return `REPOSITORY   TAG       IMAGE ID       CREATED        SIZE\nnginx        latest    a6bd71f48f68   2 weeks ago    187MB\nubuntu       22.04     3b418d7b466a   3 weeks ago    77.8MB\npython       3.11      fc13586fb7d8   4 weeks ago    1.01GB`;
        if (sub==='run') return `(docker run: starting container ${params.slice(1).join(' ')} — simulated)`;
        if (sub==='pull') return `Pulling from library/${params[1]||'image'}\nStatus: Downloaded newer image for ${params[1]||'image'}:latest`;
        if (sub==='stop') return params[1] ? `${params[1]}` : 'docker stop: missing container';
        if (sub==='rm')   return params[1] ? `${params[1]}` : 'docker rm: missing container';
        if (sub==='rmi')  return params[1] ? `Untagged: ${params[1]}:latest\nDeleted: sha256:abc123...` : 'docker rmi: missing image';
        if (sub==='build') return `[+] Building 12.3s (8/8) FINISHED\n => [internal] load build definition from Dockerfile\n => [1/4] FROM docker.io/library/python:3.11\n => FINISHED`;
        if (sub==='exec') return `(docker exec: executing in container — simulated)`;
        if (sub==='logs') return `[nginx] Starting nginx server...\n[nginx] Listening on port 80`;
        if (sub==='--version') return 'Docker version 24.0.6, build ed223bc';
        return `docker: '${sub}': unknown subcommand`;
    }

    case 'docker-compose': {
        const sub = params[0];
        if (!sub) return 'usage: docker-compose [up|down|build|ps|logs|exec]';
        if (sub==='up') return `Creating network "app_default" with the default driver\nCreating app_db_1  ... done\nCreating app_web_1 ... done`;
        if (sub==='down') return `Stopping app_web_1 ... done\nStopping app_db_1  ... done\nRemoving app_web_1 ... done\nRemoving app_db_1  ... done`;
        if (sub==='ps') return `Name        Command        State   Ports\n--------------------------------------------------\napp_web_1   python app.py   Up      0.0.0.0:5000->5000/tcp\napp_db_1    docker-entrypoint  Up      5432/tcp`;
        if (sub==='build') return `Building web...\nStep 1/6 : FROM python:3.11\nSuccessfully built a1b2c3d4`;
        if (sub==='logs') return `web_1  | * Running on http://0.0.0.0:5000\ndb_1   | PostgreSQL init process complete`;
        return `docker-compose: '${sub}': unknown subcommand`;
    }

    case 'kubectl': {
        const sub = params[0];
        if (!sub) return 'usage: kubectl [get|apply|delete|describe|logs|exec|run]';
        if (sub==='get') {
            const res = params[1] || 'pods';
            if (res==='pods') return `NAME                    READY   STATUS    RESTARTS   AGE\nnginx-7d4b9c8f6-abc12   1/1     Running   0          5m`;
            if (res==='nodes') return `NAME       STATUS   ROLES           AGE   VERSION\nmaster-1   Ready    control-plane   7d    v1.28.3`;
            if (res==='services') return `NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE\nkubernetes   ClusterIP   10.96.0.1       <none>        443/TCP   7d`;
            return `No resources found in default namespace.`;
        }
        if (sub==='apply') return `configured: deployment.apps/${params[2]||'my-app'}`;
        if (sub==='delete') return `deleted: ${params[1]||'resource'}/${params[2]||'name'}`;
        if (sub==='logs') return `[nginx] Starting nginx...\n[nginx] Listening on :80`;
        if (sub==='version') return `Client Version: v1.28.3\nKustomize Version: v5.0.4-0\nServer Version: v1.28.3`;
        return `kubectl: '${sub}': unknown subcommand`;
    }

    case 'terraform': {
        const sub = params[0];
        if (!sub) return 'usage: terraform [init|plan|apply|destroy|show|output]';
        if (sub==='init') return `Initializing the backend...\nInitializing provider plugins...\n- Finding hashicorp/aws versions matching "~> 5.0"...\n\nTerraform has been successfully initialized!`;
        if (sub==='plan') return `Terraform used the selected providers to generate the following execution plan:\n\nPlan: 3 to add, 0 to change, 0 to destroy.`;
        if (sub==='apply') return `Apply complete! Resources: 3 added, 0 changed, 0 destroyed.`;
        if (sub==='destroy') return `Destroy complete! Resources: 3 destroyed.`;
        return `terraform: '${sub}': unknown subcommand`;
    }

    case 'ansible': {
        const sub = params[0];
        if (!sub) return 'usage: ansible [-m MODULE] [-a ARGS] HOST(S)\nOr: ansible-playbook PLAYBOOK.yml';
        return `${params[0]} | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}`;
    }

    case 'cmake': {
        const sub = params[0];
        if (!sub || sub==='.') return `-- The CXX compiler identification is GNU 12.3.0\n-- Detecting CXX compiler ABI info\n-- Check for working CXX compiler: /usr/bin/g++\n-- Configuring done (0.3s)\n-- Generating done (0.1s)\n-- Build files have been written to: ${cwd}/build`;
        if (sub==='--build') return `[ 25%] Building CXX object CMakeFiles/project.dir/main.cpp.o\n[ 50%] Building CXX object CMakeFiles/project.dir/utils.cpp.o\n[100%] Linking CXX executable project\n[100%] Built target project`;
        return `(cmake: ${params.join(' ')} — simulated)`;
    }
    // ── Shell / Multiplexers ──────────────────────────────────────
    case 'screen': {
        const sub = params;
        if (!sub) return `[detached from 12345.pts-0.${HOSTNAME}]\n(screen: simulated session — use Ctrl+A D to detach, Ctrl+A K to kill)`;
        if (sub==='-ls') return `There is a screen on:\n\t12345.pts-0.${HOSTNAME}\t(Attached)\n1 Socket in /run/screen/S-${username}.`;
        if (sub==='-r') return `[screen: reconnecting to 12345.pts-0.${HOSTNAME}]`;
        return `(screen: ${params.join(' ')} — simulated)`;
    }

    case 'tmux': {
        const sub = params;
        if (!sub) return `(tmux: new session created — simulated)\nShortcuts: Ctrl+B D (detach), Ctrl+B % (vertical split), Ctrl+B " (horizontal split)`;
        if (sub==='ls') return `0: 2 windows (created ${new Date().toLocaleString('en-US')}) [220x50]`;
        if (sub==='new' || sub==='new-session') return `(tmux: new session '${args[args.indexOf('-s')+1]||'0'}' created)`;
        if (sub==='attach' || sub==='-a') return `(tmux: attached to session)`;
        if (sub==='kill-session') return `(tmux: session ended)`;
        return `(tmux: ${params.join(' ')} — simulated)`;
    }

    case 'script': {
        const file = params || 'typescript';
        fsTouch(resolvePath(file), `Script started on ${new Date().toLocaleString('en-US')}`);
        return `Script started, file is '${file}'\n(script: use 'exit' to stop recording — simulated)`;
    }

    // ── Users and Permissions ─────────────────────────────────────
    case 'chsh':
        return params.length ? `(chsh: shell changed to '${params}' — simulated)` : `Changing shell for ${username}.\nPassword:`;

    case 'chfn':
        return `Changing user information for ${username}.\nFull Name []: Information updated (simulated).`;

    case 'finger':
        return params.length
            ? `Login: ${params}\t\t\t\tName: ${params}\nDirectory: /home/${params}\t\tShell: /bin/bash\nOn since ${new Date().toLocaleString('en-US')} on pts/0 from :0\nNo mail.\nNo plan.`
            : `Login     Name       Tty      Idle  Login Time\n${username.padEnd(9)} ${username.padEnd(10)} pts/0         ${new Date().toLocaleString('en-US')}`;

    case 'write':
        return params.length ? `(write: sending message to ${params} — simulated)` : 'usage: write USER';

    case 'wall':
        return params.length ? `Broadcast message from ${username}@${HOSTNAME}:\n${params.join(' ')}` : 'usage: wall MESSAGE';

    case 'mesg':
        if (!params.length) return 'is y';
        return `(mesg: messages ${params==='y'?'allowed':'is n'})`;

    case 'chage': {
        if (hasFlag('-l')) return `Last password change\t\t\t: ${new Date().toLocaleDateString('en-US')}\nPassword expires\t\t\t\t\t: never\nPassword inactive\t\t\t\t\t: never\nAccount expires\t\t\t\t\t: never`;
        return '(chage: password aging information changed — simulated)';
    }

    case 'visudo':
        return '(visudo: edit /etc/sudoers with care on a real system)\n# %sudo   ALL=(ALL:ALL) ALL';

    case 'update-alternatives': {
        const sub = params;
        if (sub==='--list') return `/usr/bin/python3.11\n/usr/bin/python3.10\n/usr/bin/python2.7`;
        if (sub==='--config') return `There are 2 choices for the alternative ${params[1]||'editor'}:\n\n  Selection    Path              Priority   Status\n------------------------------------------------------------\n* 0            /bin/nano          40        auto mode\n  1            /usr/bin/vim.basic  30        manual mode\n\nPress <enter> to keep the current choice[*]`;
        return `(update-alternatives: ${params.join(' ')} — simulated)`;
    }

    case 'dpkg-reconfigure':
        return params.length ? `(dpkg-reconfigure: reconfiguring '${params}' — simulated)` : 'usage: dpkg-reconfigure PACKAGE';

    case 'addgroup':
    case 'groupmod':
        return params.length ? `(${cmd}: group '${params}' ${cmd==='addgroup'?'created':'modified'} — simulated)` : `${cmd}: missing name`;

    case 'delgroup':
        return params.length ? `Removing group '${params}'... (simulated)` : 'delgroup: missing name';
    // ── Environment / Utilities ───────────────────────────────────
    case 'notify-send':
        return params.length ? `(notify-send: notification sent: "${params.join(' ')}")` : 'usage: notify-send SUMMARY [BODY]';

    case 'xclip':
    case 'xsel':
        return stdin ? `(${cmd}: ${stdin.slice(0,40)} copied to clipboard — simulated)` : `(${cmd}: clipboard — simulated)`;

    case 'xdg-open':
        return params.length ? `(xdg-open: opening '${params[0]}' with default application — simulated)` : 'usage: xdg-open FILE|URL';

    case 'at':
        return `warning: commands will be executed using /bin/sh\njob 1 at ${new Date().toLocaleString('en-US')}`;

    case 'batch':
        return '(batch: executing when system load permits — simulated)';

    case 'cron':
        return '(cron: use crontab -e to schedule tasks)';

    case 'ab': {
        if (!params.length) return 'usage: ab -n REQUESTS -c CONCURRENCY URL\nExample: ab -n 1000 -c 10 http://localhost/';
        const n = parseInt(args[args.indexOf('-n')+1]) || 100;
        const c = parseInt(args[args.indexOf('-c')+1]) || 1;
        const url = params[0] || 'http://localhost/';
        const rps = Math.floor(Math.random()*2000+500);
        return `This is ApacheBench, Version 2.3\nCopyright 1996 Adam Twiss\n\nBenchmarking ${url}\n\nServer Software:        nginx\nServer Hostname:        localhost\nServer Port:            80\n\nDocument Path:          /\nDocument Length:        612 bytes\n\nConcurrency Level:      ${c}\nTime taken for tests:   ${(n/rps).toFixed(3)} seconds\nComplete requests:      ${n}\nFailed requests:        0\nRequests per second:    ${rps}.00 [#/sec] (mean)\nTime per request:       ${(1000/rps).toFixed(3)} [ms] (mean)`;
    }

    case 'lynx':
    case 'w3m':
    case 'links':
        return params.length ? `(${cmd}: text browser — rendering '${params[0]}' — simulated)\n[Press 'q' to exit]` : `usage: ${cmd} URL`;

    case 'convert': // ImageMagick
        return params.length >= 2 ? `(convert: converting '${params[0]}' → '${params[1]}' — simulated)` : 'usage: convert INPUT OUTPUT';

    case 'ffmpeg':
    case 'ffprobe':
        return params.length ? `(${cmd}: processing media — simulated)` : `${cmd} version 5.1.3`;


    case 'units': {
        if (params.length < 2) return 'usage: units QUANTITY UNIT\nExample: units "100 km" mi';
        return `        * ${(Math.random()*100).toFixed(6)}\n        / ${(Math.random()*100).toFixed(6)}`;
    }


    case 'dc':
        return '(dc: reverse-postfix calculator — interactive mode not supported)';


    case 'numfmt': {
        if (!params.length) return 'usage: numfmt [--to=UNIT] NUMBER';
        const to = args.find(a=>a.startsWith('--to='))?.split('=')[1];
        const n = parseFloat(params[0]) || 0;
        if (to === 'iec') return humanBytes(n);
        if (to === 'si') return n >= 1e9 ? (n/1e9).toFixed(1)+'G' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
        return String(n);
    }
    // ── Useful shortcuts and aliases ──────────────────────────────
    case 'll':   return run('ls', ['-la', ...args.filter(a=>a!=='-la')], stdin);
    case 'la':   return run('ls', ['-a',  ...args.filter(a=>a!=='-a')], stdin);
    case 'l':    return run('ls', ['-lh', ...args.filter(a=>a!=='-lh')], stdin);
    case 'md':   return run('mkdir', args, stdin);
    case 'cls':  $terminal.innerHTML=''; return null;
    case 'dir':  return run('ls', args, stdin);

    case 'randpw': {
        const len = parseInt(params) || 16;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        return Array.from({length:len}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    }

    case 'uuid':
    case 'uuidgen':
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random()*16|0;
            return (c==='x'?r:(r&0x3|0x8)).toString(16);
        });

    case 'urlencode':
        return params.length ? encodeURIComponent(params.join(' ')) : 'usage: urlencode TEXT';

    case 'urldecode':
        return params.length ? decodeURIComponent(params.join(' ')) : 'usage: urldecode ENCODED_TEXT';

    case 'rot13':
        return params.join(' ').replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0)-base+13)%26+base);
        });

    case 'binary': {
        const text = params.join(' ');
        return text.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
    }

    case 'hex': {
        const text = params.join(' ');
        return text.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
    }

    case 'fromhex': {
        try {
            const hex = params.join('').replace(/[^a-z0-9_-]/g, '');
            return hex.match(/.{2}/g)?.map(h=>String.fromCharCode(parseInt(h,16))).join('') || 'invalid hex';
        } catch { return 'fromhex: invalid input'; }
    }

    case 'ipinfo': {
        const ip = params || '8.8.8.8';
        return `IP: ${ip}\nHostname: dns.google\nCity: Mountain View\nRegion: California\nCountry: US\nOrg: AS15169 Google LLC\nTimezone: America/Los_Angeles`;
    }

    case 'myip':
        return `Public IP (simulated): ${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}\nLocal IP: 192.168.1.${Math.floor(Math.random()*200+10)}`;

    case 'ports': {
        const p = params ? parseInt(params) : null;
        const wellKnown = {20:'FTP-data',21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',445:'SMB',3306:'MySQL',3389:'RDP',5432:'PostgreSQL',6379:'Redis',8080:'HTTP-alt',8443:'HTTPS-alt',27017:'MongoDB'};
        if (p) return wellKnown[p] ? `Port ${p}: ${wellKnown[p]}` : `Port ${p}: unassigned (1024+ = ephemeral/dynamic)`;
        return Object.entries(wellKnown).map(([port,svc])=>`${String(port).padStart(5)}/tcp  ${svc}`).join('\n');
    }

    case 'headers': {
        if (!params.length) return 'usage: headers URL';
        return `HTTP/1.1 200 OK\nServer: nginx/1.24.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html; charset=UTF-8\nContent-Length: 12345\nConnection: keep-alive\nX-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN\nStrict-Transport-Security: max-age=31536000`;
    }
    case 'ctf':
        return [
            '╔══════════════════════════════════════════════╗',
            '║           CTF / Hacking Resources            ║',
            '╠══════════════════════════════════════════════╣',
            '║  TryHackMe     → tryhackme.com               ║',
            '║  HackTheBox    → hackthebox.com               ║',
            '║  PicoCTF       → picoctf.org                  ║',
            '║  OverTheWire   → overthewire.org              ║',
            '║  PWNable.kr    → pwnable.kr                   ║',
            '║  PortSwigger   → portswigger.net/web-security ║',
            '║  OWASP Juice   → owasp.org/www-project-juice  ║',
            '╚══════════════════════════════════════════════╝',
        ].join('\n');

    case 'cheatsheet': {
        const topic = params[0];
        const sheets = {
            bash: 'BASH:\n  Ctrl+C  → cancel\n  Ctrl+Z  → suspend\n  Ctrl+D  → EOF/logout\n  Ctrl+L  → clear\n  !!      → last command\n  !$      → last argument\n  $?      → exit status',
            vim: 'VIM:\n  i → insert\n  Esc → normal mode\n  :w → save\n  :q → quit\n  :wq → save and quit\n  dd → delete line\n  yy → copy line\n  p → paste\n  /word → search',
            git: 'GIT:\n  git init         → initialize repo\n  git add .        → add all\n  git commit -m "" → commit\n  git push         → push\n  git pull         → pull\n  git status       → view status\n  git log          → history\n  git branch       → branches',
            regex: 'REGEX:\n  .  → any char\n  *  → 0 or more\n  +  → 1 or more\n  ?  → 0 or 1\n  ^  → start\n  $  → end\n  [] → char class\n  \d → digit\n  \w → word\n  \s → space',
            linux: 'ESSENTIAL LINUX:\n  ls -la    → list all\n  chmod 755 → rwxr-xr-x\n  chmod 644 → rw-r--r--\n  ps aux    → all processes\n  kill -9   → force kill\n  find / -name → search\n  grep -r   → recursive search',
        };
        return sheets[topic] || `Topics: ${Object.keys(sheets).join(', ')}\nusage: cheatsheet TOPIC`;
    }



    // ── Default ───────────────────────────────────────────────────
    default: {
        if (!cmd) return null;
        const exec2 = fsGet(resolvePath(cmd)) || fsGet(resolvePath('/usr/bin/'+cmd)) || fsGet(resolvePath('/bin/'+cmd));
        if (exec2?.type === 'file') return `(executing '${cmd}' — simulated)`;
        return `bash: ${cmd}: command not found\nType 'help' to see the available commands`;
    }
    }
}

// 67

