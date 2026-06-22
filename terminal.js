// ═══════════════════════════════════════════════════════════════════
//  TERMINAL.JS — Interface (login, temas, prompt e execução de linha)
// ═══════════════════════════════════════════════════════════════════

let username = '';
const HOSTNAME = '_403';
let cmdHistory = JSON.parse(localStorage.getItem('_403_history') || '[]');
let histIdx = -1;
let aliases = {};
window.AVAILABLE_THEMES = ['default', 'dracula', 'gruvbox', 'matrix', 'nord', 'catppuccin', 'monokai', 'cyberpunk'];

// ── Sistema de Armazenamento Global do Tema ──────────────────────
function setTheme(themeName) {
    const theme = themeName || 'default';
    // Lista com todos os seus temas
    const allThemes = ['theme-dracula', 'theme-gruvbox', 'theme-matrix', 'theme-nord', 'theme-catppuccin', 'theme-monokai', 'theme-cyberpunk'];
    
    // Remove de ambos (html e body) para garantir limpeza total
    document.documentElement.classList.remove(...allThemes);
    document.body.classList.remove(...allThemes);
    
    // Aplica o novo tema direto no HTML (o :root do CSS)
    if (theme !== 'default') {
        document.documentElement.classList.add(`theme-${theme}`);
    }
    
    // Grava permanentemente no navegador
    localStorage.setItem('selected-theme', theme);

    // ── ATUALIZAÇÃO VISUAL DO MENU ──
    const themeButtons = document.querySelectorAll('.theme-dropdown button');
    if (themeButtons.length > 0 && window.AVAILABLE_THEMES) {
        themeButtons.forEach((btn, i) => {
            if (window.AVAILABLE_THEMES[i] === theme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
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
        btn.addEventListener('click', () => setTheme(window.AVAILABLE_THEMES[i]));
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




// ── Prompt helpers ───────────────────────────────────────────────
function shortPath() {
    const home = `/home/${username}`;
    if (cwd === home) return '~';
    if (cwd.startsWith(home + '/')) return '~' + cwd.slice(home.length);
    return cwd || '/';
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
                     `<input type="text" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">`;
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


function execSingle(raw) {
    if (!raw) return true;

    // Intercepta atribuição de variáveis (ex: TEMA=dark)
    const varMatch = raw.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/);
    if (varMatch) {
        let val = varMatch[2];
        // Remove aspas se o usuário digitou VAR="valor"
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        envVars[varMatch[1]] = val;
        return true; 
    }

    const firstWord = raw.split(' ')[0];
    if (aliases[firstWord]) raw = aliases[firstWord] + raw.slice(firstWord.length);

    // Suporte a pipes (|) e redirecionamentos básicos (>)
    const piped = raw.split('|').map(s => s.trim());
    let stdin = null;
    let lastResult = true;

    for (let i = 0; i < piped.length; i++) {
        const tokens = tokenize(piped[i]);
        if (!tokens.length) continue;

        const cmd = tokens[0];
        const args = tokens.slice(1);

        let redirectFile = null;
        let append = false;
        let realArgs = [];
        
        // Separa argumentos dos redirecionamentos
        for (let j = 0; j < args.length; j++) {
            if (args[j] === '>') { redirectFile = args[j+1]; break; }
            if (args[j] === '>>') { redirectFile = args[j+1]; append = true; break; }
            realArgs.push(args[j]);
        }

        // Executa o comando via command.js
        const out = run(cmd, realArgs, stdin);
        
        if (redirectFile) {
            const abs = resolvePath(redirectFile);
            if (append && vfs[abs]) {
                vfs[abs].content += (vfs[abs].content ? '\n' : '') + (out || '');
            } else {
                fsTouch(abs, out || '');
            }
            stdin = null; 
        } else {
            stdin = out;
        }
        lastResult = out !== false; 
    }

    // Imprime a saída no terminal se existir
    if (stdin !== null && stdin !== undefined && stdin !== '') {
        addOut(stdin);
    }
    return lastResult;
}

function tokenize(str) {
    const tokens = [];
    let cur = '', q = null;
    
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        
        if (q) { 
            if (c === q) { q = null; } 
            else if (c === '$' && q === '"') { 
                let varName = '';
                i++;
                while(i < str.length && /[a-zA-Z0-9_]/.test(str[i])) { varName += str[i]; i++; }
                i--; 
                cur += envVars[varName] !== undefined ? envVars[varName] : '';
            }
            else { cur += c; }
        } 
        else if (c === '"' || c === "'") { q = c; }
        else if (c === '$') { 
            let varName = '';
            i++;
            while(i < str.length && /[a-zA-Z0-9_]/.test(str[i])) { varName += str[i]; i++; }
            i--;
            cur += envVars[varName] !== undefined ? envVars[varName] : '';
        }
        else if (c === ' ') { 
            if (cur) { tokens.push(cur); cur = ''; } 
        }
        else { cur += c; }
    }
    if (cur) tokens.push(cur);
    return tokens;
}
