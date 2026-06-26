// ═══════════════════════════════════════════════════════════════════
//  TERMINAL.JS — Interface (login, temas, prompt e execução de linha)
// ═══════════════════════════════════════════════════════════════════

let username = '';
const HOSTNAME = '_403';
let cmdHistory = JSON.parse(localStorage.getItem('_403_history') || '[]');
let histIdx = -1;
let aliases = {};
let userPassword = ''
window.AVAILABLE_THEMES = ['default', 'dracula', 'gruvbox', 'matrix', 'nord', 'catppuccin', 'cyberpunk'];
window.currentLang = localStorage.getItem('_403_lang') || 'en';

// ── Sistema de Armazenamento Global do Tema ──────────────────────
function setTheme(themeName) {
    const theme = themeName || 'default';
    // Lista com todos os seus temas
    const allThemes = ['theme-dracula', 'theme-gruvbox', 'theme-matrix', 'theme-nord', 'theme-catppuccin', 'theme-cyberpunk'];
    
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
    const themeButtons = document.querySelectorAll('#theme-submenu button');
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

window.addEventListener('DOMContentLoaded', () => {
    initLoginListener();

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainMenu = document.getElementById('main-menu');
    const themeToggle = document.getElementById('menu-theme-toggle');
    
    // ── LÓGICA DO BOTÃO DE IDIOMA ──
    const langToggle = document.getElementById('menu-lang-toggle');
    const langLabel = document.getElementById('lang-label');

    if (langToggle) {
        // Define o texto inicial com base no que está salvo
        langLabel.innerText = window.currentLang === 'en' ? 'Lang: EN' : 'Lang: PT';
        
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            // Alterna entre 'en' e 'pt'
            window.currentLang = window.currentLang === 'en' ? 'pt' : 'en';
            localStorage.setItem('_403_lang', window.currentLang);
            langLabel.innerText = window.currentLang === 'en' ? 'Lang: EN' : 'Lang: PT';
            
            // Se o modo de aprendizado estiver aberto, atualiza o painel instantaneamente
            if (typeof isLearning !== 'undefined' && isLearning && typeof printMission === 'function') {
                printMission();
            }
        });
    }
    const themeSubmenu = document.getElementById('theme-submenu');

    if (hamburgerBtn) { 
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mainMenu.classList.toggle('show');
            hamburgerBtn.classList.toggle('active');
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeSubmenu.classList.toggle('show');
            const arrow = themeToggle.querySelector('.arrow');
            if(arrow) arrow.innerText = themeSubmenu.classList.contains('show') ? '▼' : '▶'; 
        });
    }

    window.addEventListener('click', (e) => {
        if (mainMenu && !mainMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            mainMenu.classList.remove('show');
            hamburgerBtn.classList.remove('active');
        }
    });

    const themeButtons = document.querySelectorAll('#theme-submenu button');
    themeButtons.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            setTheme(window.AVAILABLE_THEMES[i]);
        });
    });

    const btnLearn = document.getElementById('menu-learning-btn');
    if (btnLearn) {
        btnLearn.addEventListener('click', () => {
            if ($termScreen.style.display === 'none' || $termScreen.style.display === '') {
                // ── CORREÇÃO BUG 1: Apenas cria usuário se estiver na tela de login e sem conta!
                if (!sessionStorage.getItem('_403_active_user')) {
                    username = 'user';
                    userPassword = 'user';
                    sessionStorage.setItem('_403_active_user', username);
                    sessionStorage.setItem('_403_active_pass', userPassword);
                    initFS();
                } else {
                    username = sessionStorage.getItem('_403_active_user');
                    userPassword = sessionStorage.getItem('_403_active_pass') || 'user';
                }

                $loginScreen.style.display = 'none';
                $termScreen.style.display  = 'flex';
                $termScreen.style.flexDirection = 'column';
            }

            if (typeof startLearningMode === 'function') {
                if (isLearning) {
                    addOut(stopLearningMode(), 'warn');
                } else {
                    $terminal.innerHTML = ''; 
                    cwd = `/home/${username}`; 
                    startLearningMode();
                    newLine(); 
                }
                scrollBottom();
                mainMenu.classList.remove('show');
                hamburgerBtn.classList.remove('active');
            }
        });
    }

    // ── AUTO-LOGIN & RESTAURAR SESSÃO ──
    const activeUser = sessionStorage.getItem('_403_active_user');
    if (activeUser) {
        username = activeUser;
        userPassword = sessionStorage.getItem('_403_active_pass') || 'user';
        initFS();
        
        $loginScreen.style.display = 'none';
        $termScreen.style.display  = 'flex';
        $termScreen.style.flexDirection = 'column';
        
        printWelcome();
        addOut('[!] Session restored automatically.', 'info');
        
       // ── RESTAURA O MODO LEARN SE ESTAVA ATIVO NO F5 ──
        if (localStorage.getItem('_403_learning') === '1') {
            const savedLesson = parseInt(localStorage.getItem('_403_lesson')) || 0;
            if (typeof startLearningMode === 'function') {
                startLearningMode(savedLesson);
            }
        }
        
        newLine();
    }
    // O 'else' que forçava o login invisível no F5 foi apagado daqui!
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
const $passwordInput = document.getElementById('password-input'); 
const $passwordLine  = document.getElementById('password-line');  

// ── Login ─────────────────────────────────────────────────────────
function initLoginListener() {
    $termScreen.addEventListener('click', () => {
        const activeInput = $terminal.querySelector('.line:last-child input');
        if (activeInput && !activeInput.disabled) {
            activeInput.focus();
        }
    });

    // Enter no Login -> Mostra a Senha
    $loginInput.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        
        const name = $loginInput.value.trim().replace(/[^a-z0-9_-]/g, '').toLowerCase();
        if (!name) return;
        
        $passwordLine.style.display = 'flex';
        $passwordInput.focus();
    });

    // Enter na Senha -> Entra no Sistema
    $passwordInput.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        
        const pass = $passwordInput.value;
        if (!pass) return; // Obriga o usuário a digitar uma senha

        // Inicializa o sistema com os dados capturados
        username = $loginInput.value.trim().replace(/[^a-z0-9_-]/g, '').toLowerCase();
        userPassword = pass; 

        sessionStorage.setItem('_403_active_user', username);
        sessionStorage.setItem('_403_active_pass', userPassword);
        
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

function newLine(isPassword = false) {
    const line = document.createElement('div');
    line.className = 'line';
    
    if (isPassword) {
        // Modo Senha: Sem prompt (nome@host) e input esconde os caracteres
        line.innerHTML = `<span class="prompt"></span><input type="password" autocomplete="off" spellcheck="false">`;
    } else {
        // Modo Normal
        line.innerHTML = `<span class="prompt">${promptHTML()}</span><input type="text" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">`;
    }
    
    $terminal.appendChild(line);
    const input = line.querySelector('input');
    input.focus();
    histIdx = -1;

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const raw = input.value; // Para senha, pegamos o valor sem trim()
            input.disabled = true;

            // ── NOVO: Limpa a tela na transição das missões ──
            if (window.clearOnNextCommand) {
                $terminal.innerHTML = '';
                window.clearOnNextCommand = false;
            }
            
            // ── INTERCEPTADOR DE SENHA (SUDO) ──
            if (window.pendingSudo) {
                const senhaCorreta = userPassword; // Defina a senha do sistema aqui!
                
                if (raw === senhaCorreta) {
                    // Senha correta: recupera o comando e eleva o privilégio
                    const { cmd, args } = window.pendingSudo;
                    window.pendingSudo = null;
                    
                    const originalUser = effectiveUser;
                    effectiveUser = 'root'; // Elevação Real
                    
                    try {
                        const out = await run(cmd, args, null);
                        if (out !== null && out !== undefined && out !== '') addOut(out);
                    } catch (err) {
                        addOut(`[Erro]: ${err.message}`, 'err');
                    }
                    
                    effectiveUser = originalUser; // Restaura usuário normal
                } else {
                    // Senha errada
                    addOut('Sorry, try again.', 'err');
                    window.pendingSudo = null;
                }
                
                scrollBottom();
                if (!$termScreen.dataset.exiting && !$termScreen.dataset.editing) newLine();
                return; // Encerra aqui para não rodar o fluxo de comando normal
            }
            
            // ── FLUXO DE COMANDO NORMAL ──
            const rawTrimmed = raw.trim();
            if (rawTrimmed) {
                cmdHistory.unshift(rawTrimmed);
                if (cmdHistory.length > 200) cmdHistory.pop();
                localStorage.setItem('_403_history', JSON.stringify(cmdHistory));
            }
            
            try {
                await exec(rawTrimmed);
            } catch (err) {
                addOut(`[Erro Interno do Terminal]: ${err.message}`, 'err');
            }
            
            scrollBottom();
            
            // Verifica se o comando que acabou de rodar (ex: sudo) ativou a espera por senha
            if (window.pendingSudo) {
                newLine(true); // Cria a próxima linha em MODO SENHA
            } else if (!$termScreen.dataset.exiting && !$termScreen.dataset.editing) {
                newLine();
            }

        } else if (e.key === 'ArrowUp') {
            // ... (resto do seu código ArrowUp)
            e.preventDefault();
            if (histIdx < cmdHistory.length - 1 && !isPassword) input.value = cmdHistory[++histIdx];

        } else if (e.key === 'ArrowDown') {
            // ... (resto do seu código ArrowDown)
            e.preventDefault();
            if (histIdx > 0 && !isPassword) input.value = cmdHistory[--histIdx];
            else if (!isPassword) { histIdx = -1; input.value = ''; }

        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (!isPassword) tabComplete(input);

        }  else if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            
            // 1. Pega o valor que o usuário já digitou (caso ele esteja no meio de um comando)
            const currentVal = input.value;
            
            // 2. Limpa o terminal
            $terminal.innerHTML = '';
            
            // 3. Cria a nova linha
            newLine();
            
            // 4. Recupera o novo input que foi criado pela newLine()
            const newInput = $terminal.querySelector('.line:last-child input');
            
            // 5. Restaura o valor e coloca o cursor no final
            newInput.value = currentVal;
            newInput.focus();
            
            // Opcional: força o cursor a ficar no final do texto recuperado
            newInput.setSelectionRange(currentVal.length, currentVal.length);
        

        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            addOut('^C');
            input.disabled = true;
            window.pendingSudo = null; // Cancela o pedido de senha se apertar Ctrl+C
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


// Function to safely split pipes ignoring those inside quotes
function splitPipes(str) {
    const result = [];
    let cur = '', q = null;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (q) {
            cur += c;
            if (c === q) q = null;
        } else if (c === '"' || c === "'") {
            q = c;
            cur += c;
        } else if (c === '|') {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    if (cur) result.push(cur.trim());
    return result;
}

async function execSingle(raw) {
    if (!raw) return true;

    const varMatch = raw.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/);
    if (varMatch) {
        let val = varMatch[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        envVars[varMatch[1]] = val;
        return true; 
    }

    const firstWord = raw.split(' ')[0];
    if (aliases[firstWord]) raw = aliases[firstWord] + raw.slice(firstWord.length);

    // Using the new safe pipe splitter
    const piped = splitPipes(raw);
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
        
        for (let j = 0; j < args.length; j++) {
            if (args[j] === '>') { redirectFile = args[j+1]; break; }
            if (args[j] === '>>') { redirectFile = args[j+1]; append = true; break; }
            realArgs.push(args[j]);
        }

        const out = await run(cmd, realArgs, stdin); 
        
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

    // Prints output if exists
    if (stdin !== null && stdin !== undefined && stdin !== '') {
        addOut(stdin);
    }
    
    if (typeof saveVFS === 'function') saveVFS();
    
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

// ── Command execution (CORRIGIDO VIA TOKENIZAÇÃO REAL) ────────────────
async function exec(raw) {
    if (!raw) return;

    // Usamos o seu próprio tokenize para separar o comando em blocos seguros (respeitando aspas)
    const allTokens = tokenize(raw);
    if (!allTokens.length) return;

    let currentTokens = [];
    
    for (let i = 0; i < allTokens.length; i++) {
        const token = allTokens[i];

        // Se o token for um operador lógico REAL (fora de aspas, o seu tokenize já isolou)
        if (token === '&&') {
            // Remonta o comando atual de forma segura antes do operador
            const cmdString = currentTokens.map(t => /[ |><&$]/.test(t) ? `"${t}"` : t).join(' ');
            const success = await execSingle(cmdString);
            
            // Se falhar, aborta a linha inteira imediatamente
            if (success === false) return;
            
            currentTokens = [];
            continue;
        }

        if (token === '||') {
            // Remonta o comando atual de forma segura antes do operador
            const cmdString = currentTokens.map(t => /[ |><&$]/.test(t) ? `"${t}"` : t).join(' ');
            const success = await execSingle(cmdString);
            
            // Se tiver sucesso, aborta o resto da linha (pulando o OR)
            if (success !== false) return;
            
            currentTokens = [];
            continue;
        }

        // Caso contrário, acumula o token no comando atual
        currentTokens.push(token);
    }

    // Executa o último comando restante na cadeia
    if (currentTokens.length > 0) {
        const cmdString = currentTokens.map(t => /[ |><&$]/.test(t) ? `"${t}"` : t).join(' ');
        await execSingle(cmdString);
    }

    // ── NOVO INTERCEPTADOR DO LEARNING MODE ──
    // Avalia a string original completa (ex: "mkdir secure && chmod 700 secure")
    if (typeof isLearning !== 'undefined' && isLearning) {
        const lessonFeedback = checkLesson(raw, null);
        if (lessonFeedback) {
            addOut(lessonFeedback);
        }
    }
}



// Editor de texto
const $editor = document.getElementById('editor-overlay');
const $textarea = document.getElementById('editor-textarea');
const $editName = document.getElementById('editor-filename');

let currentEditingFile = null;
let editorMode = 'nano'; // 'nano' ou 'vim'
let isVimCommandMode = false;
let vimCommandBuffer = '';

function openEditor(filename, content, cmd) {
    currentEditingFile = resolvePath(filename);
    
    // Detecta se abriu com vim/vi/nvim
    editorMode = (cmd === 'vim' || cmd === 'vi' || cmd === 'nvim') ? 'vim' : 'nano';
    isVimCommandMode = false;
    vimCommandBuffer = '';

    // Trava o terminal para não gerar prompts no fundo
    $termScreen.dataset.editing = '1';

    $editName.innerText = `${cmd} - ${filename}`;
    
    if (editorMode === 'nano') {
        $editName.nextElementSibling.innerText = "(Ctrl+X to save & exit | Ctrl+C to cancel)";
    } else {
        $editName.nextElementSibling.innerText = "(Vim: Esc for command mode, then :wq to save or :q! to quit)";
    }

    $textarea.value = content;
    $editor.classList.remove('hidden');
    $textarea.focus();
}

// Função mágica de auto-indentação
function autoIndent(e) {
    e.preventDefault();
    const start = $textarea.selectionStart;
    const end = $textarea.selectionEnd;
    const value = $textarea.value;
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    const lines = before.split('\n');
    const lastLine = lines[lines.length - 1];
    
    // Copia a indentação da linha atual
    const match = lastLine.match(/^\s*/);
    let indent = match ? match[0] : '';
    
    // Se a linha terminar com dois pontos ou chaves, adiciona +4 espaços
    if (lastLine.trim().match(/[:{\[(]$/)) {
        indent += '    ';
    }
    
    $textarea.value = before + '\n' + indent + after;
    $textarea.selectionStart = $textarea.selectionEnd = start + 1 + indent.length;
}

$textarea.addEventListener('keydown', (e) => {
    // ── NANO MODE ──
    if (editorMode === 'nano') {
        if (e.ctrlKey && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            closeEditor(true); 
        } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            closeEditor(false); 
        } else if (e.key === 'Enter') {
            autoIndent(e); // <--- NOVO
        }
    } 
    // ── VIM MODE ──
    else if (editorMode === 'vim') {
        if (e.key === 'Escape') {
            isVimCommandMode = true;
            vimCommandBuffer = '';
            $editName.nextElementSibling.innerText = "-- COMMAND MODE -- (type :wq or :q!)";
            e.preventDefault();
        } else if (isVimCommandMode) {
            e.preventDefault(); 
            
            if (e.key === 'Enter') {
                if (vimCommandBuffer === ':wq' || vimCommandBuffer === ':x') {
                    closeEditor(true);
                } else if (vimCommandBuffer === ':q!' || vimCommandBuffer === ':q') {
                    closeEditor(false);
                } else {
                    isVimCommandMode = false;
                    $editName.nextElementSibling.innerText = "-- INSERT MODE -- (Esc to command mode)";
                }
            } else if (e.key === 'Backspace') {
                vimCommandBuffer = vimCommandBuffer.slice(0, -1);
                $editName.nextElementSibling.innerText = `-- COMMAND MODE -- ${vimCommandBuffer}`;
            } else if (e.key.length === 1) { 
                vimCommandBuffer += e.key; 
                $editName.nextElementSibling.innerText = `-- COMMAND MODE -- ${vimCommandBuffer}`;
            }
        } else {
            // MODO DE INSERÇÃO VIM
            if (e.key === 'Enter') {
                autoIndent(e); // <--- NOVO
            }
        }
    }
});

function closeEditor(save) {
    if (save) {
        fsTouch(currentEditingFile, $textarea.value); // Grava no sistema de arquivos
        if (typeof saveVFS === 'function') saveVFS(); // Força o salvamento no LocalStorage
        addOut(`[FILE SAVED: ${currentEditingFile}]`, 'ok');
    } else {
        addOut(`[EDITOR CLOSED WITHOUT SAVING]`, 'warn');
    }

    $editor.classList.add('hidden');
    currentEditingFile = null;

    // Libera o terminal e gera a nova linha
    delete $termScreen.dataset.editing;
    newLine();
    scrollBottom();
}