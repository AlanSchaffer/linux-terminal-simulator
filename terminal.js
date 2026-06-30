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

// ── FUNÇÃO AUXILIAR DE TRADUÇÃO DO ONBOARDING ──
function updateOnboardingLang() {
    const lang = window.currentLang || 'en';
    
    // Elementos da Welcome Screen
    const welcomeInfo = document.getElementById('welcome-info');
    const welcomeQuestion = document.getElementById('welcome-question');
    const btnExpert = document.getElementById('btn-expert');
    const btnBeginner = document.getElementById('btn-beginner');
    
    // Elementos da Beginner Screen
    const beginnerInfo = document.getElementById('beginner-info');
    const beginnerDesc = document.getElementById('beginner-desc');
    const btnStartLearn = document.getElementById('btn-start-learn');
    const btnBackWelcome = document.getElementById('btn-back-welcome');
    const btnBackFromLogin = document.getElementById('btn-back-from-login');

    if (lang === 'en') {
        if (welcomeInfo) welcomeInfo.innerText = "Connection successfully established.";
        if (welcomeQuestion) welcomeQuestion.innerText = "Identify your access level:";
        if (btnExpert) btnExpert.innerText = "I have Terminal experience";
        if (btnBeginner) btnBeginner.innerText = "I have no experience";
        
        if (beginnerInfo) beginnerInfo.innerText = "Training and Simulation Mode.";
        if (beginnerDesc) beginnerDesc.innerText = "You will learn basic Linux commands step-by-step in a safe environment.";
        if (btnStartLearn) btnStartLearn.innerText = "Start Training (Learn)";
        if (btnBackWelcome) btnBackWelcome.innerText = "Back";
        if (btnBackFromLogin) btnBackFromLogin.innerText = "Back";
    } else {
        if (welcomeInfo) welcomeInfo.innerText = "Conexão estabelecida com sucesso.";
        if (welcomeQuestion) welcomeQuestion.innerText = "Identifique o seu nível de acesso:";
        if (btnExpert) btnExpert.innerText = "Tenho experiência com Terminal";
        if (btnBeginner) btnBeginner.innerText = "Não tenho experiência";
        
        if (beginnerInfo) beginnerInfo.innerText = "Modo de Treinamento e Simulação.";
        if (beginnerDesc) beginnerDesc.innerText = "Você aprenderá os comandos básicos de Linux em um ambiente seguro passo a passo.";
        if (btnStartLearn) btnStartLearn.innerText = "Iniciar Treinamento (Learn)";
        if (btnBackWelcome) btnBackWelcome.innerText = "Voltar";
        if (btnBackFromLogin) btnBackFromLogin.innerText = "Voltar";
    }
}

// ── FUNÇÃO DE TRANSIÇÃO SUAVE (FADE) ──
function transitionTo(hideScreen, showScreen, callback) {
    if (hideScreen) {
        hideScreen.style.opacity = '0';
    }
    setTimeout(() => {
        if (hideScreen) hideScreen.style.display = 'none';
        if (showScreen) {
            showScreen.style.opacity = '0';
            showScreen.style.display = 'flex';
            // Força o navegador a renderizar o display:flex antes de mudar a opacidade
            void showScreen.offsetWidth; 
            showScreen.style.opacity = '1';
        }
        if (callback) callback();
    }, 300); // 300ms de transição, igual no CSS
}

window.addEventListener('DOMContentLoaded', () => {
    initLoginListener();

    // ── REFERÊNCIAS DO MENU ──
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainMenu = document.getElementById('main-menu');
    const themeToggle = document.getElementById('menu-theme-toggle');
    const langToggle = document.getElementById('menu-lang-toggle');
    const langLabel = document.getElementById('lang-label');
    const themeSubmenu = document.getElementById('theme-submenu');

    // ── REFERÊNCIAS DO ONBOARDING & TELAS ──
    const $welcomeScreen = document.getElementById('welcome-screen');
    const $beginnerScreen = document.getElementById('beginner-screen');
    const topLeftLang = document.getElementById('top-left-lang');
    const topLangLabel = document.getElementById('top-lang-label');
    
    const btnExpert = document.getElementById('btn-expert');
    const btnBeginner = document.getElementById('btn-beginner');
    const btnBackWelcome = document.getElementById('btn-back-welcome');
    const btnStartLearn = document.getElementById('btn-start-learn');
    const btnBackFromLogin = document.getElementById('btn-back-from-login');

    // Sincroniza a tradução inicial
    updateOnboardingLang();
    
    // Função para atualizar os labels de idioma em ambos os botões
    const syncLangLabels = () => {
        const txt = window.currentLang === 'en' ? 'EN' : 'PT';
        if (langLabel) langLabel.innerText = 'Lang: ' + txt;
        if (topLangLabel) topLangLabel.innerText = txt;
    };
    syncLangLabels();

    // ── EVENTOS DOS BOTÕES DE ONBOARDING ──
    if (btnExpert) {
        btnExpert.addEventListener('click', () => {
            transitionTo($welcomeScreen, $loginScreen, () => {
                const loginInput = document.getElementById('login-input');
                if (loginInput) loginInput.focus();
            });
        });
    }

    if (btnBeginner) {
        btnBeginner.addEventListener('click', () => {
            transitionTo($welcomeScreen, $beginnerScreen);
        });
    }

    if (btnBackWelcome) {
        btnBackWelcome.addEventListener('click', () => {
            transitionTo($beginnerScreen, $welcomeScreen);
        });
    }

    if (btnBackFromLogin) {
        btnBackFromLogin.addEventListener('click', () => {
            transitionTo($loginScreen, $welcomeScreen);
        });
    }

    if (btnStartLearn) {
        btnStartLearn.addEventListener('click', () => {
            username = 'user';
            userPassword = 'user';
            sessionStorage.setItem('_403_active_user', username);
            sessionStorage.setItem('_403_active_pass', userPassword);
            initFS();

            // Some com o botão de idioma top-left quando o terminal abrir
            //if (topLeftLang) topLeftLang.style.display = 'none';

            transitionTo($beginnerScreen, $termScreen, () => {
                $termScreen.style.flexDirection = 'column';
                if (typeof startLearningMode === 'function') {
                    $terminal.innerHTML = ''; 
                    cwd = `/home/${username}`; 
                    startLearningMode();
                    newLine();
                    scrollBottom();
                }
            });
        });
    }

    // ── LÓGICA DO BOTÃO DE IDIOMA TOP-LEFT ──
    if (topLeftLang) {
        topLeftLang.addEventListener('click', () => {
            window.currentLang = window.currentLang === 'en' ? 'pt' : 'en';
            localStorage.setItem('_403_lang', window.currentLang);
            syncLangLabels();
            updateOnboardingLang();
            
            // ── A LINHA QUE FALTAVA: Atualiza a missão instantaneamente ──
            if (typeof isLearning !== 'undefined' && isLearning && typeof printMission === 'function') {
                printMission();
            }
        });
    }

    // ── LÓGICA DO BOTÃO DE IDIOMA (MENU) ──
    if (langToggle) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            window.currentLang = window.currentLang === 'en' ? 'pt' : 'en';
            localStorage.setItem('_403_lang', window.currentLang);
            syncLangLabels();
            updateOnboardingLang();
            
            if (typeof isLearning !== 'undefined' && isLearning && typeof printMission === 'function') {
                printMission();
            }
        });
    }

    // ── LÓGICA DE MENUS, TEMAS E EXIT (Mantida) ──
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
            if(themeSubmenu) themeSubmenu.classList.toggle('show');
            const arrow = themeToggle.querySelector('.arrow');
            if(arrow && themeSubmenu) arrow.innerText = themeSubmenu.classList.contains('show') ? '▼' : '▶'; 
        });
    }

    window.addEventListener('click', (e) => {
        if (mainMenu && !mainMenu.contains(e.target) && hamburgerBtn && !hamburgerBtn.contains(e.target)) {
            mainMenu.classList.remove('show');
            hamburgerBtn.classList.remove('active');
        }
    });

    const themeButtons = document.querySelectorAll('#theme-submenu button');
    themeButtons.forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            setTheme(window.AVAILABLE_THEMES[i]);
            if (themeSubmenu) themeSubmenu.classList.remove('show');
            const arrow = themeToggle.querySelector('.arrow');
            if (arrow) arrow.innerText = '▶';
        });
    });

    const btnLearn = document.getElementById('menu-learning-btn');
    if (btnLearn) {
        btnLearn.addEventListener('click', () => {
            if ($termScreen.style.display === 'none' || $termScreen.style.display === '') {
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

                //if (topLeftLang) topLeftLang.style.display = 'none';
                
                transitionTo($welcomeScreen || $beginnerScreen || $loginScreen, $termScreen, () => {
                    $termScreen.style.flexDirection = 'column';
                });
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

    const btnExit = document.getElementById('menu-exit-btn');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            sessionStorage.removeItem('_403_active_user');
            sessionStorage.removeItem('_403_active_pass');
            window.location.reload();
        });
    }

    const btnAbout = document.getElementById('menu-about-btn');
    if (btnAbout) {
        btnAbout.addEventListener('click', () => {
            window.open('https://github.com/AlanSchaffer', '_blank');
        });
    }

    // ── LÓGICA DO BOTÃO DE AJUDA GLOBAL E BARRA MOBILE ──
    // Movemos o getActiveInput para cima para o botão de ajuda também poder usá-lo
    const getActiveInput = () => $terminal.querySelector('.line:last-child input');

    const globalHelpBtn = document.getElementById('global-help-btn');
    if (globalHelpBtn) {
        globalHelpBtn.addEventListener('click', async () => {
            const input = getActiveInput();
            if (input && !input.disabled) {
                // Preenche visualmente a linha atual com 'help'
                input.value = 'help';
                input.disabled = true; // Trava a linha igual ao apertar Enter
                
                // Roda o comando no motor do terminal
                await exec('help');
                
                // Pula para a próxima linha (se não estiver em um editor de texto)
                if (!$termScreen.dataset.exiting && !$termScreen.dataset.editing) {
                    newLine();
                }
                scrollBottom();
            }
        });
    }

    // Funcionalidades da Toolbar Mobile
    const btnMTab = document.getElementById('btn-m-tab');
    const btnMUp = document.getElementById('btn-m-up');
    const btnMDown = document.getElementById('btn-m-down');
    const btnMCtrlC = document.getElementById('btn-m-ctrlc');

    if (btnMTab) {
        btnMTab.addEventListener('click', () => {
            const input = getActiveInput();
            if (input && !input.disabled) {
                tabComplete(input);
                input.focus();
            }
        });
    }

    if (btnMUp) {
        btnMUp.addEventListener('click', () => {
            const input = getActiveInput();
            if (input && !input.disabled && histIdx < cmdHistory.length - 1) {
                input.value = cmdHistory[++histIdx];
                input.focus();
            }
        });
    }

    if (btnMDown) {
        btnMDown.addEventListener('click', () => {
            const input = getActiveInput();
            if (input && !input.disabled) {
                if (histIdx > 0) {
                    input.value = cmdHistory[--histIdx];
                } else {
                    histIdx = -1;
                    input.value = '';
                }
                input.focus();
            }
        });
    }

    if (btnMCtrlC) {
        btnMCtrlC.addEventListener('click', () => {
            const input = getActiveInput();
            if (input && !input.disabled) {
                input.disabled = true;
                addOut('^C');
                window.pendingSudo = null;
                newLine();
                scrollBottom();
            }
        });
    }

    // ── AUTO-LOGIN & ROTEAMENTO INICIAL DE TELAS ──
    const activeUser = sessionStorage.getItem('_403_active_user');
    if (activeUser) {
        username = activeUser;
        userPassword = sessionStorage.getItem('_403_active_pass') || 'user';
        initFS();

        // Oculta as telas de onboarding bruscamente, pois é um recarregamento
        if ($welcomeScreen) $welcomeScreen.style.display = 'none';
        if ($beginnerScreen) $beginnerScreen.style.display = 'none';
        $loginScreen.style.display = 'none';
        
        $termScreen.style.display  = 'flex';
        $termScreen.style.flexDirection = 'column';
        $termScreen.style.opacity = '1';
        
        printWelcome();
        addOut('[!] Session restored automatically.', 'info');
        
        if (localStorage.getItem('_403_learning') === '1') {
            const savedLesson = parseInt(localStorage.getItem('_403_lesson')) || 0;
            if (typeof startLearningMode === 'function') {
                startLearningMode(savedLesson);
            }
        } else {
            // NOVO: Só esconde o idioma do Top-Left se o usuário voltar direto pro Terminal Livre
            if (topLeftLang) topLeftLang.style.display = 'none';
        }
        newLine();
    } else {
        if ($welcomeScreen) {
            $welcomeScreen.style.opacity = '1';
            $welcomeScreen.style.display = 'flex';
        }
        if ($beginnerScreen) $beginnerScreen.style.display = 'none';
        $loginScreen.style.display = 'none';
        $termScreen.style.display = 'none';
    }
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

/// ── Login ─────────────────────────────────────────────────────────
function initLoginListener() {
    $termScreen.addEventListener('click', (e) => {
        // 1. Evita abrir o teclado se clicar/tocar no painel de missões ou botões
        if (e.target.closest('#mission-panel') || 
            e.target.closest('#editor-overlay') || 
            e.target.tagName.toLowerCase() === 'button') {
            return;
        }

        // 2. Evita abrir o teclado se o usuário estiver apenas selecionando/copiando um texto
        if (window.getSelection().toString().length > 0) {
            return;
        }

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

        //Esconde o botão de idiomas do topo no terminal livre
        const topLeftLang = document.getElementById('top-left-lang');
        if (topLeftLang) topLeftLang.style.display = 'none';
        
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

function scrollBottom() {
    const anchor = document.getElementById('scroll-anchor');
    if (anchor) {
        // Usa smooth para o PC e instantâneo para o mobile para não "travar" visualmente
        const isMobile = window.innerWidth <= 768;
        anchor.scrollIntoView({ 
            behavior: isMobile ? 'auto' : 'smooth', 
            block: 'end' 
        });
    }
}

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
    const hintText = $editName.nextElementSibling;
    
    // Garante que o texto de dicas sempre apareça (corrige o bug da telinha sumida)
    hintText.style.display = 'block';
    
    // Pega os botões mobile
    const btn1 = document.getElementById('editor-btn-1');
    const btn2 = document.getElementById('editor-btn-2');
    const btn3 = document.getElementById('editor-btn-3');

    if (editorMode === 'nano') {
        hintText.innerText = "(Ctrl+X to save & exit | Ctrl+C to cancel)";
        
        // Configura botões para NANO
        if (btn1) { btn1.innerText = 'Save'; btn1.onclick = () => closeEditor(true); btn1.style.display = 'block'; }
        if (btn2) { btn2.innerText = 'Cancel'; btn2.onclick = () => closeEditor(false); btn2.style.display = 'block'; }
        if (btn3) { btn3.style.display = 'none'; } 
        
    } else {
        hintText.innerText = "(Vim: Esc for command mode, then :wq to save or :q! to quit)";
        
        // Configura botões para VIM (Sem o Esc! Apenas Save e Quit diretos)
        if (btn1) { btn1.innerText = 'Save (:wq)'; btn1.onclick = () => closeEditor(true); btn1.style.display = 'block'; }
        if (btn2) { btn2.innerText = 'Quit (:q!)'; btn2.onclick = () => closeEditor(false); btn2.style.display = 'block'; }
        if (btn3) { btn3.style.display = 'none'; }
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
            if (e.key === 'i') {
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