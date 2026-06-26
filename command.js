// ═══════════════════════════════════════════════════════════════════
//  COMMAND.JS — Cérebro (interpretador de comandos)
// ═══════════════════════════════════════════════════════════════════

// hasFlag agora é uma função de nível superior (antes era recriada a cada
// chamada de run()), recebendo o array de flags da própria invocação.
// Os handlers chamam hasFlag(flags, '-x') em vez de hasFlag('-x').
function hasFlag(flags, ...f) {
    // Verifica se alguma das flags procuradas está exatamente no array de flags
    // Isso evita que '--force' seja confundido com '-r'
    return f.some(x => flags.includes(x));
}

// ── Package Registry (Bloqueios) ──────────────────────────────────
// Define quais pacotes liberam quais comandos.
const packageRegistry = {
    'nmap': ['nmap'],
    'python3': ['python3', 'python', 'pip', 'pip3'],
    'nodejs': ['node', 'nodejs', 'npm'],
    'git': ['git'],
    'docker': ['docker', 'docker-compose'],
    'htop': ['htop'],
    'tree': ['tree'],
    'zip': ['zip', 'unzip'],
    'tar': ['tar'],
    'cmatrix': ['cmatrix', 'matrix'],
    'cowsay': ['cowsay', 'cowthink'],
    'neofetch': ['neofetch', 'fastfetch', 'screenfetch'],
    'sl': ['sl'],
    'curl': ['curl'],
    'wget': ['wget'],
    'sqlmap': ['sqlmap'],
    'hydra': ['hydra'],
    'john': ['john'],
    'netcat': ['nc', 'netcat', 'ncat']
};

// Mapa reverso rápido para saber qual pacote um comando exige
const commandToPackage = {};
Object.entries(packageRegistry).forEach(([pkg, cmds]) => {
    cmds.forEach(cmd => commandToPackage[cmd] = pkg);
});

// ── Shared command handlers ─────────────────────────────────────────
// Comandos que compartilham a mesma lógica (antigos fallthroughs do switch)
// apontam para a MESMA função abaixo, garantindo uma única implementação.

// usado por: 'readlink', 'realpath'
const handleReadlink = (params, flags, stdin, cmd, args) => { return resolvePath(params[0] || cwd); };

// usado por: 'top', 'htop'
const handleTop = (params, flags, stdin, cmd, args) => {
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
    };

// usado por: 'who', 'w'
const handleWho = (params, flags, stdin, cmd, args) => { return `${username}   pts/0   ${new Date().toLocaleString('en-US')} (:0)`; };

// usado por: 'env', 'printenv'
const handleEnv = (params, flags, stdin, cmd, args) => {
        if (params.length) return params.map(p => envVars[p]??'').join('\n');
        return Object.entries(envVars).map(([k,v])=>`${k}=${v}`).join('\n');
    };

// ── Process management ────────────────────────────────────────
// usado por: 'kill', 'killall', 'pkill'
const handleKill = (params, flags, stdin, cmd, args) => { return params.length ? `(${cmd}: signal sent to ${params.join(', ')})` : `${cmd}: specify a process`; };

// usado por: 'traceroute', 'tracepath'
const handleTraceroute = (params, flags, stdin, cmd, args) => { return params.length ? `traceroute to ${params[0]}, 30 hops max:\n 1  192.168.1.1  1.234 ms\n 2  10.0.0.1  5.678 ms\n 3  * * *\n 4  ${params[0]}  15.432 ms` : `${cmd}: missing host`; };

// usado por: 'ifconfig', 'ip'
const handleIfconfig = (params, flags, stdin, cmd, args) => {
        const ip = `192.168.1.${Math.floor(Math.random()*200+10)}`;
        return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet ${ip}  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 00:1a:2b:3c:4d:5e  txqueuelen 1000  (Ethernet)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0`;
    };

// usado por: 'netstat', 'ss'
const handleNetstat = (params, flags, stdin, cmd, args) => { return `Netid  State   Recv-Q Send-Q  Local Address:Port  Peer Address:Port\ntcp    LISTEN  0      128     0.0.0.0:22         0.0.0.0:*\ntcp    LISTEN  0      128     0.0.0.0:80         0.0.0.0:*\ntcp    ESTAB   0      0       192.168.1.100:22   192.168.1.1:54321`; };

// ── Package management ────────────────────────────────────────
// usado por: 'apt', 'apt-get'
const handleApt = (params, flags, stdin, cmd, args) => {
    const sub = params[0];
    if (!sub) return 'usage: apt [update|upgrade|install|remove|search|list]';

    // Se a ação for modificar o sistema, EXIGE ROOT (sudo)
    if (['install', 'remove', 'upgrade', 'autoremove'].includes(sub) && effectiveUser !== 'root') {
        return `E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?`;
    }

    const pkgName = params[1];

    if (sub === 'install') {
        if (!pkgName) return 'apt: missing package name';
        if (!packageRegistry[pkgName]) return `E: Unable to locate package ${pkgName}`;
        if (installedPackages.includes(pkgName)) return `${pkgName} is already the newest version.\n0 upgraded, 0 newly installed, 0 to remove.`;

        // Instala!
        installedPackages.push(pkgName);
        if (typeof savePackages === 'function') savePackages();

        return `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${pkgName}\n0 upgraded, 1 newly installed, 0 to remove.\nGet:1 http://deb.debian.org/debian trixie/main amd64 ${pkgName} amd64 [1,234 kB]\nFetched 1,234 kB in 1s (1,234 kB/s)\nSelecting previously unselected package ${pkgName}.\nPreparing to unpack .../${pkgName}.deb ...\nUnpacking ${pkgName} ...\nSetting up ${pkgName} ...`;
    }

    if (sub === 'remove') {
        if (!pkgName) return 'apt: missing package name';
        const idx = installedPackages.indexOf(pkgName);
        if (idx === -1) return `E: Package '${pkgName}' is not installed, so not removed`;
        
        // Remove!
        installedPackages.splice(idx, 1);
        if (typeof savePackages === 'function') savePackages();
        
        return `Reading package lists... Done\nBuilding dependency tree... Done\nThe following packages will be REMOVED:\n  ${pkgName}\n0 upgraded, 0 newly installed, 1 to remove.`;
    }

    if (sub === 'update') return `Hit:1 http://deb.debian.org/debian trixie InRelease\nReading package lists... Done`;
    if (sub === 'search') return packageRegistry[pkgName] ? `${pkgName} - Simulated package available` : `No packages found.`;
    if (sub === 'list') {
        if (params.includes('--installed')) return installedPackages.map(p => `${p}/now 1.0.0 amd64 [installed]`).join('\n') || '(no packages installed)';
        return Object.keys(packageRegistry).map(p => `${p}/trixie 1.0.0 amd64`).join('\n');
    }

    return `apt: '${sub}': subcommand not supported`;
};

// usado por: 'useradd', 'adduser'
const handleUseradd = (params, flags, stdin, cmd, args) => { return params ? `Adding user '${params}'...\nCreating home directory '/home/${params}'.\nDone.` : `${cmd}: missing name`; };

// usado por: 'userdel', 'deluser'
const handleUserdel = (params, flags, stdin, cmd, args) => { return params ? `Removing user '${params}'... (simulated)` : `${cmd}: missing name`; };

// usado por: 'python', 'python3'
const handlePython = async (params, flags, stdin, cmd, args) => {
    // Se o usuário não passou nenhum arquivo, mostramos um aviso
    if (!params.length && !hasFlag(flags, '-c')) {
        return `Python 3.11.3 (WebAssembly)\nType "help", "copyright", "credits" or "license" for more information.\n(Interactive REPL is not fully supported in this terminal yet. Try creating a file with nano/vim and running: python3 script.py)`;
    }

    // Lazy Loading: Só carrega o motor pesado do Python quando o usuário usar o comando pela primeira vez
    if (!window.pyodideInstance) {
        addOut('Starting Python virtual environment... (this may take a few seconds on the first run)', 'info');
        try {
            window.pyodideInstance = await loadPyodide();
            await window.pyodideInstance.runPythonAsync(`
                import sys
                from js import addOut

                class TerminalIO:
                    def write(self, data):
                        addOut(data)
                    def flush(self):
                        pass

                sys.stdout = TerminalIO()
                sys.stderr = TerminalIO()
            `);
        } catch (e) {
            return `[Error] Failed to load Python engine: ${e.message}`;
        }
    }

    let code = '';

    // Verifica se o usuário usou a flag -c (ex: python3 -c "print('ola')")
    if (hasFlag(flags, '-c')) {
        const cIndex = args.indexOf('-c');
        code = args[cIndex + 1];
    } else {
        // Busca o arquivo no HD Virtual
        const abs = resolvePath(params[0]);
        const file = fsGet(abs);
        
        if (!file) return `python3: can't open file '${params[0]}': [Errno 2] No such file or directory`;
        if (file.type === 'dir') return `python3: '${params[0]}' is a directory`;
        
        code = file.content;
    }

    // Redireciona o stdout (prints) e stderr (erros) do Python para variáveis internas
    window.pyodideInstance.runPython(`
        import sys
        import io
        sys.stdout = io.StringIO()
        sys.stderr = io.StringIO()
    `);

    try {
        // Executa o código de verdade!
        await window.pyodideInstance.runPythonAsync(code);
        
        // Captura o que o código Python imprimiu
        const stdout = window.pyodideInstance.runPython("sys.stdout.getvalue()");
        const stderr = window.pyodideInstance.runPython("sys.stderr.getvalue()");
        
        let result = stdout;
        if (stderr) result += (result ? '\n' : '') + stderr;
        
        // Remove a última quebra de linha em branco que o Python coloca por padrão
        return result.replace(/\n$/, ''); 
        
    } catch (err) {
        // Se o código tiver erro de sintaxe, o terminal mostra o Traceback original do Python
        return err.message;
    }
};

// usado por: 'node', 'nodejs'
const handleNode = async (params, flags, stdin, cmd, args) => {
    // Se não passou arquivo
    if (!params.length && !hasFlag(flags, '-e')) {
        return `Welcome to Node.js v20.11.0.\nType ".help" for more information.\n(Interactive REPL is not supported in this terminal yet. Create a file and run: node script.js)`;
    }

    let code = '';

    // Verifica se o usuário usou a flag -e (ex: node -e "console.log('ola')")
    if (hasFlag(flags, '-e')) {
        const eIndex = args.indexOf('-e');
        code = args[eIndex + 1];
    } else {
        // Busca o arquivo no VFS
        const abs = resolvePath(params[0]);
        const file = fsGet(abs);
        
        if (!file) return `node: Cannot find module '${params[0]}'\ncode: 'MODULE_NOT_FOUND'`;
        if (file.type === 'dir') return `node: '${params[0]}' is a directory`;
        
        code = file.content;
    }

    // Variável para guardar o que o código imprimir
    let output = [];
    
    // Salva as funções originais do console do navegador
    const originalLog = console.log;
    const originalError = console.error;
    
    // Sequestra o console.log para o nosso terminal
    console.log = (...msg) => {
        // Converte os argumentos (objetos, arrays, strings) em texto e joga no array
        output.push(msg.map(m => typeof m === 'object' ? JSON.stringify(m) : String(m)).join(' '));
    };
    
    console.error = (...msg) => {
        output.push('[Error] ' + msg.map(m => typeof m === 'object' ? JSON.stringify(m) : String(m)).join(' '));
    };

    try {
        // Cria uma função assíncrona isolada com o código do usuário e a executa
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const runner = new AsyncFunction(code);
        await runner();
    } catch (err) {
        // Se der erro de sintaxe, mostra o erro do JS
        output.push(err.toString());
    } finally {
        // É CRUCIAL devolver o console original para o navegador, senão você quebra seu próprio site!
        console.log = originalLog;
        console.error = originalError;
    }

    // Retorna a junção de tudo que foi printado
    return output.join('\n');
};
// usado por: 'gcc', 'g++', 'cc'
const handleGcc = (params, flags, stdin, cmd, args) => {
    if (!params.length) return `${cmd}: no input files`;
    const oIdx = args.indexOf('-o');
    const outFile = oIdx !== -1 ? args[oIdx+1] : 'a.out';
    vfs[resolvePath(outFile)] = { type:'file', content:'(binary)', perms:'-rwxr-xr-x', size:8192, mdate:nowStr() };
    return `(compiled: ${params.filter(p=>!p.startsWith('-')).join(' ')} → ${outFile})`;
};
// ── Editors (simulated) ───────────────────────────────────────
// usado por: 'nano', 'vim', 'vi', 'nvim', 'emacs', 'gedit', 'code'
// usado por: 'nano', 'vim', 'vi', 'nvim', 'emacs', 'gedit', 'code'
const handleNano = (params, flags, stdin, cmd, args) => {
    if (!params.length) return `(${cmd}: no file specified)`;
    
    const abs = resolvePath(params[0]);
    const file = fsGet(abs);
    
    // Se o arquivo não existir, cria um vazio
    const content = file ? file.content : '';
    
    // Chama a função global no terminal.js passando o NOME DO COMANDO (cmd)
    openEditor(params[0], content, cmd);
    
    return null; 
};

// usado por: 'bzip2', 'xz', 'zstd'
const handleBzip2 = (params, flags, stdin, cmd, args) => { return `(${cmd}: simulated compression)`; };

// usado por: 'source', '.'
const handleSource = (params, flags, stdin, cmd, args) => { return `(source: '${params[0]||''}' loaded — simulated)`; };

// usado por: 'strace', 'ltrace'
const handleStrace = (params, flags, stdin, cmd, args) => { return `(${cmd}: tracing '${params.join(' ')}' — simulated)`; };

// ── Fun / Easter eggs ─────────────────────────────────────────
// usado por: 'cowsay', 'cowthink'
const handleCowsay = (params, flags, stdin, cmd, args) => {
        const text = params.join(' ') || 'Moo!';
        const border = '-'.repeat(text.length+2);
        const bubble = cmd==='cowthink' ? `( ${text} )` : `< ${text} >`;
        return [` ${border}`, ` ${bubble}`, ` ${border}`, '         \\   ^__^', '          \\  (oo)\\_______', '             (__)\\       )\\/\\', '                 ||----w |', '                 ||     ||'].join('\n');
    };

// usado por: 'cmatrix', 'matrix'
const handleCmatrix = (params, flags, stdin, cmd, args) => {
        const chars = '01アイウエオカキクケコサシスセソタチ';
        return Array.from({length:8}, ()=>
            Array.from({length:40}, ()=>chars[Math.floor(Math.random()*chars.length)]).join(' ')
        ).join('\n')+'\n\n[ Press Ctrl+C to exit — simulated ]';
    };

// usado por: 'neofetch', 'fastfetch', 'screenfetch'
const handleNeofetch = (params, flags, stdin, cmd, args) => {
        const files = Object.keys(vfs).filter(k=>k.startsWith(envVars.HOME)).length;
        return [
            `       _,met$$$$$gg.          ${username}@${HOSTNAME}`,
            `    ,g$$$$$$$$$$$$$$$P.       ${'─'.repeat((username+HOSTNAME).length+1)}`,
            `  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 13 (trixie) x86_64`,
            ` ,$$P'              \`$$$.     Kernel: 6.1.0-18-amd64`,
            `',$$P       ,ggs.     \`$$b:   Uptime: ${Math.floor(Math.random()*30)+1} days, 3 hours`,
            `\`d$$'     ,$$P"'   .    $$$    Shell: bash 5.2.15`,
            ` $$P      d$'     ,$$P  $$P     Terminal: xterm-256color`,
            ` $$:      $$.   -'$$:  ,d$$'    CPU: Your CPU`,
            ` $$\\;      Y$b._   \`___dsP    GPU: Your GPU`,
            `   Y$$.    \`./\\YS$$$$P"'      Memory: Your memory, lol`,
            `    \`$$b      "-.__            Disk: 500PB`,
            `     \`Y$$                      Files: ${files} in $HOME`,
            `      \`Y$$.`,
            `        \`$$b.`,
            `          \`Y$$b.`,
            `             \`"Y$b._`,
            `                 \`""""`,
        ].join('\n');
    };

// ── Session ───────────────────────────────────────────────────
// usado por: 'clear', 'reset'
const handleClear = (params, flags, stdin, cmd, args) => {
        $terminal.innerHTML = '';
        return null;
    };

// usado por: 'exit', 'logout'
const handleExit = (params, flags, stdin, cmd, args) => {
    addOut(`Closing session... Goodbye, ${username}!`);
    
    // NOVO: Limpa a sessão para o F5 voltar a pedir login
    sessionStorage.removeItem('_403_active_user');
    sessionStorage.removeItem('_403_active_pass');
    sessionStorage.removeItem('_403_cwd');

    // NOVO: Limpa a sessão de aprendizado ao dar exit
    sessionStorage.removeItem('_403_learning');
    sessionStorage.removeItem('_403_lesson');
    if (typeof stopLearningMode === 'function' && isLearning) stopLearningMode();
    
    $termScreen.dataset.exiting = '1';
    setTimeout(() => {
        $terminal.innerHTML = '';
        $termScreen.style.display = 'none';
        delete $termScreen.dataset.exiting;
        $loginScreen.style.display = 'flex';
        $loginInput.value = '';
        document.getElementById('password-input').value = ''; // Limpa a senha
        document.getElementById('password-line').style.display = 'none';
        $loginInput.focus();
        username = ''; vfs = {}; cmdHistory = []; aliases = {};
    }, 1200);
    return null;
};

// usado por: 'poweroff', 'halt', 'shutdown'
const handlePoweroff = (params, flags, stdin, cmd, args) => {
        const off = hasFlag(flags, '-h','-P') || params[0]==='now' || params.includes('now') || cmd!=='shutdown';
        addOut(off ? 'Shutting down the system...' : `shutdown: scheduled.`);
        if (off) setTimeout(() => { $terminal.innerHTML=''; addOut('System halted. Refresh the page to restart.'); }, 1500);
        return null;
    };

// ── Help ──────────────────────────────────────────────────────
// usado por: 'help', '--help'
const handleHelp = (params, flags, stdin, cmd, args) => {
    const cat = params[0] ? params[0].toLowerCase() : '';

    // Dicionário contendo as páginas do Help
    const pages = {
        core: [
            ' NAVIGATION   cd, ls, ll, la, l, pwd, tree, dir',
            ' FILES        touch, mkdir, rm, cp, mv, cat, tac, head, tail, wc, file, stat',
            '              find, ln, truncate, fallocate, shred, dd, rsync',
            ' ENVIRONMENT  env, export, printenv, set, unset, alias, unalias, history, type, source',
            ' TERMINAL     clear, reset, exit, logout, reboot, shutdown, poweroff, screen, tmux, script',
            ' EDITORS      nano, vim, vi, nvim, emacs (all simulated)'
        ].join('\n'),

        sys: [
            ' SYSTEM       uname, hostname, date, cal, uptime, free, df, du, ps, top, htop',
            '              lsblk, lscpu, lshw, lspci, lsusb, dmesg, vmstat, iostat, sar',
            '              pidstat, sensors, acpi, hdparm, smartctl, sysctl, lsmod',
            ' PROCESSES    kill, killall, pkill, jobs, bg, fg, nice, nohup, sleep, time, watch, xargs',
            ' USERS/ID     id, whoami, who, w, last, groups, finger, passwd, su, sudo, useradd...',
            ' DISK/SVC     fdisk, mkfs, mount, umount, systemctl, service, journalctl, crontab...',
            ' PACKAGES     apt, apt-get, dpkg, snap, dpkg-reconfigure'
        ].join('\n'),

        net: [
            ' NETWORK      ping, traceroute, mtr, ifconfig, ip, arp, route, netstat, ss, nmap',
            '              wget, curl, ssh, scp, telnet, ftp, sftp, nc, iperf3, ab, whois',
            '              dig, host, nslookup, proxychains, myip, ipinfo, ports, headers',
            ' SECURITY     iptables, ufw, tcpdump, hydra, john, hashcat, nikto, sqlmap',
            '              ssh-keygen, openssl, gpg, aircrack-ng, msfconsole, burpsuite'
        ].join('\n'),

        dev: [
            ' DEV          git, python3, node, npm, yarn, php, ruby, perl, lua, go, gcc, g++',
            '              make, cmake, cargo, docker, docker-compose, kubectl, terraform',
            '              ansible, which, whereis, locate, man, gdb, valgrind',
            ' TEXT         echo, grep, sed, awk, sort, uniq, cut, tr, diff, nl, rev, tee...',
            ' ENCODE       base64, md5sum, sha256sum, xxd, hexdump, strings, rot13, urlencode...'
        ].join('\n'),

        misc: [
            ' MATH         bc, expr, factor, seq, numfmt, units, dc',
            ' UTILITIES    weather, randpw, uuid, notify-send, convert, ffmpeg',
            ' ARCHIVES     tar, zip, unzip, gzip, gunzip, bzip2, xz',
            ' SHORTCUTS    ctf, cheatsheet, _403, ports, myip, binary, hex',
            ' FUN/EASTER   cowsay, fortune, sl, figlet, cmatrix, lolcat, neofetch, banner, 67'
        ].join('\n')
    };

    // Se o usuário digitou uma categoria válida (ex: 'help net')
    if (pages[cat]) {
        return `\n=== _403 HELP : ${cat.toUpperCase()} ===\n\n${pages[cat]}\n\nTip: Use 'man <command>' for specific details.`;
    }

    // Se o usuário digitou uma categoria que não existe
    if (cat) {
        return `help: category '${cat}' not found.\nValid categories: core, sys, net, dev, misc`;
    }

    // Menu Principal (se digitar apenas 'help')
    return [
        '╔══════════════════════════════════════════════════════════════╗',
        '║                   _403 SIMULATED TERMINAL                    ║',
        '╚══════════════════════════════════════════════════════════════╝',
        '',
        'The commands are grouped by category to keep the terminal clean.',
        'Usage: help [category]',
        '',
        'CATEGORIES:',
        '  help core   → Navigation, files, environment, editors',
        '  help sys    → System info, processes, users, disks, packages',
        '  help net    → Network tools, DNS, security, pentest',
        '  help dev    → Programming, text processing, hex/encoding',
        '  help misc   → Math, archives, utilities, easter eggs',
        '',
        'SHORTCUTS & TIPS:',
        '  ↑ / ↓       → Navigate command history',
        '  Tab         → Autocomplete files and directories',
        '  Ctrl+L      → Clear the terminal screen',
        '  Ctrl+C      → Cancel current input',
        '  > or >>     → Redirect output to a file (e.g., echo "hi" > text.txt)',
        '  && or ||    → Chain commands (e.g., mkdir test && cd test)',
        '',
        'Try typing \'cheatsheet bash\' or \'ctf\' for extra resources!'
    ].join('\n');
};

// usado por: 'nc', 'netcat', 'ncat'
const handleNc = (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-l')) return `(${cmd}: listening on port ${params||'4444'} — simulated)`;
        return params.length ? `(${cmd}: connecting to ${params}:${params[1]||'80'} — simulated)` : `usage: ${cmd} [-l] HOST PORT`;
    };

// usado por: 'ftp', 'sftp'
const handleFtp = (params, flags, stdin, cmd, args) => { return params.length ? `Connected to ${params}.\n220 FTP server ready.\nName (${params}:${username}): (${cmd}: simulated session)` : `usage: ${cmd} HOST`; };

// usado por: 'proxychains', 'proxychains4'
const handleProxychains = async (params, flags, stdin, cmd, args) => {
    if (!params.length) return 'usage: proxychains COMMAND [ARGS]';
    const output = await run(params[0], params.slice(1), null);
    return `[proxychains] config file found: /etc/proxychains4.conf\n[proxychains] preloading /usr/lib/libproxychains.so.4\n[proxychains] DLL init: proxychains-ng 4.16\n` + (output || '');
    };

// usado por: 'wireshark', 'tshark'
const handleWireshark = (params, flags, stdin, cmd, args) => { return `(${cmd}: packet analyzer — requires graphical environment)\nTip: use 'tcpdump' for packet capture in the terminal`; };

// usado por: 'msfconsole', 'metasploit'
const handleMsfconsole = (params, flags, stdin, cmd, args) => {
        return [
            '       =[ metasploit v6.3.44-dev                          ]',
            '+ -- --=[ 2376 exploits - 1232 auxiliary - 413 post       ]',
            '+ -- --=[ 1163 payloads - 46 encoders - 11 nops           ]',
            '',
            'msf6 > (interactive mode not supported in this simulated terminal)',
            '[!] Use only in authorized CTFs and your own labs.',
        ].join('\n');
    };

// usado por: 'burpsuite', 'burp'
const handleBurpsuite = (params, flags, stdin, cmd, args) => { return '(Burp Suite: graphical tool — requires graphical interface)\nTip: use the free Community version at https://portswigger.net/burp'; };

// usado por: 'aircrack-ng', 'airodump-ng', 'aireplay-ng'
const handleAircrackNg = (params, flags, stdin, cmd, args) => { return `(${cmd}: WiFi auditing tool — requires wireless card with monitor mode)\n[!] Use only on your own networks or with explicit authorization.\n    Unauthorized use is illegal.`; };

// usado por: 'update-grub', 'grub-update'
const handleUpdateGrub = (params, flags, stdin, cmd, args) => { return `Generating grub configuration file ...\nFound linux image: /boot/vmlinuz-6.1.0-18-amd64\nFound initrd image: /boot/initrd.img-6.1.0-18-amd64\ndone`; };

// usado por: 'mkfs', 'mkfs.ext4', 'mkfs.xfs'
const handleMkfs = (params, flags, stdin, cmd, args) => {
        if (!params.length) return `usage: ${cmd} DEVICE`;
        return `mke2fs 1.47.0 (5-Feb-2023)\nCreating filesystem with ${Math.floor(Math.random()*1000000)} 4k blocks and ${Math.floor(Math.random()*100000)} inodes\nSuper-block backups stored on blocks: 32768, 98304\n\nAllocating group tables: done\nWriting inode tables: done\nCreating journal (16384 blocks): done\nWriting superblocks and filesystem accounting information: done`;
    };

// usado por: 'fsck', 'e2fsck'
const handleFsck = (params, flags, stdin, cmd, args) => {
        if (!params.length) return `usage: ${cmd} [options] DEVICE`;
        return `e2fsck 1.47.0 (5-Feb-2023)\n${params}: clean, 45123/2621440 files, 1234567/10485504 blocks`;
    };

// usado por: 'hexdump', 'hd'
const handleHexdump = (params, flags, stdin, cmd, args) => {
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
    };

// ── Dev / Languages ───────────────────────────────────────────
// usado por: 'pip', 'pip3'
const handlePip = (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return `${cmd} ${cmd==='pip3'?'23.2.1':'23.2.1'} from /usr/lib/python3/dist-packages/pip (python 3.11)`;
        if (sub==='install') return params[1] ? `Collecting ${params[1]}\n  Downloading ${params[1]}-1.0.0-py3-none-any.whl (42 kB)\nInstalling collected packages: ${params[1]}\nSuccessfully installed ${params[1]}-1.0.0` : 'pip: missing package name';
        if (sub==='uninstall') return params[1] ? `Found existing installation: ${params[1]}\nUninstalling ${params[1]}-1.0.0:\nSuccessfully uninstalled ${params[1]}-1.0.0` : 'pip: missing operand';
        if (sub==='list') return `Package         Version\n--------------- -------\nnumpy           1.24.3\npandas          2.0.3\nrequests        2.31.0\nFlask           3.0.0\nscapy           2.5.0`;
        if (sub==='freeze') return `Flask==3.0.0\nnumpy==1.24.3\npandas==2.0.3\nrequests==2.31.0`;
        if (sub==='show') return `Name: ${params[1]||'package'}\nVersion: 1.0.0\nSummary: Package description\nHome-page: https://pypi.org/project/${params[1]||'package'}/\nLocation: /usr/lib/python3/dist-packages`;
        if (sub==='search') return `NOTICE: pip search has been disabled by PyPI.\nGo to https://pypi.org/search/?q=${params[1]||''}`;
        return `pip: '${sub}': unknown command`;
    };

// usado por: 'virtualenv', 'venv'
const handleVirtualenv = (params, flags, stdin, cmd, args) => {
        const name = params[0] || 'venv';
        fsMkdir(resolvePath(name));
        fsMkdir(resolvePath(name+'/bin'));
        fsMkdir(resolvePath(name+'/lib'));
        fsTouch(resolvePath(name+'/bin/activate'), `# Activate with: source ${name}/bin/activate`);
        return `created virtual environment CPython3.11.4.final.0-64 in ${name}\n  creator CPython3Posix(dest=${cwd}/${name}, clear=False, no_vcs_ignore=False, global=True)`;
    };

// usado por: 'addgroup', 'groupmod'
const handleAddgroup = (params, flags, stdin, cmd, args) => { return params.length ? `(${cmd}: group '${params}' ${cmd==='addgroup'?'created':'modified'} — simulated)` : `${cmd}: missing name`; };

// usado por: 'xclip', 'xsel'
const handleXclip = (params, flags, stdin, cmd, args) => { return stdin ? `(${cmd}: ${stdin.slice(0,40)} copied to clipboard — simulated)` : `(${cmd}: clipboard — simulated)`; };

// usado por: 'lynx', 'w3m', 'links'
const handleLynx = (params, flags, stdin, cmd, args) => { return params.length ? `(${cmd}: text browser — rendering '${params[0]}' — simulated)\n[Press 'q' to exit]` : `usage: ${cmd} URL`; };

// usado por: 'ffmpeg', 'ffprobe'
const handleFfmpeg = (params, flags, stdin, cmd, args) => { return params.length ? `(${cmd}: processing media — simulated)` : `${cmd} version 5.1.3`; };

// usado por: 'uuid', 'uuidgen'
const handleUuid = (params, flags, stdin, cmd, args) => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random()*16|0;
            return (c==='x'?r:(r&0x3|0x8)).toString(16);
        });
    };


// ── coreCommands: dicionário de comandos ────────────────────────────
const coreCommands = {
    // ── Navigation ───────────────────────────────────────────────
    'lula': (params, flags, stdin, cmd, args) => { return 'Faz o L'; },

    'pwd': (params, flags, stdin, cmd, args) => { return cwd; },

    'cd': (params, flags, stdin, cmd, args) => {
        const target = params[0] || envVars.HOME;
        const abs = resolvePath(target);
        const n = fsGet(abs);
        if (!n) return `bash: cd: ${target}: No such file or directory`;
        if (n.type !== 'dir') return `bash: cd: ${target}: Not a directory`;
        
        // Se não tiver permissão de execução (x), barra o acesso
        if (!checkPermission(abs, 'x')) return `bash: cd: ${target}: Permission denied`;
        
        cwd = abs;
        envVars.PWD = abs;
        return null;
    },

    'ls': (params, flags, stdin, cmd, args) => {
        const showAll  = hasFlag(flags, '-a', '-A');
        const showLong = hasFlag(flags, '-l');
        const showHuman= hasFlag(flags, '-h');
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
    },

    'tree': (params, flags, stdin, cmd, args) => {
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
},

    // ── File operations ───────────────────────────────────────────
    'mkdir': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'mkdir: missing operand';
        for (const p of params) {
            const abs = resolvePath(p);
            
            // Descobre quem é a pasta pai (ex: /etc/apt -> /etc)
            const parentDir = abs.substring(0, abs.lastIndexOf('/')) || '/';
            if (!checkPermission(parentDir, 'w')) return `mkdir: cannot create directory '${p}': Permission denied`;
            
            if (fsGet(abs) && !hasFlag(flags, '-p')) return `mkdir: cannot create directory '${p}': File exists`;
            if (hasFlag(flags, '-p')) {
                const parts = abs.split('/').filter(Boolean);
                let cur = '';
                for (const part of parts) { cur += '/' + part; if (!vfs[cur]) fsMkdir(cur); }
            } else {
                fsMkdir(abs);
            }
        }
        return null;
    },

    'touch': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'touch: missing file operand';
        for (const p of params) {
            const abs = resolvePath(p);
            
            if (vfs[abs]) {
                if (!checkPermission(abs, 'w')) return `touch: cannot touch '${p}': Permission denied`;
                vfs[abs].mdate = nowStr();
            } else {
                const parentDir = abs.substring(0, abs.lastIndexOf('/')) || '/';
                if (!checkPermission(parentDir, 'w')) return `touch: cannot touch '${p}': Permission denied`;
                fsTouch(abs, '');
            }
        }
        return null;
    },

    'rm': (params, flags, stdin, cmd, args) => {
        const recursive = hasFlag(flags, '-r', '-R');
        const force     = hasFlag(flags, '-f');
        if (!params.length) return 'rm: missing operand';

        let output = [];

        for (const p of params) {
            const abs = resolvePath(p);
            
            // Proteção contra o suicídio do sistema
            if (abs === '/') return `rm: it is dangerous to operate recursively on '/'`;

            const n = fsGet(abs);

            if (!n) {
                if (!force) output.push(`rm: cannot remove '${p}': No such file or directory`);
                continue;
            }

            // Verifica permissão de modificação/escrita
            if (!checkPermission(abs, 'w')) {
                output.push(`rm: cannot remove '${p}': Permission denied`);
                continue;
            }

            if (n.type === 'dir') {
                if (!recursive) { output.push(`rm: cannot remove '${p}': Is a directory`); continue; }
                Object.keys(vfs).forEach(k => {
                    if (k === abs || k.startsWith(abs + '/')) delete vfs[k];
                });
            } else {
                delete vfs[abs];
            }
        }
        
        return output.length ? output.join('\n') : null;
    },

    'cp': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'cp: missing destination file operand';
        const srcAbs = resolvePath(params[0]);
        const srcN   = fsGet(srcAbs);
        if (!srcN) return `cp: '${params[0]}': No such file or directory`;
        if (srcN.type === 'dir' && !hasFlag(flags, '-r','-R')) return `cp: -r not specified; omitting directory '${params[0]}'`;
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
    },

    'mv': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'mv: missing destination file operand';
        const srcAbs = resolvePath(params[0]);
        const srcN   = fsGet(srcAbs);
        if (!srcN) return `mv: '${params[0]}': No such file or directory`;
        const dstAbs0 = resolvePath(params[params.length-1]);
        const dstN    = fsGet(dstAbs0);
        const dstAbs  = dstN?.type === 'dir' ? dstAbs0+'/'+srcAbs.split('/').pop() : dstAbs0;
        Object.keys(vfs).filter(k => k === srcAbs || k.startsWith(srcAbs + '/')).forEach(k => {
        vfs[dstAbs + k.slice(srcAbs.length)] = { ...vfs[k], mdate: nowStr() };
        delete vfs[k]; // Apaga o antigo após copiar
    });
        return null;
    },

    'cat': (params, flags, stdin, cmd, args) => {
        if (!params.length) return stdin ?? 'cat: stdin not supported';
        return params.map(p => {
            const abs = resolvePath(p);
            const n = fsGet(abs);
            if (!n) return `cat: ${p}: No such file or directory`;
            if (n.type === 'dir') return `cat: ${p}: Is a directory`;
            
            // Verifica permissão de leitura
            if (!checkPermission(abs, 'r')) return `cat: ${p}: Permission denied`;
            
            return n.content ?? '';
        }).join('\n');
    },

    'tac': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? fsGet(resolvePath(params[0]))?.content : stdin;
        if (src === undefined || src === null) return 'tac: No such file or directory';
        return src.split('\n').reverse().join('\n');
    },

    'head': (params, flags, stdin, cmd, args) => {
        const nIdx = args.indexOf('-n');
        const n = nIdx !== -1 ? parseInt(args[nIdx+1]) || 10 : 10;
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'head: missing file operand';
        return src.split('\n').slice(0, n).join('\n');
    },

    'tail': (params, flags, stdin, cmd, args) => {
        const nIdx = args.indexOf('-n');
        const n = nIdx !== -1 ? parseInt(args[nIdx+1]) || 10 : 10;
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'tail: missing file operand';
        return src.split('\n').slice(-n).join('\n');
    },

    'wc': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'wc: missing file operand';
        const lines = src.split('\n').length;
        const words = src.trim().split(/\s+/).filter(Boolean).length;
        const chars = src.length;
        if (hasFlag(flags, '-l')) return String(lines);
        if (hasFlag(flags, '-w')) return String(words);
        if (hasFlag(flags, '-c')) return String(chars);
        return `${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(chars).padStart(7)}${params[0] ? ' '+params[0] : ''}`;
    },

    'grep': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: grep PATTERN [FILE]';
        const pat = params[0];
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return `grep: ${params[1]||'stdin'}: No such file or directory`;
        const re = new RegExp(pat, hasFlag(flags, '-i') ? 'i' : '');
        const matched = src.split('\n').filter(l => re.test(l));
        if (hasFlag(flags, '-c')) return String(matched.length);
        if (hasFlag(flags, '-v')) return src.split('\n').filter(l => !re.test(l)).join('\n');
        return matched.join('\n');
    },

    'sed': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: sed SCRIPT [FILE]';
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? '') : (stdin ?? '');
        const m = params[0].match(/^s\/(.+?)\/(.*)\/([gi]*)$/);
        if (!m) return `sed: '${params[0]}': invalid script`;
        try { return src.replace(new RegExp(m[1], m[3]||'g'), m[2]); }
        catch { return 'sed: invalid regex'; }
    },

    'awk': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: awk PROGRAM [FILE]';
        const src = params[1] ? (fsGet(resolvePath(params[1]))?.content ?? '') : (stdin ?? '');
        const pm = params[0].match(/\{print \$(\d+)\}/);
        if (pm) { const col = parseInt(pm[1])-1; return src.split('\n').map(l => l.trim().split(/\s+/)[col]??'').join('\n'); }
        if (params[0] === '{print}') return src;
        return `(awk: '${params[0]}' — partial support)`;
    },

    'sort': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'sort: missing file operand';
        const lines = src.split('\n');
        const sorted = hasFlag(flags, '-n') ? lines.sort((a,b)=>parseFloat(a)-parseFloat(b)) : lines.sort();
        return (hasFlag(flags, '-r') ? sorted.reverse() : sorted).join('\n');
    },

    'uniq': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'uniq: missing file operand';
        return src.split('\n').filter((l,i,a) => i===0 || l!==a[i-1]).join('\n');
    },

    'theme': (params, flags, stdin, cmd, args) => {
        const chosen = params[0];
        const validThemes = window.AVAILABLE_THEMES; // <- Consumindo do lugar certo
        
        if (!chosen) {
            return `Available themes: ${validThemes.join(', ')}\nUsage: theme [theme_name]`;
        }
        if (!validThemes.includes(chosen.toLowerCase())) {
            return `theme: '${chosen}' is not a valid theme.`;
        }
        
        setTheme(chosen.toLowerCase());
        return `Theme changed to '${chosen}' successfully!`;
    },

   'cut': (params, flags, stdin, cmd, args) => {
        const dIdx = args.indexOf('-d');
        const d = dIdx !== -1 ? args[dIdx+1] : '\t';
        const fIdx = args.indexOf('-f');
        const fStr = fIdx !== -1 ? args[fIdx+1] : '1';
        const cols = fStr.split(',').map(x=>parseInt(x)-1);
        const src = params.find(p => !p.startsWith('-'))
            ? (fsGet(resolvePath(params.find(p=>!p.startsWith('-'))))?.content ?? null)
            : stdin;
        if (src === null || src === undefined) return 'cut: missing file operand';
        return src.split('\n').map(l => cols.map(c => l.split(d)[c]??'').join(d)).join('\n');
    },
    'tr': (params, flags, stdin, cmd, args) => {
        const src = stdin ?? '';
        if (params.length < 2) return 'usage: echo text | tr SET1 SET2';
        let result = src;
        for (let i = 0; i < Math.min(params[0].length, params[1].length); i++)
            result = result.split(params[0][i]).join(params[1][i]);
        return result;
    },

    'diff': (params, flags, stdin, cmd, args) => {
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
    },

    'echo': (params, flags, stdin, cmd, args) => {
        let text = params.join(' ');
        if (hasFlag(flags, '-e')) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        // A regex de variável foi removida daqui! O tokenize já entregou o valor expandido.
        return text;
    },

    'printf': (params, flags, stdin, cmd, args) => { return params.join(''); },

    'file': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'file: missing operand';
        return params.map(p => {
            const n = fsGet(resolvePath(p));
            if (!n) return `${p}: ERROR: cannot open '${p}' (No such file or directory)`;
            if (n.type === 'dir') return `${p}: directory`;
            const ext = p.split('.').pop().toLowerCase();
            const types = {txt:'ASCII text',sh:'Bourne-Again shell script',py:'Python script',js:'JavaScript source',json:'JSON data',md:'ASCII text',html:'HTML document',c:'C source',cpp:'C++ source',h:'C header',rs:'Rust source'};
            return `${p}: ${types[ext] || 'ASCII text'}`;
        }).join('\n');
    },

    'stat': (params, flags, stdin, cmd, args) => {
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
    },

    'find': (params, flags, stdin, cmd, args) => {
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
    },

    'ln': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: ln [-s] TARGET LINK_NAME';
        const src = resolvePath(params[0]), dst = resolvePath(params[1]);
        const n = fsGet(src);
        if (!n) return `ln: failed to create symbolic link '${params[0]}': No such file or directory`;
        vfs[dst] = { ...n, mdate: nowStr() };
        return null;
    },

    'chmod': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: chmod MODE FILE';
        const path = resolvePath(params[1]);
        if (!vfs[resolvePath(params[1])]) return `chmod: cannot access '${params[1]}': No such file or directory`;
        vfs[path].perms = params[0];
        return null;
    },

    'chown': (params, flags, stdin, cmd, args) => { return params.length < 2 ? 'usage: chown OWNER FILE' : null; },

    'readlink': handleReadlink,
    'realpath': handleReadlink,
    'basename': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'basename: missing operand';
        const b = params[0].split('/').pop();
        return params[1] ? b.replace(new RegExp(params[1].replace('.','\\.')+'$'),'') : b;
    },

    'dirname': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'dirname: missing operand';
        const parts = params[0].split('/'); parts.pop();
        return parts.join('/') || '/';
    },

    // ── Text utilities ────────────────────────────────────────────
    'base64': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'base64: missing input';
        try { return hasFlag(flags, '-d') ? atob(src.trim()) : btoa(unescape(encodeURIComponent(src))); }
        catch { return 'base64: invalid input'; }
    },

    'md5sum': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'md5sum: missing input';
        const fake = Array.from({length:32}, ()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
        return `${fake}  ${params[0]||'-'}`;
    },

    'sha256sum': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'sha256sum: missing input';
        const fake = Array.from({length:64}, ()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
        return `${fake}  ${params[0]||'-'}`;
    },

    'xxd': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'xxd: missing file operand';
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `xxd: ${params[0]}: No such file or directory`;
        return (n.content||'').slice(0,128).split('').map((c,i) =>
            i%16===0 ? `${i.toString(16).padStart(8,'0')}: ${c.charCodeAt(0).toString(16).padStart(2,'0')}` : c.charCodeAt(0).toString(16).padStart(2,'0')
        ).join(' ');
    },

    'nl': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.split('\n').map((l,i)=>`${String(i+1).padStart(6)}\t${l}`).join('\n');
    },

    'rev': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.split('\n').map(l=>l.split('').reverse().join('')).join('\n');
    },

    'tee': (params, flags, stdin, cmd, args) => {
        if (params.length) fsTouch(resolvePath(params[0]), stdin ?? '');
        return stdin ?? '';
    },

    'column': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src;
    },

    'morse': (params, flags, stdin, cmd, args) => {
        const M = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',' ':'/'};
        return params.join(' ').toUpperCase().split('').map(c=>M[c]||c).join(' ');
    },

    // ── System info ───────────────────────────────────────────────
    'uname': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-a')) return `Linux ${HOSTNAME} 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.69-1 (2023-12-30) x86_64 GNU/Linux`;
        if (hasFlag(flags, '-r')) return '6.1.0-18-amd64';
        if (hasFlag(flags, '-s')) return 'Linux';
        if (hasFlag(flags, '-n')) return HOSTNAME;
        if (hasFlag(flags, '-m')) return 'x86_64';
        if (hasFlag(flags, '-o')) return 'GNU/Linux';
        return 'Linux';
    },

    'hostname': (params, flags, stdin, cmd, args) => { return HOSTNAME; },

    'date': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-u')) return new Date().toUTCString();
        if (params.length && params[0].startsWith('+')) {
            const d = new Date(), f = params[0].slice(1);
            return f.replace('%Y',d.getFullYear()).replace('%m',String(d.getMonth()+1).padStart(2,'0')).replace('%d',String(d.getDate()).padStart(2,'0')).replace('%H',String(d.getHours()).padStart(2,'0')).replace('%M',String(d.getMinutes()).padStart(2,'0')).replace('%S',String(d.getSeconds()).padStart(2,'0'));
        }
        return new Date().toString();
    },

    'cal': (params, flags, stdin, cmd, args) => {
        const d = new Date(), m = d.getMonth(), y = d.getFullYear();
        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const firstDay = new Date(y,m,1).getDay();
        const daysInMonth = new Date(y,m+1,0).getDate();
        const cells = Array(firstDay).fill('  ');
        for (let dd=1;dd<=daysInMonth;dd++) cells.push(String(dd).padStart(2));
        const weeks = [];
        for (let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7).join(' '));
        return [`   ${MONTHS[m]} ${y}   `,'Su Mo Tu We Th Fr Sa',...weeks].join('\n');
    },

    'uptime': (params, flags, stdin, cmd, args) => {
        const days = Math.floor(Math.random()*30)+1;
        return ` ${new Date().toLocaleTimeString('en-US')} up ${days} days,  3:22,  1 user,  load average: 0.08, 0.15, 0.12`;
    },

    'free': (params, flags, stdin, cmd, args) => {
        const h = hasFlag(flags, '-h');
        const fmt = n => (h ? humanBytes(n).padStart(9) : String(n).padStart(14));
        return [
            '               total        used        free      shared  buff/cache   available',
            `Mem:   ${fmt(8*1024**2)} ${fmt(2*1024**2)} ${fmt(4*1024**2)} ${fmt(512*1024)} ${fmt(2*1024**2)} ${fmt(5.5*1024**2)}`,
            `Swap:  ${fmt(2*1024**2)} ${fmt(0)} ${fmt(2*1024**2)}`,
        ].join('\n');
    },

    'df': (params, flags, stdin, cmd, args) => {
        const h = hasFlag(flags, '-h');
        return [
            `Filesystem   ${h?'Size':'1K-blocks'}    Used   Avail Use% Mounted on`,
            `/dev/sda1    ${h?'50G':'52428800'}  ${h?'12G':'12582912'} ${h?'36G':'37748736'} 25% /`,
            `tmpfs        ${h?'3.9G':'4063232'}      0  ${h?'3.9G':'4063232'}  0% /dev/shm`,
            `/dev/sda2    ${h?'200G':'209715200'} ${h?'45G':'47185920'} ${h?'145G':'152832000'} 24% /home`,
        ].join('\n');
    },

    'du': (params, flags, stdin, cmd, args) => {
        const target = params[0] || cwd;
        const abs = resolvePath(target);
        const entries = Object.keys(vfs).filter(k => k===abs || k.startsWith(abs+'/'));
        const size = entries.reduce((a,k) => a+(vfs[k].size||4096), 0);
        return `${hasFlag(flags, '-h') ? humanBytes(size) : Math.ceil(size/1024)}\t${target}`;
    },

    'ps': (params, flags, stdin, cmd, args) => {
        const pid = Math.floor(Math.random()*9000)+1000;
        if (hasFlag(flags, '-aux') || (args.includes('aux'))) {
            return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  168936 12288 ?        Ss   00:00   0:01 /sbin/init\n${username}   ${pid}  0.0  0.0   13456  4096 pts/0   Ss   ${new Date().toLocaleTimeString('en-US')}   0:00 bash`;
        }
        return `  PID TTY          TIME CMD\n    1 ?        00:00:01 init\n ${pid} pts/0    00:00:00 bash\n ${pid+1} pts/0    00:00:00 ps`;
    },

    'top': handleTop,
    'htop': handleTop,
    'lsblk': (params, flags, stdin, cmd, args) => { return 'NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0    50G  0 disk\n├─sda1   8:1    0    48G  0 part /\n└─sda2   8:2    0     2G  0 part [SWAP]\nsdb      8:16   0   200G  0 disk\n└─sdb1   8:17   0   200G  0 part /home'; },

    'lscpu': (params, flags, stdin, cmd, args) => { return 'Architecture:             x86_64\nCPU op-mode(s):           32-bit, 64-bit\nCPU(s):                   8\nModel name:               Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz\nCPU max MHz:              5000.0000 MHz\nL3 cache:                 12288 KiB\nNUMA node(s):             1'; },

    'dmesg': (params, flags, stdin, cmd, args) => { return `[    0.000000] Linux version 6.1.0-18-amd64\n[    0.000000] Debian 6.1.69-1\n[    1.234567] Booting Debian GNU/Linux 13 (trixie)\n[    2.345678] systemd[1]: Reached target Multi-User System.`; },

    'vmstat': (params, flags, stdin, cmd, args) => { return 'procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----\n r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa\n 1  0      0 4321000 12288 2097152   0    0     1     2   50  100  2  1 97  0'; },

    'id': (params, flags, stdin, cmd, args) => { return `uid=1000(${username}) gid=1000(${username}) groups=1000(${username}),4(adm),24(cdrom),27(sudo),46(plugdev)`; },

    'whoami': (params, flags, stdin, cmd, args) => { return username; },

    'who': handleWho,
    'w': handleWho,
    'last': (params, flags, stdin, cmd, args) => { return `${username}   pts/0   :0   ${new Date().toLocaleString('en-US')}   still logged in\nwtmp begins ${new Date(Date.now()-30*24*3600*1000).toLocaleDateString('en-US')}`; },

    'groups': (params, flags, stdin, cmd, args) => { return `${username} adm cdrom sudo dip plugdev`; },

    'env': handleEnv,
    'printenv': handleEnv,
    'export': (params, flags, stdin, cmd, args) => {
        if (!params.length) return Object.entries(envVars).map(([k,v])=>`declare -x ${k}="${v}"`).join('\n');
        params.forEach(p => { const eq=p.indexOf('='); if(eq!==-1) envVars[p.slice(0,eq)]=p.slice(eq+1); });
        return null;
    },

    'unset': (params, flags, stdin, cmd, args) => { params.forEach(p=>delete envVars[p]); return null; },

    'set': (params, flags, stdin, cmd, args) => { return Object.entries(envVars).map(([k,v])=>`${k}='${v}'`).join('\n'); },

    'kill': handleKill,
    'killall': handleKill,
    'pkill': handleKill,
    'jobs': (params, flags, stdin, cmd, args) => { return '(no background jobs)'; },

    'bg': (params, flags, stdin, cmd, args) => { return 'bash: bg: no current job'; },

    'fg': (params, flags, stdin, cmd, args) => { return 'bash: fg: no current job'; },

    'nohup': (params, flags, stdin, cmd, args) => { return 'nohup: ignoring input'; },

    'nice': (params, flags, stdin, cmd, args) => { return `(nice: running with priority ${params[0]||'10'})`; },

    'sleep': (params, flags, stdin, cmd, args) => { return `(sleeping for ${params[0]||'1'}s — simulated)`; },

    'true': (params, flags, stdin, cmd, args) => { return null; },

    'false': (params, flags, stdin, cmd, args) => { return 'false: exited with code 1'; },

    'time': async (params, flags, stdin, cmd, args) => { 
    if (!params.length) return 'usage: time COMMAND';
    const r = await run(params[0], params.slice(1), null); 
    return (r ? r+'\n\n' : '') + 'real\t0m0.001s...';
    },

    'watch': async (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'watch: missing command';
        const r = await run(params[0], params.slice(1), null); 
        return `(watch: '${params.join(' ')}' every 2s — displaying once)\n`+(run(params[0], params.slice(1), null)||'');
    },

    'xargs': async (params, flags, stdin, cmd, args) => { const r = await run(params[0], params.slice(1), null); return stdin ? (run(params[0]||'echo', [stdin], null)||'') : '(xargs: empty stdin)'; },

    // ── Network ───────────────────────────────────────────────────
    'ping': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'ping: usage: ping HOST';
        const host = params[0];
        const count = parseInt(args[args.indexOf('-c')+1]) || 4;
        const ip = host==='localhost'?'127.0.0.1':host==='google.com'?'142.250.78.78':`${Math.floor(Math.random()*200+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        const lines = [`PING ${host} (${ip}) 56(84) bytes of data.`];
        for (let i=0;i<Math.min(count,4);i++) lines.push(`64 bytes from ${ip}: icmp_seq=${i+1} ttl=64 time=${(Math.random()*20+1).toFixed(3)} ms`);
        lines.push(`\n--- ${host} ping statistics ---\n${count} packets transmitted, ${count} received, 0% packet loss`);
        return lines.join('\n');
    },

    'traceroute': handleTraceroute,
    'tracepath': handleTraceroute,
    'ifconfig': handleIfconfig,
    'ip': handleIfconfig,
    'netstat': handleNetstat,
    'ss': handleNetstat,
    'nmap': (params, flags, stdin, cmd, args) => {
        return params.length
            ? `Nmap scan report for ${params[0]}\nHost is up (0.0015s).\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n443/tcp open  https\nNmap done: 1 IP (1 host up) in 0.52s`
            : 'nmap: missing host';
    },

    'wget': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'wget: missing URL';
        const file = params[0].split('/').pop() || 'index.html';
        fsTouch(resolvePath(file), `<!-- Downloaded from ${params[0]} -->`);
        return `--${new Date().toISOString()}--  ${params[0]}\nConnecting... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 1024 (1.0K)\nSaving to: '${file}'\n100%[========================>] 1,024  in 0s\n'${file}' saved.`;
    },

    'curl': async (params, flags, stdin, cmd, args) => {
        // Se o usuário não digitar nada
        if (!params.length) return "curl: try 'curl --help' for more information";
        
        // Pega a URL (geralmente o primeiro parâmetro sem o traço de flag)
        let targetUrl = params.find(p => !p.startsWith('-')) || params[0];
        
        // O fetch exige o protocolo, então se o usuário digitar apenas "google.com", adicionamos "http://"
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'http://' + targetUrl;
        }

        const controller = new AbortController();
        // O curl costuma tentar por mais tempo, vamos dar 10 segundos de limite
        const timeoutId = setTimeout(() => controller.abort(), 10000); 
        
        try {
            // Usamos novamente o proxy /raw para driblar o CORS e pegar o texto purinho da internet
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            // O curl real, mesmo quando dá erro 404, costuma devolver o HTML da página de erro do servidor.
            // Então vamos tentar ler o texto de resposta independentemente do response.ok
            const data = await response.text();
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Simula os códigos de erro clássicos do curl real
            if (error.name === 'AbortError') {
                return `curl: (28) Connection timed out after 10000 milliseconds`;
            }
            
            return `curl: (6) Could not resolve host: ${targetUrl.replace('http://', '')}`;
        }
    },

    'ssh': (params, flags, stdin, cmd, args) => { return params.length ? `ssh: connect to host ${params[0]} port 22: Connection refused (simulated)` : 'usage: ssh [user@]host'; },

    'scp': (params, flags, stdin, cmd, args) => { return '(scp: simulated transfer completed)'; },

    'apt': handleApt,
    'apt-get': handleApt,
    'dpkg': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-l')) return 'ii  bash         5.2.15-2+b2  amd64  GNU Bourne Again SHell\nii  coreutils    9.1-1        amd64  GNU core utilities\nii  git          2.39.5       amd64  Fast, scalable, distributed revision control system';
        return `dpkg: ${params[0]||'unknown subcommand'}`;
    },

    'snap': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (sub==='list') return 'Name  Version  Rev  Tracking  Publisher';
        if (sub==='install') return `(snap: installing '${params[1]}' — simulated)`;
        return `snap: ${sub||'missing subcommand'}`;
    },

    // ── Services ──────────────────────────────────────────────────
    'systemctl': (params, flags, stdin, cmd, args) => {
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
    },

    'service': (params, flags, stdin, cmd, args) => {
        const svc=params[0], sub=params[1];
        return svc ? `(service ${svc} ${sub||'status'} — simulated)` : 'usage: service NAME [start|stop|restart|status]';
    },

    'journalctl': (params, flags, stdin, cmd, args) => { return `-- Logs begin at ${new Date(Date.now()-7*24*3600*1000).toLocaleDateString('en-US')} --\n${new Date().toLocaleString('en-US')} ${HOSTNAME} kernel: Linux version 6.1.0-18-amd64\n${new Date().toLocaleString('en-US')} ${HOSTNAME} systemd: Started Debian GNU/Linux.\n${new Date().toLocaleString('en-US')} ${HOSTNAME} sshd: Server listening on port 22.`; },

    'crontab': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-l')) return '# No crontabs for this user\n# m h dom mon dow command';
        if (hasFlag(flags, '-e')) return '(crontab -e: use a real terminal to edit)';
        if (hasFlag(flags, '-r')) return '(crontab removed)';
        return 'usage: crontab [-l] [-e] [-r]';
    },


    'sudo': (params, flags, stdin, cmd, args) => {
        if (!args.length) return 'usage: sudo COMMAND';
        
        // Guarda o comando que o usuário quer rodar como root globalmente
        window.pendingSudo = { cmd: args[0], args: args.slice(1) };
        
        // Retorna apenas a string do prompt. Não usamos 'await run()' aqui!
        return `[sudo] password for ${username}:`;
    },

    'su': (params, flags, stdin, cmd, args) => { return `Password:\n(su: authenticated as ${params||'root'} — simulated)`; },

    'passwd': (params, flags, stdin, cmd, args) => { return `Changing password for ${username}.\nCurrent password:\nNew password:\nRetype new password:\npassword updated successfully.`; },

    'useradd': handleUseradd,
    'adduser': handleUseradd,
    'userdel': handleUserdel,
    'deluser': handleUserdel,
    'groupadd': (params, flags, stdin, cmd, args) => { return params ? `Group '${params}' created.` : 'groupadd: missing name'; },

    // ── Dev tools ─────────────────────────────────────────────────
    'git': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'usage: git [--version] [--help] <command> [<args>]';
        if (sub==='init') return `Initialized empty Git repository in ${cwd}/.git/`;
        if (sub==='clone') return `Cloning into '${(params||'repo').split('/').pop()}'...\nremote: Enumerating objects: 10, done.\nTotal 10 (delta 0), done.`;
        if (sub==='status') return `On branch master\n\nnothing to commit, working tree clean`;
        if (sub==='log') return `commit a1b2c3d4e5f6 (HEAD -> master)\nAuthor: ${username} <${username}@example.com>\nDate:   ${new Date().toLocaleString('en-US')}\n\n    Initial commit`;
        if (sub==='add') return null;
        if (sub==='commit') { 
            const mIdx = args.indexOf('-m');
            const msg = mIdx !== -1 ? args[mIdx+1] : 'update'; 
            return `[master a1b2c3d] ${msg}\n 1 file changed, 1 insertion(+)`; 
        }
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
    },

    'python': handlePython,
    'python3': handlePython,
    'node': handleNode,
    'nodejs': handleNode,
    'npm': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (sub==='install'||sub==='i') return `added ${Math.floor(Math.random()*500+100)} packages in ${(Math.random()*5+1).toFixed(1)}s`;
        if (sub==='start') return `> project@1.0.0 start\n> node index.js\n\nServer running at http://localhost:3000`;
        if (sub==='run') return `> project@1.0.0 ${params}\nexecuting '${params}'...`;
        if (sub==='list'||sub==='ls') return `project@1.0.0 ${cwd}\n├── express@4.18.2\n├── lodash@4.17.21\n└── axios@1.6.0`;
        if (sub==='init') { fsTouch(resolvePath('package.json'),`{\n  "name": "${cwd.split('/').pop()}",\n  "version": "1.0.0",\n  "main": "index.js",\n  "scripts": {}\n}`); return 'package.json created.'; }
        if (sub==='--version'||sub==='-v') return '10.2.4';
        return `npm: '${sub}': unknown command`;
    },
    'open': async (params, flags, stdin, cmd, args) => {
    if (!params.length) return "usage: open [filename.html]";
    
    const abs = resolvePath(params[0]);
    const file = fsGet(abs);
    
    if (!file) return `open: file '${params[0]}' not found`;
    if (file.type === 'dir') return `open: '${params[0]}' is a directory`;

    // Cria um Blob com o conteúdo HTML e abre em uma nova aba
    const blob = new Blob([file.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    return `Opening ${params[0]} in browser...`;
    },

    'yarn': (params, flags, stdin, cmd, args) => {
        const sub=params[0];
        if (!sub||sub==='install') return `yarn install v1.22.21\n[1/4] Resolving packages...\n[2/4] Fetching packages...\n✨ Done in 3.21s.`;
        if (sub==='add') return `success Saved lockfile.\nDone in 1.23s.`;
        return `yarn ${sub}: completed`;
    },

    'gcc': handleGcc,
    'g++': handleGcc,
    'cc': handleGcc,
    'make': (params, flags, stdin, cmd, args) => { return `make: Entering directory '${cwd}'\ngcc -Wall -o program main.c\nmake: Leaving directory '${cwd}'`; },

    'cargo': (params, flags, stdin, cmd, args) => {
        const sub=params[0];
        if (sub==='new') { fsMkdir(resolvePath(params)); return `Created binary \`${params}\` package`; }
        if (sub==='build') return `Compiling project v0.1.0\n    Finished dev [unoptimized] target(s) in 2.34s`;
        if (sub==='run') return `Compiling project v0.1.0\n     Running \`target/debug/project\`\nHello, world!`;
        return `cargo: '${sub}': unrecognized`;
    },

    'which': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: which COMMAND';
        const bin = {bash:'/bin/bash',python3:'/usr/bin/python3',python:'/usr/bin/python3',node:'/usr/bin/node',git:'/usr/bin/git',npm:'/usr/bin/npm',gcc:'/usr/bin/gcc',make:'/usr/bin/make',nano:'/bin/nano',vim:'/usr/bin/vim',ssh:'/usr/bin/ssh',curl:'/usr/bin/curl',wget:'/usr/bin/wget',grep:'/usr/bin/grep',awk:'/usr/bin/awk',sed:'/bin/sed',find:'/usr/bin/find',tar:'/usr/bin/tar',zip:'/usr/bin/zip'};
        return params.map(p => bin[p] || `which: no ${p} in (${envVars.PATH})`).join('\n');
    },

    'whereis': (params, flags, stdin, cmd, args) => { return params.length ? `${params}: /usr/bin/${params} /usr/share/man/man1/${params}.1.gz` : 'usage: whereis COMMAND'; },

    'locate': (params, flags, stdin, cmd, args) => { return params.length ? (Object.keys(vfs).filter(k=>k.includes(params)).join('\n') || `locate: no match found for '${params}'`) : 'locate: missing pattern'; },

    'man': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'What manual page do you want?';
        const pages = {
            ls:'LS(1)\n\nNAME\n  ls - list directory contents\n\nSYNOPSIS\n  ls [OPTION]... [FILE]...\n\nOPTIONS\n  -a  include hidden entries\n  -l  use a long listing format\n  -h  human-readable sizes\n  -r  reverse order',
            cd:'CD(1)\n\nNAME\n  cd - change the working directory\n\nSYNOPSIS\n  cd [DIR]\n\n  cd ~   → home directory\n  cd ..  → parent directory\n  cd -   → previous directory',
            grep:'GREP(1)\n\nNAME\n  grep - print lines matching a pattern\n\nSYNOPSIS\n  grep [OPTION]... PATTERN [FILE]...\n\nOPTIONS\n  -i  ignore case distinctions\n  -v  invert match\n  -c  print count\n  -r  recursive',
            git:'GIT(1)\n\nNAME\n  git - the stupid content tracker\n\nMAIN COMMANDS\n  init, clone, add, commit, push, pull\n  status, log, branch, checkout, merge, diff',
            find:'FIND(1)\n\nNAME\n  find - search for files in a directory hierarchy\n\nEXAMPLES\n  find . -name "*.txt"\n  find /home -type f\n  find . -type d',
            vim:'VIM(1)\n\nNAME\n  vim - Vi IMproved, a programmer\'s text editor\n\nCOMMANDS\n  i      Enter insert mode\n  Esc    Return to normal mode\n  :w     Write (save) the file\n  :q     Quit\n  :wq    Write and quit\n  :q!    Quit without saving\n  dd     Delete line\n  yy     Copy line\n  p      Paste',
            curl:'CURL(1)\n\nNAME\n  curl - transfer a URL\n\nSYNOPSIS\n  curl [options] [URL...]\n\nOPTIONS\n  -O     Save file as its remote name\n  -I     Fetch headers only\n  -d     Send POST data'
        };
        return pages[params] || `No manual entry for ${params}`;
    },

    'nano': handleNano,
    'vim': handleNano,
    'vi': handleNano,
    'nvim': handleNano,
    'emacs': handleNano,
    'gedit': handleNano,
    'code': handleNano,
    // ── Archive ───────────────────────────────────────────────────
    'tar': (params, flags, stdin, cmd, args) => {
        if (!args.length) return 'tar: You must specify one of the \'-Acdtrux\', \'---delete\' or \'---test-label\' options\nExamples: tar -czf file.tar.gz folder/  |  tar -xzf file.tar.gz';
        const create  = flags.some(f=>f.includes('c'));
        const extract = flags.some(f=>f.includes('x'));
        const list    = flags.some(f=>f.includes('t'));
        if (extract) return `(tar: extracting ${params[0]||'archive.tar'} — simulated)`;
        if (list) return `${params[0]||'archive.tar'}:\n./\n./readme.txt\n./folder/\n./folder/file.txt`;
        if (create) { const f=params[0]||'archive.tar.gz'; vfs[resolvePath(f)]={type:'file',content:'(binary)',perms:'-rw-r--r--',size:2048,mdate:nowStr()}; return `(tar: ${f} created)`; }
        return '(tar: simulated operation)';
    },

    'zip': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'zip: missing operand';
        const f = params[0].endsWith('.zip') ? params[0] : params[0]+'.zip';
        vfs[resolvePath(f)] = {type:'file',content:'(binary)',perms:'-rw-r--r--',size:1024,mdate:nowStr()};
        return `  adding: ${params.slice(1).join(', ')} (deflated 60%)\n${f} created.`;
    },

    'unzip': (params, flags, stdin, cmd, args) => { return params.length ? `Archive: ${params[0]}\n  inflating: file.txt\n(simulated)` : 'unzip: missing archive name'; },

    'gzip': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'gzip: missing file operand';
        const abs=resolvePath(params[0]); if(vfs[abs]){vfs[abs+'.gz']={...vfs[abs]};delete vfs[abs];} return null;
    },

    'gunzip': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'gunzip: missing file operand';
        const abs=resolvePath(params[0]); if(vfs[abs]){const nf=abs.replace(/\.gz$/,'');vfs[nf]={...vfs[abs]};delete vfs[abs];} return null;
    },

    'bzip2': handleBzip2,
    'xz': handleBzip2,
    'zstd': handleBzip2,
    // ── Misc utilities ────────────────────────────────────────────
    'history': (params, flags, stdin, cmd, args) => {
        if (!cmdHistory.length) return '(empty history)';
        const n = parseInt(params[0]) || cmdHistory.length;
        return cmdHistory.slice(0,n).map((c,i)=>`  ${String(i+1).padStart(4)}  ${c}`).reverse().join('\n');
    },

    'alias': (params, flags, stdin, cmd, args) => {
        if (!params.length) return Object.entries(aliases).map(([k,v])=>`alias ${k}='${v}'`).join('\n') || '(no aliases)';
        params.forEach(p=>{const eq=p.indexOf('=');if(eq!==-1)aliases[p.slice(0,eq)]=p.slice(eq+1).replace(/^['"]|['"]$/g,'');});
        return null;
    },

    'unalias': (params, flags, stdin, cmd, args) => { params.forEach(p=>delete aliases[p]); return null; },

    'type': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'type: missing operand';
        const builtins=['cd','echo','pwd','export','alias','history','type','source','set','unset'];
        return params.map(p=>builtins.includes(p)?`${p} is a shell builtin`:aliases[p]?`${p} is aliased to '${aliases[p]}'`:`${p} is /usr/bin/${p}`).join('\n');
    },

    'source': handleSource,
    '.': handleSource,
    'seq': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'seq: missing operand';
        const [a,b,c] = params.map(Number);
        const [start,end,step] = c!==undefined?[a,c,b]:b!==undefined?[a,b,1]:[1,a,1];
        const r=[];
        for(let i=start;step>0?i<=end:i>=end;i+=step)r.push(i);
        return r.join('\n');
    },

    'yes': (params, flags, stdin, cmd, args) => { return Array(8).fill(params[0]||'y').join('\n')+'\n(interrupted)'; },

    'bc': (params, flags, stdin, cmd, args) => {
    if (params.length) {
        const expr = params.join(' ');
        if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) return 'bc: invalid expression';
        try { return String(eval(expr)); } catch { return 'bc: invalid expression'; }
    }
    return 'bc 1.07.1 — arithmetic calculator\n(usage: echo "2+2" | bc)';
    },

    'expr': (params, flags, stdin, cmd, args) => {
    const expr = args.join(' ');
    if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) return 'expr: invalid expression';
    try { return String(eval(expr)); }
    catch { return 'expr: invalid expression'; }
    },

    'factor': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'factor: missing operand';
        const n = parseInt(params[0]);
        if (isNaN(n)||n<1) return `factor: '${params[0]}': is not a valid number`;
        const factors=[];let num=n;
        for(let i=2;i*i<=num;i++) while(num%i===0){factors.push(i);num/=i;}
        if(num>1) factors.push(num);
        return `${n}: ${factors.join(' ')}`;
    },

    'strace': handleStrace,
    'ltrace': handleStrace,
    'ldd': (params, flags, stdin, cmd, args) => { return params.length ? `\tlinux-vdso.so.1 (0x00007fff12345678)\n\tlibc.so.6 => /lib/x86_64-linux-gnu/libc.so.6\n\t/lib64/ld-linux-x86-64.so.2` : 'ldd: missing file operand'; },

    'gdb': (params, flags, stdin, cmd, args) => { return `GNU gdb (Debian 13.2-1) 13.2\n(gdb) (interactive mode not supported)`; },

    'valgrind': (params, flags, stdin, cmd, args) => { return `==12345== Memcheck, a memory error detector\n==12345== HEAP SUMMARY: in use at exit: 0 bytes in 0 blocks\n==12345== All heap blocks were freed -- no leaks are possible`; },

    'openssl': (params, flags, stdin, cmd, args) => {
        const sub=params[0];
        if (sub==='version') return 'OpenSSL 3.0.11 19 Sep 2023';
        if (sub==='rand') return Array.from({length:parseInt(params[1])||8},()=>Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join('');
        return `OpenSSL 3.0.11 — usage: openssl [version|rand|enc|genrsa|...]`;
    },

    'ssh-keygen': (params, flags, stdin, cmd, args) => {
        const tIdx = args.indexOf('-t');
        const t = tIdx !== -1 ? args[tIdx+1] : 'rsa';
        const fIdx = args.indexOf('-f');
        const f = fIdx !== -1 ? args[fIdx+1] : `${envVars.HOME}/.ssh/id_${t}`;
        fsTouch(f,'-----BEGIN OPENSSH PRIVATE KEY-----\n(simulated key)\n-----END OPENSSH PRIVATE KEY-----');
        fsTouch(f+'.pub',`${t}-key AAAA...SIMULATED== ${username}@${HOSTNAME}`);
        return `Generating public/private ${t} key pair.\nYour identification has been saved in ${f}.\nYour public key has been saved in ${f}.pub.`;
    },

    'gpg': (params, flags, stdin, cmd, args) => { return `(gpg: operation '${params[0]||''}' — simulated)`; },

    'ascii': (params, flags, stdin, cmd, args) => { return 'ASCII table (32-127):\n'+Array.from({length:96},(_,i)=>`${i+32}: ${String.fromCharCode(i+32)}`).reduce((a,v,i)=>i%8===0?a+'\n'+v:a+'\t'+v,'').trim(); },

    weather: async (params = []) => {
    const city = params.length
        ? params.join(' ')
        : 'Rio de Janeiro';

    try {
        // Get coordinates from city name
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );

        if (!geoResponse.ok) {
            throw new Error(`Geocoding API returned HTTP ${geoResponse.status}`);
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            return `weather: city not found: ${city}`;
        }

        const {
            latitude,
            longitude,
            name,
            country
        } = geoData.results[0];

        // Get current weather
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );

        if (!weatherResponse.ok) {
            throw new Error(`Weather API returned HTTP ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        return `
    Weather for ${name}, ${country}

    Temperature: ${current.temperature_2m}°C
    Humidity: ${current.relative_humidity_2m}%
    Wind Speed: ${current.wind_speed_10m} km/h
        `.trim();

    } catch (error) {
        console.error('Weather command error:', error);
        return `weather: ${error.message}`;
    }
},

    'github': async (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: github [username]\nExample: github torvalds';
        
        const username = params[0];
        try {
            // Consumindo a API REST oficial do GitHub
            const response = await fetch(`https://api.github.com/users/${username}`);
            
            if (response.status === 404) return `github: user '${username}' not found.`;
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json(); // Aqui a resposta é JSON, não texto puro
            
            // Formatando o JSON para exibir bonito no terminal
            return [
                `┌────────────────────────────────────────────────────────┐`,
                `│ GITHUB PROFILE : ${data.login.padEnd(37)} │`,
                `├────────────────────────────────────────────────────────┤`,
                `  Name      : ${data.name || 'Not specified'}`,
                `  Bio       : ${data.bio || 'No bio available'}`,
                `  Company   : ${data.company || 'Not specified'}`,
                `  Location  : ${data.location || 'Not specified'}`,
                `  Followers : ${data.followers} | Following: ${data.following}`,
                `  Repos     : ${data.public_repos} public repositories`,
                `  URL       : ${data.html_url}`,
                `└────────────────────────────────────────────────────────┘`
            ].join('\n');
            
        } catch (error) {
            return `github: connection error. Could not fetch data for '${username}'.`;
        }
    },
    'crypto': async (params, flags, stdin, cmd, args) => {
        const coin = params.length ? params[0].toLowerCase() : 'bitcoin';
        try {
            const res = await fetch(`https://api.coincap.io/v2/assets/${coin}`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            
            const price = parseFloat(data.data.priceUsd).toFixed(2);
            const change = parseFloat(data.data.changePercent24Hr).toFixed(2);
            const symbol = data.data.symbol;
            
            return `📈 Crypto Tracker: ${data.data.name} (${symbol})\nPrice: $${price} USD\n24h Change: ${change > 0 ? '+' : ''}${change}%`;
        } catch (e) {
            return `crypto: could not fetch data for '${coin}'. Try 'bitcoin', 'ethereum', or 'dogecoin'.`;
        }
    },
    'joke': async (params, flags, stdin, cmd, args) => {
        try {
            // Busca apenas piadas da categoria "Programming" e no formato texto puro
            const res = await fetch('https://v2.jokeapi.dev/joke/Programming?format=txt&safe-mode');
            if (!res.ok) throw new Error('API Error');
            const text = await res.text();
            
            return `\n🎭 Programming Joke:\n${text}\n`;
        } catch (e) {
            return `joke: failed to connect to the joke server.`;
        }
    },
    'define': async (params, flags, stdin, cmd, args) => {
        if (!params.length) return "usage: define [word]";
        const word = params[0];
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!res.ok) throw new Error('Word not found');
            const data = await res.json();
            
            const definition = data[0].meanings[0].definitions[0].definition;
            const pos = data[0].meanings[0].partOfSpeech;
            
            return `📖 Definition of '${word}' (${pos}):\n- ${definition}`;
        } catch (e) {
            return `define: no definition found for '${word}'.`;
        }
    },



    'cowsay': handleCowsay,
    'cowthink': handleCowsay,
    '67': (params, flags, stdin, cmd, args) => {
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
    },


    'fortune': (params, flags, stdin, cmd, args) => {
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
    },

    'sl': (params, flags, stdin, cmd, args) => {
 return [
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
    },

    'cmatrix': handleCmatrix,
    'matrix': handleCmatrix,
    'lolcat': (params, flags, stdin, cmd, args) => { return stdin ?? (params.length ? run('cat', params, null) : '(lolcat: empty input)'); },

    'toilet': (params, flags, stdin, cmd, args) => { return `(toilet: "${params.join(' ')||'Linux'}" — simulated)`; },

    'banner': (params, flags, stdin, cmd, args) => { return `###  ${params.join(' ').toUpperCase()}  ###`; },

    'figlet': (params, flags, stdin, cmd, args) => { return `(figlet: "${params.join(' ')||'Linux'}" — simulated)`; },

    'neofetch': handleNeofetch,
    'fastfetch': handleNeofetch,
    'screenfetch': handleNeofetch,
    'clear': handleClear,
    'reset': handleClear,
    'exit': handleExit,
    'logout': handleExit,
    'reboot': (params, flags, stdin, cmd, args) => {
        addOut('Rebooting the system...');
        setTimeout(() => location.reload(), 1500);
        return null;
    },

    'poweroff': handlePoweroff,
    'halt': handlePoweroff,
    'shutdown': handlePoweroff,
    'help': handleHelp,
    '--help': handleHelp,
    // ════════════════════════════════════════════════════════════════
    //  NEW COMMANDOS — SECURITY, NETWORK, SYSTEM, DEV, MISC
    // ════════════════════════════════════════════════════════════════
    // ── DNS / Advanced Network ────────────────────────────────────
    'whois': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: whois DOMAIN';
        const d = params[0];
        return `Domain Name: ${d.toUpperCase()}\nRegistrar: Example Registrar, Inc.\nCreation Date: 2010-01-15\nExpiry Date: 2027-01-15\nName Server: ns1.${d}\nName Server: ns2.${d}\nDNSSEC: unsigned\nStatus: clientTransferProhibited`;
    },

    'dig': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: dig [@server] DOMAIN [TYPE]';
        const domain = params.find(p => !p.startsWith('@')) || 'example.com';
        const type = params[0] || 'A';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `; <<>> DiG 9.18.19 <<>> ${domain}\n;; QUESTION SECTION:\n;${domain}.\t\tIN\t${type}\n\n;; ANSWER SECTION:\n${domain}.\t\t300\tIN\t${type}\t${ip}\n\n;; Query time: 12 msec\n;; SERVER: 8.8.8.8#53`;
    },

    'host': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: host NAME [SERVER]';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `${params[0]} has address ${ip}\n${params[0]} has IPv6 address 2001:db8::1\n${params[0]} mail is handled by 10 mail.${params[0]}`;
    },

    'nslookup': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: nslookup NAME [SERVER]';
        const ip = `${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
        return `Server:\t\t8.8.8.8\nAddress:\t8.8.8.8#53\n\nNon-authoritative answer:\nName:\t${params[0]}\nAddress: ${ip}`;
    },

    'arp': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-a')) return `? (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on eth0\n? (192.168.1.100) at 11:22:33:44:55:66 [ether] on eth0`;
        return `Address               HWtype  HWaddress           Flags Mask            Iface\n192.168.1.1           ether   aa:bb:cc:dd:ee:ff   C                     eth0`;
    },

    'route': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-n')) return `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`;
        return `Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\ndefault         _gateway        0.0.0.0         UG    100    0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0`;
    },

    'mtr': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: mtr HOST';
        return `Start: ${new Date().toLocaleString('en-US')}\nHOST: ${HOSTNAME}                   Loss%   Snt   Last   Avg  Best  Wrst StDev\n  1.|-- 192.168.1.1               0.0%    10    1.2   1.3   1.1   1.8   0.2\n  2.|-- 10.0.0.1                  0.0%    10    5.4   5.6   5.1   6.2   0.3\n  3.|-- ${params}               0.0%    10   12.3  12.5  12.0  13.1  0.3`;
    },

    'iperf3': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: iperf3 -s (server) | iperf3 -c HOST (client)';
        if (hasFlag(flags, '-s')) return `-----------------------------------------------------------\nServer listening on port 5201\n-----------------------------------------------------------\nAccepting connections...`;
        const bw = (Math.random()*900+100).toFixed(1);
        return `Connecting to host ${params}, port 5201\n[  5] local 192.168.1.100 port 54321 connected to ${params} port 5201\n[ ID] Interval           Transfer     Bitrate\n[  5]   0.00-10.00  sec   ${(parseFloat(bw)/80).toFixed(2)} GBytes  ${bw} Mbits/sec  sender\n[  5]   0.00-10.00  sec   ${(parseFloat(bw)/80*0.99).toFixed(2)} GBytes  ${(parseFloat(bw)*0.99).toFixed(1)} Mbits/sec  receiver`;
    },

    'nc': handleNc,
    'netcat': handleNc,
    'ncat': handleNc,
    'telnet': (params, flags, stdin, cmd, args) => { return params.length ? `Trying ${params}...\nConnected to ${params}.\nEscape character is '^]'.\n(telnet: simulated connection)` : 'usage: telnet HOST [PORT]'; },

    'ftp': handleFtp,
    'sftp': handleFtp,
    'proxychains': handleProxychains,
    'proxychains4': handleProxychains,
    // ── Security / Pentest (educational) ─────────────────────────
    'iptables': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (hasFlag(flags, '-L')) return `Chain INPUT (policy ACCEPT)\ntarget     prot opt source               destination\nACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh\nDROP       all  --  anywhere             anywhere\n\nChain FORWARD (policy DROP)\n\nChain OUTPUT (policy ACCEPT)`;
        if (hasFlag(flags, '-A') || hasFlag(flags, '-D') || hasFlag(flags, '-I')) return `(iptables: rule applied — simulated)`;
        if (hasFlag(flags, '-F')) return '(iptables: rules cleared — simulated)';
        return 'usage: iptables [-L] [-A CHAIN] [-D CHAIN] [-F] [-I CHAIN] ...';
    },

    'ufw': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub || sub==='status') return `Status: active\n\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW       Anywhere\n80/tcp                     ALLOW       Anywhere\n443/tcp                    ALLOW       Anywhere`;
        if (sub==='enable')  return 'Firewall is active and enabled on system startup';
        if (sub==='disable') return 'Firewall stopped and disabled on system startup';
        if (sub==='allow')   return `Rule added: allow ${params||'port'}`;
        if (sub==='deny')    return `Rule added: deny ${params||'port'}`;
        if (sub==='delete')  return `Rule deleted`;
        if (sub==='reset')   return 'All rules removed. Firewall disabled.';
        return `ufw: '${sub}': unknown subcommand`;
    },

    'tcpdump': (params, flags, stdin, cmd, args) => {
        if (!params.length && !flags.length) return 'usage: tcpdump [-i INTERFACE] [-n] [FILTER]';
        const iIdx = args.indexOf('-i');
        const iface = iIdx !== -1 ? args[iIdx+1] : 'eth0';
        const lines = Array.from({length:6}, (_,i) => {
            const src = `192.168.1.${Math.floor(Math.random()*254+1)}`;
            const dst = `192.168.1.${Math.floor(Math.random()*254+1)}`;
            const port = [80,443,22,53,8080][Math.floor(Math.random()*5)];
            return `${new Date().toISOString().slice(11,23)} IP ${src}.${Math.floor(Math.random()*60000+1024)} > ${dst}.${port}: Flags [S], seq 0, win 64240, length 0`;
        });
        return `tcpdump: verbose output suppressed\nlistening on ${iface}, link-type EN10MB\n${lines.join('\n')}\n^C\n6 packets captured`;
    },

    'wireshark': handleWireshark,
    'tshark': handleWireshark,
    'hydra': (params, flags, stdin, cmd, args) => { return 'Hydra v9.5 — Dictionary authentication testing tool.\n[INFO] Use ONLY on your own systems or with WRITTEN authorization.\n[INFO] Unauthorized use is illegal.\n[TIP] To practice legally: TryHackMe, HackTheBox, local DVWA.'; },

    'john': (params, flags, stdin, cmd, args) => { return 'John the Ripper 1.9.0-jumbo-1 — Hash analysis tool.\nFunctions: identify hash algorithms, test password policies.\n[INFO] Use ONLY on hashes from your own systems or with WRITTEN authorization.\n[TIP] Practice with: hashcat example hashes, CTFs on TryHackMe/HackTheBox.'; },

    'hashcat': (params, flags, stdin, cmd, args) => { return 'hashcat v6.2.6 — GPU-based hash analysis tool.\nModes: 0=MD5, 1000=NTLM, 1800=sha512crypt, 22000=WPA2, ...\n[INFO] Use ONLY on your own hashes or systems with WRITTEN authorization.\n[TIP] Practice hash identification with: haiti, hash-identifier, hashid.'; },

    'nikto': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: nikto -h TARGET\nExample: nikto -h http://target.com';
        const host = args[args.indexOf('-h')+1] || params;
        return `- Nikto v2.1.6\n---------------------------------------------------------------------------\n+ Target IP:          ${Math.floor(Math.random()*200+10)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.1\n+ Target Hostname:    ${host}\n+ Target Port:        80\n+ Start Time:         ${new Date().toLocaleString('en-US')}\n---------------------------------------------------------------------------\n+ Server: Apache/2.4.54\n+ /admin/: Possible admin area found\n+ /backup/: Possible backup directory\n+ OSVDB-3092: /.htaccess: .htaccess file found\n+ 8783 requests: 0 error(s) and 3 item(s) reported\n[WARNING] Simulated terminal. Real Nikto requires target authorization.`;
    },

    'sqlmap': (params, flags, stdin, cmd, args) => { return 'sqlmap 1.7.10 — Automatic SQL injection detection tool.\n[INFO] Automates SQL injection testing on web applications.\n[INFO] Use ONLY on your own applications or with WRITTEN authorization.\n[TIP] To practice: OWASP Juice Shop (local), DVWA, WebGoat, PortSwigger Labs.'; },

    'msfconsole': handleMsfconsole,
    'metasploit': handleMsfconsole,
    'burpsuite': handleBurpsuite,
    'burp': handleBurpsuite,
    'aircrack-ng': handleAircrackNg,
    'airodump-ng': handleAircrackNg,
    'aireplay-ng': handleAircrackNg,
    // ── Hardware / Low-level System ───────────────────────────────
    'lshw': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-short')) return `H/W path     Device  Class       Description\n============================================================\n                       system      Laptop\n/0                     bus         Motherboard\n/0/0                   memory      8GiB System Memory\n/0/1                   processor   Intel i7-10750H\n/0/2     eth0    network     Intel Ethernet`;
        return `${HOSTNAME}\n    description: Notebook\n    product: Generic Laptop\n    vendor: Generic\n  *-cpu\n       description: CPU\n       product: Intel(R) Core(TM) i7-10750H @ 2.60GHz\n       width: 64 bits\n  *-memory\n       description: System Memory\n       size: 8GiB\n  *-network\n       description: Ethernet interface\n       logical name: eth0`;
    },

    'lspci': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-v')) return `00:00.0 Host bridge: Intel Corporation Device [8086:9b53]\n  Flags: bus master, fast devsel\n  Kernel driver in use: skl_uncore\n\n00:02.0 VGA compatible controller: Intel Corporation CometLake-H GT2 [UHD Graphics]\n  Flags: bus master, fast devsel\n  Kernel driver in use: i915\n\n01:00.0 3D controller: NVIDIA Corporation TU117M [GeForce GTX 1650]\n  Flags: bus master, fast devsel\n  Kernel driver in use: nvidia`;
        return `00:00.0 Host bridge: Intel Corporation Device\n00:02.0 VGA compatible controller: Intel Corporation UHD Graphics\n01:00.0 3D controller: NVIDIA Corporation GeForce GTX 1650\n00:14.0 USB controller: Intel Corporation Device\n00:1f.3 Audio device: Intel Corporation Device`;
    },

    'lsusb': (params, flags, stdin, cmd, args) => { return `Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub\nBus 001 Device 004: ID 8087:0026 Intel Corp. AX201 Bluetooth\nBus 001 Device 003: ID 04f2:b68b Chicony Electronics Co., Ltd Webcam\nBus 001 Device 002: ID 046d:c52b Logitech, Inc. Unifying Receiver\nBus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`; },

    'dmidecode': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-t')) {
            const type = args[args.indexOf('-t')+1] || '1';
            if (type==='1' || type==='system') return `Handle 0x0001, DMI type 1, 27 bytes\nSystem Information\n\tManufacturer: Generic\n\tProduct Name: Laptop\n\tVersion: 1.0\n\tSerial Number: SN123456789\n\tSKU Number: Not Specified\n\tFamily: Notebook`;
            if (type==='4' || type==='processor') return `Handle 0x0004, DMI type 4, 48 bytes\nProcessor Information\n\tSocket Designation: U3E1\n\tType: Central Processor\n\tFamily: Core i7\n\tManufacturer: Intel(R) Corporation\n\tVersion: Intel(R) Core(TM) i7-10750H CPU @ 2.60GHz\n\tMax Speed: 5000 MHz`;
        }
        return `# dmidecode 3.4\n# SMBIOS present.\nHandle 0x0000, DMI type 0, 26 bytes\nBIOS Information\n\tVendor: American Megatrends Inc.\n\tVersion: F.25\n\tRelease Date: 01/15/2023`;
    },

    'sensors': (params, flags, stdin, cmd, args) => { return `coretemp-isa-0000\nAdapter: ISA adapter\nPackage id 0:  +52.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 0:        +51.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 1:        +50.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 2:        +52.0°C  (high = +100.0°C, crit = +100.0°C)\nCore 3:        +49.0°C  (high = +100.0°C, crit = +100.0°C)\n\nnvme-pci-0100\nAdapter: PCI adapter\nComposite:    +38.9°C  (low  = -273.1°C, high = +84.8°C)`; },

    'acpi': (params, flags, stdin, cmd, args) => { return `Battery 0: Discharging, ${Math.floor(Math.random()*80+15)}%, ${Math.floor(Math.random()*3+1)}:${String(Math.floor(Math.random()*60)).padStart(2,'0')} remaining\nBattery 0: design capacity 4630 mAh, last full capacity 4100 mAh = 88%\nAdapter 0: on-line`; },

    'hdparm': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: hdparm [options] DEVICE\nExample: hdparm -I /dev/sda';
        const dev = params[0];
        if (hasFlag(flags, '-I')) return `/dev/sda:\n\n ATA device, with non-removable media\n\tModel Number:       Samsung SSD 870 EVO 500GB\n\tSerial Number:      S59YNX0R123456\n\tFirmware Revision:  SVT01B6Q\n\tTransport: Serial, ATA8-AST, SATA 1.0a, SATA II Extensions, SATA Rev 2.5, SATA Rev 3.0\n\tCapabilities:\n\t\tLBA, IORDY`;
        return `(hdparm: operation on ${dev} — simulated)`;
    },

    'smartctl': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: smartctl -a DEVICE\nExample: smartctl -a /dev/sda';
        return `smartctl 7.3 2022-02-28 r5338\n\n=== START OF INFORMATION SECTION ===\nDevice Model:     Samsung SSD 870 EVO 500GB\nSerial Number:    S59YNX0R123456\nFirmware Version: SVT01B6Q\nUser Capacity:    500,107,862,016 bytes [500 GB]\nSector Size:      512 bytes logical/physical\nDevice is:        In smartctl database\n\n=== START OF READ SMART DATA SECTION ===\nSMART overall-health self-assessment test result: PASSED\n\nID# ATTRIBUTE_NAME          FLAG     VALUE WORST THRESH TYPE      RAW_VALUE\n  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  0\n  9 Power_On_Hours           0x0032   097   097   000    Old_age   3241\n177 Wear_Leveling_Count      0x0013   097   097   000    Pre-fail  39`;
    },

    'iostat': (params, flags, stdin, cmd, args) => {
        const h = hasFlag(flags, '-h');
        return `Linux 6.1.0-18-amd64 (${HOSTNAME})\t${new Date().toLocaleDateString('en-US')}\n\navg-cpu:  %user   %nice %system %iowait  %steal   %idle\n           2.30    0.00    0.70    0.10    0.00   96.90\n\nDevice\t\ttps\tkB_read/s\tkB_wrtn/s\tkB_read\tkB_wrtn\nsda\t\t${(Math.random()*10).toFixed(2)}\t\t${(Math.random()*1000).toFixed(2)}\t\t${(Math.random()*500).toFixed(2)}\t${Math.floor(Math.random()*9999999)}\t${Math.floor(Math.random()*9999999)}`;
    },

    'sar': (params, flags, stdin, cmd, args) => { return `Linux 6.1.0-18-amd64 (${HOSTNAME})\t${new Date().toLocaleDateString('en-US')}\n\n${new Date().toLocaleTimeString('en-US')}     CPU     %user     %nice   %system   %iowait    %steal     %idle\n${new Date().toLocaleTimeString('en-US')}     all      2.30      0.00      0.70      0.10      0.00     96.90`; },

    'pidstat': (params, flags, stdin, cmd, args) => { return `Linux 6.1.0-18-amd64 (${HOSTNAME})\n\n${new Date().toLocaleTimeString('en-US')}   UID       PID    %usr %system  %guest   %wait    %CPU   CPU  Command\n${new Date().toLocaleTimeString('en-US')}  1000      ${Math.floor(Math.random()*9000+1000)}    0.50    0.10    0.00    0.00    0.60     0  bash\n${new Date().toLocaleTimeString('en-US')}     0         1    0.00    0.01    0.00    0.00    0.01     0  systemd`; },

    'sysctl': (params, flags, stdin, cmd, args) => {
        if (!params.length && !flags.length) return 'usage: sysctl [-a] [VARIABLE[=VALUE]]';
        if (hasFlag(flags, '-a')) return `kernel.hostname = ${HOSTNAME}\nkernel.ostype = Linux\nkernel.osrelease = 6.1.0-18-amd64\nnet.ipv4.ip_forward = 0\nnet.ipv4.tcp_syncookies = 1\nvm.swappiness = 60\nfs.file-max = 9223372036854775807`;
        if (params && params.includes('=')) { const [k,v]=params.split('='); return `${k} = ${v}`; }
        if (params) return `${params[0]} = 1`;
        return '(sysctl: parameter not specified)';
    },

    'lsmod': (params, flags, stdin, cmd, args) => { return `Module                  Size  Used by\nnvidia_drm             77824  4\nnvidia_modeset       1249280  6 nvidia_drm\nnvidia              56209408  116 nvidia_modeset\ni915                 3538944  8\ndrm_kms_helper        258048  2 i915,nvidia_drm\ndrm                   622592  12\nbluetooth            1007616  30\nsnd_hda_intel          57344  4`; },

    'modprobe': (params, flags, stdin, cmd, args) => { return params.length ? `(modprobe: module '${params}' ${hasFlag(flags, '-r')?'removed':'loaded'} — simulated)` : 'usage: modprobe [-r] MODULE'; },

    'insmod': (params, flags, stdin, cmd, args) => { return params.length ? `(insmod: module '${params}' inserted — simulated)` : 'usage: insmod MODULE.ko'; },

    'rmmod': (params, flags, stdin, cmd, args) => { return params.length ? `(rmmod: module '${params}' removed — simulated)` : 'usage: rmmod MODULE'; },

    'update-grub': handleUpdateGrub,
    'grub-update': handleUpdateGrub,
    // ── Disco / Filesystem ────────────────────────────────────────
    'lsof': (params, flags, stdin, cmd, args) => {
        const pid = Math.floor(Math.random()*9000)+1000;
        if (hasFlag(flags, '-i')) return `COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nsshd     1234     root    3u  IPv4  12345      0t0  TCP *:ssh (LISTEN)\nnginx    5678     root    6u  IPv6  23456      0t0  TCP *:http (LISTEN)`;
        return `COMMAND     PID     USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME\nbash       ${pid}  ${username}  cwd    DIR    8,1     4096  ${Math.floor(Math.random()*999999)} ${cwd}\nbash       ${pid}  ${username}  txt    REG    8,1  1183448  ${Math.floor(Math.random()*999999)} /bin/bash\nbash       ${pid}  ${username}    0u   CHR  136,0      0t0       3 /dev/pts/0`;
    },

    'fuser': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: fuser [-k] [-n NAMESPACE] FILE|PORT';
        return `${params}:     ${Math.floor(Math.random()*9000+1000)}`;
    },

    'rsync': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: rsync [options] SOURCE DESTINATION\nExample: rsync -avz /source/ user@host:/dest/';
        return `sending incremental file list\n./\nfile1.txt\nfile2.txt\n\nsent 1,234 bytes  received 57 bytes  861.33 bytes/sec\ntotal size is 1,024  speedup is 0.79`;
    },

    'mount': (params, flags, stdin, cmd, args) => {
        if (!params.length) return `sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)\nproc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\n/dev/sda1 on / type ext4 (rw,relatime)\n/dev/sda2 on /home type ext4 (rw,relatime)\ntmpfs on /tmp type tmpfs (rw,nosuid,nodev)`;
        return `(mount: ${params.join(' ')} — simulated)`;
    },

    'umount': (params, flags, stdin, cmd, args) => { return params.length ? `(umount: ${params} unmounted — simulated)` : 'usage: umount MOUNT_POINT'; },

    'fdisk': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-l')) return `Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors\nDisk model: SAMSUNG SSD\nUnits: sectors of 1 * 512 = 512 bytes\n\nDevice     Start      End  Sectors Size Type\n/dev/sda1   2048 98566143 98564096  47G Linux filesystem\n/dev/sda2 98566144 104857566  6291423   3G Linux swap`;
        return `(fdisk: use 'fdisk -l' to list partitions)`;
    },

    'mkfs': handleMkfs,
    'mkfs.ext4': handleMkfs,
    'mkfs.xfs': handleMkfs,
    'fsck': handleFsck,
    'e2fsck': handleFsck,
    'blkid': (params, flags, stdin, cmd, args) => { return `/dev/sda1: UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="12345678-01"\n/dev/sda2: UUID="swap-1234-5678-abcd-ef12" TYPE="swap" PARTUUID="12345678-02"`; },

    'shred': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: shred [-n PASSES] [-z] [-u] FILE';
        const nIdx = args.indexOf('-n');
        const passes = nIdx !== -1 ? parseInt(args[nIdx+1]) || 3 : 3;
        return `shred: ${params}: pass 1/${passes} (random)...\nshred: ${params}: pass 2/${passes} (random)...\nshred: ${params}: pass ${passes}/${passes} (random)...${hasFlag(flags, '-u')?('\nshred: '+params+': removing'):''}`;
    },

    'truncate': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: truncate -s SIZE FILE';
        const sIdx = args.indexOf('-s');
        const size = sIdx !== -1 ? args[sIdx+1] : '0';
        if (!params) return 'truncate: missing file operand';
        const abs = resolvePath(params);
        if (!vfs[abs]) fsTouch(abs,'');
        vfs[abs].content = '';
        vfs[abs].size = parseInt(size) || 0;
        return null;
    },

    'fallocate': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: fallocate -l SIZE FILE';
        const lIdx = args.indexOf('-l');
        const size = lIdx !== -1 ? args[lIdx+1] : '1M';
        if (!params) return 'fallocate: missing file operand';
        fsTouch(resolvePath(params),'');
        return null;
    },

    'dd': (params, flags, stdin, cmd, args) => {
        if (!args.length) return 'usage: dd if=INPUT of=OUTPUT [bs=SIZE] [count=N]\nExample: dd if=/dev/zero of=file.bin bs=1M count=10';
        const inf  = args.find(a=>a.startsWith('if='))?.slice(3) || '/dev/stdin';
        const outf = args.find(a=>a.startsWith('of='))?.slice(3) || '/dev/stdout';
        const bs   = args.find(a=>a.startsWith('bs='))?.slice(3) || '512';
        const cnt  = args.find(a=>a.startsWith('count='))?.slice(6) || '1';
        const bytes = (parseInt(bs.replace(/[KMG]/,'')) * (bs.includes('G')?1073741824:bs.includes('M')?1048576:bs.includes('K')?1024:1)) * parseInt(cnt);
        fsTouch(resolvePath(outf), Array(Math.min(parseInt(cnt),10)).fill('\0').join(''));
        return `${cnt}+0 records in\n${cnt}+0 records out\n${bytes} bytes (${humanBytes(bytes)}) copied, ${(Math.random()*2+0.1).toFixed(3)} s, ${humanBytes(bytes/1.5)}/s`;
    },

    // ── Advanced Text ─────────────────────────────────────────────
    'shuf': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'shuf: missing file operand';
        const lines = src.split('\n');
        for (let i=lines.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lines[i],lines[j]]=[lines[j],lines[i]];}
        const n = parseInt(args[args.indexOf('-n')+1]);
        return (n ? lines.slice(0,n) : lines).join('\n');
    },

    'fold': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        const width = parseInt(args[args.indexOf('-w')+1]) || 80;
        return src.split('\n').map(l => {
            const chunks = [];
            for (let i=0;i<l.length;i+=width) chunks.push(l.slice(i,i+width));
            return chunks.join('\n') || '';
        }).join('\n');
    },

    'expand': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        const tabs = parseInt(args[args.indexOf('-t')+1]) || 8;
        return src.replace(/\t/g, ' '.repeat(tabs));
    },

    'unexpand': (params, flags, stdin, cmd, args) => {
        const src = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? '') : (stdin ?? '');
        return src.replace(/ {8}/g, '\t');
    },

    'paste': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: paste FILE1 FILE2';
        const n1 = fsGet(resolvePath(params[0])), n2 = fsGet(resolvePath(params[1]));
        if (!n1) return `paste: ${params[0]}: No such file or directory`;
        if (!n2) return `paste: ${params[1]}: No such file or directory`;
        const l1=(n1.content||'').split('\n'), l2=(n2.content||'').split('\n');
        return l1.map((l,i)=>`${l}\t${l2[i]||''}`).join('\n');
    },

    'join': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: join FILE1 FILE2';
        return '(join: merging files by a common field — simulated)';
    },

    'comm': (params, flags, stdin, cmd, args) => {
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
    },

    'od': (params, flags, stdin, cmd, args) => {
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
    },

    'hexdump': handleHexdump,
    'hd': handleHexdump,
    'strings': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: strings FILE';
        const n = fsGet(resolvePath(params[0]));
        if (!n) return `strings: ${params[0]}: No such file or directory`;
        return (n.content||'').split('\n').filter(l=>l.trim().length>=4).join('\n') || '(no printable strings)';
    },

    'iconv': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: iconv -f FROM -t TO [FILE]\nExample: iconv -f UTF-8 -t ISO-8859-1 file.txt';
        const fIdx = args.indexOf('-f');
        const from = fIdx !== -1 ? args[fIdx+1] : 'UTF-8';
        const tIdx = args.indexOf('-t');
        const to = tIdx !== -1 ? args[tIdx+1] : 'UTF-8';
        const src  = params[0] ? (fsGet(resolvePath(params[0]))?.content ?? null) : stdin;
        if (src === null || src === undefined) return 'iconv: missing file operand';
        return `(iconv: converting from ${from} to ${to} — simulated)\n${src}`;
    },

    'look': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: look PREFIX [FILE]';
        const words = ['algorithm','analysis','archive','archives','banco','bash','binary','compiler','command','data','debug','distribution','encoding','filesystem','firewall','grep','hardware','hostname','interface','kernel','linux','memory','network','output','process','protocol','redirection','script','server','system','socket','terminal','thread','user','variable'];
        return words.filter(w=>w.startsWith(params[0].toLowerCase())).join('\n') || '(no match found)';
    },

    'pip': handlePip,
    'pip3': handlePip,
    'virtualenv': handleVirtualenv,
    'venv': handleVirtualenv,
    'php': (params, flags, stdin, cmd, args) => {
        if (!params.length) return `PHP 8.2.10 (cli) (built: Sep  1 2023)\nCopyright (c) The PHP Group\n> (interactive mode not supported)`;
        const n = fsGet(resolvePath(params[0]));
        return n ? `(executing ${params[0]} with PHP — simulated)` : `php: can't open file '${params[0]}': No such file or directory`;
    },

    'ruby': (params, flags, stdin, cmd, args) => { return params.length ? `(executando ${params[0]} com Ruby — simulado)` : `ruby 3.2.0 (2022-12-25 revision a528908271) [x86_64-linux]\nirb(main):001> (interactive mode not supported)`; },

    'perl': (params, flags, stdin, cmd, args) => { return params.length ? `(executando ${params[0]} com Perl — simulado)` : 'perl v5.36.0 — (interactive mode not supported)'; },

    'lua': (params, flags, stdin, cmd, args) => { return params.length ? `(executando ${params[0]} com Lua — simulado)` : `Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio\n> (interactive mode not supported)`; },

    'go': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'go: no subcommand specified. Try: build, run, test, get, mod, fmt';
        if (sub==='run') return params[1] ? `(go run ${params[1]} — simulated)` : 'go run: missing file operand';
        if (sub==='build') return `(go build — compiled successfully — simulated)`;
        if (sub==='test') return `ok  	package	0.123s`;
        if (sub==='fmt') return null;
        if (sub==='version') return 'go version go1.21.4 linux/amd64';
        if (sub==='mod') { if(params[1]==='init') { fsTouch(resolvePath('go.mod'),`module ${params[2]||'my-module'}\n\ngo 1.21`); return null; } return '(go mod — simulated)'; }
        return `go: '${sub}': unknown subcommand`;
    },

    'docker': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'usage: docker [command]\nCommands: run, ps, images, pull, build, stop, rm, rmi';

        if (sub === 'images') {
            if (dockerImages.length === 0) return `REPOSITORY   TAG       IMAGE ID       CREATED        SIZE`;
            let res = `REPOSITORY   TAG       IMAGE ID       CREATED        SIZE\n`;
            res += dockerImages.map(img => `${img.repo.padEnd(12)} ${img.tag.padEnd(9)} ${img.id}   2 days ago     ${img.size}`).join('\n');
            return res;
        }

        if (sub === 'pull') {
            const imgName = params[1] || 'ubuntu';
            const exists = dockerImages.find(i => i.repo === imgName);
            if (!exists) {
                const newId = Math.floor(Math.random()*0xffffff).toString(16).padStart(12, '0');
                dockerImages.push({ repo: imgName, tag: 'latest', id: newId, size: Math.floor(Math.random()*500+50)+'MB' });
                if (typeof saveDocker === 'function') saveDocker();
            }
            return `Pulling from library/${imgName}\nStatus: Downloaded newer image for ${imgName}:latest`;
        }

        if (sub === 'run') {
            const imgName = params[1];
            if (!imgName) return 'docker run: missing image name';
            
            // Auto-pull se não tiver a imagem
            let img = dockerImages.find(i => i.repo === imgName);
            let pullMsg = '';
            if (!img) {
                pullMsg = `Unable to find image '${imgName}:latest' locally\nlatest: Pulling from library/${imgName}\nDigest: sha256:${Math.floor(Math.random()*0xffffff).toString(16)}\nStatus: Downloaded newer image for ${imgName}:latest\n\n`;
                const newId = Math.floor(Math.random()*0xffffff).toString(16).padStart(12, '0');
                img = { repo: imgName, tag: 'latest', id: newId, size: Math.floor(Math.random()*500+50)+'MB' };
                dockerImages.push(img);
            }
            
            const isDetached = hasFlag(flags, '-d');
            const cntId = Math.floor(Math.random()*0xffffff).toString(16).padStart(12, '0');
            const name = `sim_container_${Math.floor(Math.random()*1000)}`;
            
            dockerContainers.push({
                id: cntId.substring(0,12),
                image: imgName,
                command: '"/docker-entrypoint…"',
                status: 'Up 1 second',
                ports: '80/tcp',
                name: name,
                running: true
            });
            if (typeof saveDocker === 'function') saveDocker();
            
            if (isDetached) {
                return pullMsg + cntId;
            } else {
                return pullMsg + `(Simulated attached container. Press Ctrl+C to exit...)\nContainer ${name} is running in background.`;
            }
        }

        if (sub === 'ps') {
            const showAll = hasFlag(flags, '-a');
            const list = showAll ? dockerContainers : dockerContainers.filter(c => c.running);
            let res = `CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS     NAMES\n`;
            res += list.map(c => `${c.id.padEnd(14)} ${c.image.padEnd(9)} ${c.command.padEnd(24)} 1 min ago       ${c.status.padEnd(14)} ${c.ports.padEnd(9)} ${c.name}`).join('\n');
            return res;
        }

        if (sub === 'stop') {
            const idOrName = params[1];
            if (!idOrName) return 'docker stop: missing container ID or name';
            const cnt = dockerContainers.find(c => c.id.startsWith(idOrName) || c.name === idOrName);
            if (!cnt) return `Error response from daemon: No such container: ${idOrName}`;
            cnt.running = false;
            cnt.status = 'Exited (0) 1 second ago';
            if (typeof saveDocker === 'function') saveDocker();
            return idOrName;
        }

        if (sub === 'rm') {
            const idOrName = params[1];
            if (!idOrName) return 'docker rm: missing container ID or name';
            const idx = dockerContainers.findIndex(c => c.id.startsWith(idOrName) || c.name === idOrName);
            if (idx === -1) return `Error: No such container: ${idOrName}`;
            if (dockerContainers[idx].running) return `Error response from daemon: You cannot remove a running container. Stop it first.`;
            dockerContainers.splice(idx, 1);
            if (typeof saveDocker === 'function') saveDocker();
            return idOrName;
        }

        if (sub === 'rmi') {
            const imgName = params[1];
            if (!imgName) return 'docker rmi: missing image';
            const idx = dockerImages.findIndex(i => i.repo === imgName || i.id.startsWith(imgName));
            if (idx === -1) return `Error: No such image: ${imgName}`;
            
            const inUse = dockerContainers.some(c => c.image === dockerImages[idx].repo);
            if (inUse) return `Error response from daemon: conflict: unable to remove repository reference "${imgName}" - container is using its referenced image`;
            
            const removedId = dockerImages[idx].id;
            dockerImages.splice(idx, 1);
            if (typeof saveDocker === 'function') saveDocker();
            return `Untagged: ${imgName}:latest\nDeleted: sha256:${removedId}...`;
        }

        if (sub === '--version') return 'Docker version 24.0.6 (Simulated)';
        
        return `docker: '${sub}': subcommand not implemented in simulation`;
    },

    'docker-compose': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'usage: docker-compose [up|down|build|ps|logs|exec]';
        if (sub==='up') return `Creating network "app_default" with the default driver\nCreating app_db_1  ... done\nCreating app_web_1 ... done`;
        if (sub==='down') return `Stopping app_web_1 ... done\nStopping app_db_1  ... done\nRemoving app_web_1 ... done\nRemoving app_db_1  ... done`;
        if (sub==='ps') return `Name        Command        State   Ports\n--------------------------------------------------\napp_web_1   python app.py   Up      0.0.0.0:5000->5000/tcp\napp_db_1    docker-entrypoint  Up      5432/tcp`;
        if (sub==='build') return `Building web...\nStep 1/6 : FROM python:3.11\nSuccessfully built a1b2c3d4`;
        if (sub==='logs') return `web_1  | * Running on http://0.0.0.0:5000\ndb_1   | PostgreSQL init process complete`;
        return `docker-compose: '${sub}': unknown subcommand`;
    },

    'kubectl': (params, flags, stdin, cmd, args) => {
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
    },

    'terraform': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'usage: terraform [init|plan|apply|destroy|show|output]';
        if (sub==='init') return `Initializing the backend...\nInitializing provider plugins...\n- Finding hashicorp/aws versions matching "~> 5.0"...\n\nTerraform has been successfully initialized!`;
        if (sub==='plan') return `Terraform used the selected providers to generate the following execution plan:\n\nPlan: 3 to add, 0 to change, 0 to destroy.`;
        if (sub==='apply') return `Apply complete! Resources: 3 added, 0 changed, 0 destroyed.`;
        if (sub==='destroy') return `Destroy complete! Resources: 3 destroyed.`;
        return `terraform: '${sub}': unknown subcommand`;
    },

    'ansible': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return 'usage: ansible [-m MODULE] [-a ARGS] HOST(S)\nOr: ansible-playbook PLAYBOOK.yml';
        return `${params[0]} | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}`;
    },

    'cmake': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub || sub==='.') return `-- The CXX compiler identification is GNU 12.3.0\n-- Detecting CXX compiler ABI info\n-- Check for working CXX compiler: /usr/bin/g++\n-- Configuring done (0.3s)\n-- Generating done (0.1s)\n-- Build files have been written to: ${cwd}/build`;
        if (sub==='--build') return `[ 25%] Building CXX object CMakeFiles/project.dir/main.cpp.o\n[ 50%] Building CXX object CMakeFiles/project.dir/utils.cpp.o\n[100%] Linking CXX executable project\n[100%] Built target project`;
        return `(cmake: ${params.join(' ')} — simulated)`;
    },

    // ── Shell / Multiplexers ──────────────────────────────────────
    'screen': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return `[detached from 12345.pts-0.${HOSTNAME}]\n(screen: simulated session — use Ctrl+A D to detach, Ctrl+A K to kill)`;
        if (sub==='-ls') return `There is a screen on:\n\t12345.pts-0.${HOSTNAME}\t(Attached)\n1 Socket in /run/screen/S-${username}.`;
        if (sub==='-r') return `[screen: reconnecting to 12345.pts-0.${HOSTNAME}]`;
        return `(screen: ${params.join(' ')} — simulated)`;
    },

    'tmux': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (!sub) return `(tmux: new session created — simulated)\nShortcuts: Ctrl+B D (detach), Ctrl+B % (vertical split), Ctrl+B " (horizontal split)`;
        if (sub==='ls') return `0: 2 windows (created ${new Date().toLocaleString('en-US')}) [220x50]`;
        if (sub==='new' || sub==='new-session') return `(tmux: new session '${args[args.indexOf('-s')+1]||'0'}' created)`;
        if (sub==='attach' || sub==='-a') return `(tmux: attached to session)`;
        if (sub==='kill-session') return `(tmux: session ended)`;
        return `(tmux: ${params.join(' ')} — simulated)`;
    },

    'script': (params, flags, stdin, cmd, args) => {
        const file = params || 'typescript';
        fsTouch(resolvePath(file), `Script started on ${new Date().toLocaleString('en-US')}`);
        return `Script started, file is '${file}'\n(script: use 'exit' to stop recording — simulated)`;
    },

    // ── Users and Permissions ─────────────────────────────────────
    'chsh': (params, flags, stdin, cmd, args) => { return params.length ? `(chsh: shell changed to '${params}' — simulated)` : `Changing shell for ${username}.\nPassword:`; },

    'chfn': (params, flags, stdin, cmd, args) => { return `Changing user information for ${username}.\nFull Name []: Information updated (simulated).`; },

    'finger': (params, flags, stdin, cmd, args) => {
        return params.length
            ? `Login: ${params}\t\t\t\tName: ${params}\nDirectory: /home/${params}\t\tShell: /bin/bash\nOn since ${new Date().toLocaleString('en-US')} on pts/0 from :0\nNo mail.\nNo plan.`
            : `Login     Name       Tty      Idle  Login Time\n${username.padEnd(9)} ${username.padEnd(10)} pts/0         ${new Date().toLocaleString('en-US')}`;
    },

    'write': (params, flags, stdin, cmd, args) => { return params.length ? `(write: sending message to ${params} — simulated)` : 'usage: write USER'; },

    'wall': (params, flags, stdin, cmd, args) => { return params.length ? `Broadcast message from ${username}@${HOSTNAME}:\n${params.join(' ')}` : 'usage: wall MESSAGE'; },

    'mesg': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'is y';
        return `(mesg: messages ${params==='y'?'allowed':'is n'})`;
    },

    'chage': (params, flags, stdin, cmd, args) => {
        if (hasFlag(flags, '-l')) return `Last password change\t\t\t: ${new Date().toLocaleDateString('en-US')}\nPassword expires\t\t\t\t\t: never\nPassword inactive\t\t\t\t\t: never\nAccount expires\t\t\t\t\t: never`;
        return '(chage: password aging information changed — simulated)';
    },

    'visudo': (params, flags, stdin, cmd, args) => { return '(visudo: edit /etc/sudoers with care on a real system)\n# %sudo   ALL=(ALL:ALL) ALL'; },

    'update-alternatives': (params, flags, stdin, cmd, args) => {
        const sub = params[0];
        if (sub==='--list') return `/usr/bin/python3.11\n/usr/bin/python3.10\n/usr/bin/python2.7`;
        if (sub==='--config') return `There are 2 choices for the alternative ${params[1]||'editor'}:\n\n  Selection    Path              Priority   Status\n------------------------------------------------------------\n* 0            /bin/nano          40        auto mode\n  1            /usr/bin/vim.basic  30        manual mode\n\nPress <enter> to keep the current choice[*]`;
        return `(update-alternatives: ${params.join(' ')} — simulated)`;
    },

    'dpkg-reconfigure': (params, flags, stdin, cmd, args) => { return params.length ? `(dpkg-reconfigure: reconfiguring '${params}' — simulated)` : 'usage: dpkg-reconfigure PACKAGE'; },

    'addgroup': handleAddgroup,
    'groupmod': handleAddgroup,
    'delgroup': (params, flags, stdin, cmd, args) => { return params.length ? `Removing group '${params}'... (simulated)` : 'delgroup: missing name'; },

    // ── Environment / Utilities ───────────────────────────────────
    'notify-send': (params, flags, stdin, cmd, args) => { return params.length ? `(notify-send: notification sent: "${params.join(' ')}")` : 'usage: notify-send SUMMARY [BODY]'; },

    'xclip': handleXclip,
    'xsel': handleXclip,
    'xdg-open': (params, flags, stdin, cmd, args) => { return params.length ? `(xdg-open: opening '${params[0]}' with default application — simulated)` : 'usage: xdg-open FILE|URL'; },

    'at': (params, flags, stdin, cmd, args) => { return `warning: commands will be executed using /bin/sh\njob 1 at ${new Date().toLocaleString('en-US')}`; },

    'batch': (params, flags, stdin, cmd, args) => { return '(batch: executing when system load permits — simulated)'; },

    'cron': (params, flags, stdin, cmd, args) => { return '(cron: use crontab -e to schedule tasks)'; },

    'ab': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: ab -n REQUESTS -c CONCURRENCY URL\nExample: ab -n 1000 -c 10 http://localhost/';
        const n = parseInt(args[args.indexOf('-n')+1]) || 100;
        const c = parseInt(args[args.indexOf('-c')+1]) || 1;
        const url = params[0] || 'http://localhost/';
        const rps = Math.floor(Math.random()*2000+500);
        return `This is ApacheBench, Version 2.3\nCopyright 1996 Adam Twiss\n\nBenchmarking ${url}\n\nServer Software:        nginx\nServer Hostname:        localhost\nServer Port:            80\n\nDocument Path:          /\nDocument Length:        612 bytes\n\nConcurrency Level:      ${c}\nTime taken for tests:   ${(n/rps).toFixed(3)} seconds\nComplete requests:      ${n}\nFailed requests:        0\nRequests per second:    ${rps}.00 [#/sec] (mean)\nTime per request:       ${(1000/rps).toFixed(3)} [ms] (mean)`;
    },

    'lynx': handleLynx,
    'w3m': handleLynx,
    'links': handleLynx,
    'convert': (params, flags, stdin, cmd, args) => {
 // ImageMagick
        return params.length >= 2 ? `(convert: converting '${params[0]}' → '${params[1]}' — simulated)` : 'usage: convert INPUT OUTPUT';
    },

    'ffmpeg': handleFfmpeg,
    'ffprobe': handleFfmpeg,
    'units': (params, flags, stdin, cmd, args) => {
        if (params.length < 2) return 'usage: units QUANTITY UNIT\nExample: units "100 km" mi';
        return `        * ${(Math.random()*100).toFixed(6)}\n        / ${(Math.random()*100).toFixed(6)}`;
    },

    'dc': (params, flags, stdin, cmd, args) => { return '(dc: reverse-postfix calculator — interactive mode not supported)'; },

    'numfmt': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: numfmt [--to=UNIT] NUMBER';
        const to = args.find(a=>a.startsWith('--to='))?.split('=')[1];
        const n = parseFloat(params[0]) || 0;
        if (to === 'iec') return humanBytes(n);
        if (to === 'si') return n >= 1e9 ? (n/1e9).toFixed(1)+'G' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);
        return String(n);
    },

    // ── Useful shortcuts and aliases ──────────────────────────────
    'll': (params, flags, stdin, cmd, args) => { return run('ls', ['-la', ...args.filter(a=>a!=='-la')], stdin); },

    'la': (params, flags, stdin, cmd, args) => { return run('ls', ['-a',  ...args.filter(a=>a!=='-a')], stdin); },

    'l': (params, flags, stdin, cmd, args) => { return run('ls', ['-lh', ...args.filter(a=>a!=='-lh')], stdin); },

    'md': (params, flags, stdin, cmd, args) => { return run('mkdir', args, stdin); },

    'cls': (params, flags, stdin, cmd, args) => { $terminal.innerHTML=''; return null; },

    'dir': (params, flags, stdin, cmd, args) => { return run('ls', args, stdin); },

    'randpw': (params, flags, stdin, cmd, args) => {
        const len = parseInt(params) || 16;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        return Array.from({length:len}, ()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    },

    'uuid': handleUuid,
    'uuidgen': handleUuid,
    'urlencode': (params, flags, stdin, cmd, args) => { return params.length ? encodeURIComponent(params.join(' ')) : 'usage: urlencode TEXT'; },

    'urldecode': (params, flags, stdin, cmd, args) => { return params.length ? decodeURIComponent(params.join(' ')) : 'usage: urldecode ENCODED_TEXT'; },

    'rot13': (params, flags, stdin, cmd, args) => {
        return params.join(' ').replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode((c.charCodeAt(0)-base+13)%26+base);
        });
    },

    'binary': (params, flags, stdin, cmd, args) => {
        const text = params.join(' ');
        return text.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
    },

    'hex': (params, flags, stdin, cmd, args) => {
        const text = params.join(' ');
        return text.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ');
    },

    'fromhex': (params, flags, stdin, cmd, args) => {
        try {
            const hex = params.join('').replace(/[^a-z0-9_-]/g, '');
            return hex.match(/.{2}/g)?.map(h=>String.fromCharCode(parseInt(h,16))).join('') || 'invalid hex';
        } catch { return 'fromhex: invalid input'; }
    },

    'ipinfo': async (params, flags, stdin, cmd, args) => {
        // Se o usuário digitar 'ipinfo 8.8.8.8' ele busca o IP. Se não digitar nada, busca o próprio IP.
        const ip = params.length ? params[0] : ''; 
        try {
            const res = await fetch(`https://ipapi.co/${ip}/json/`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            
            if (data.error) return `ipinfo: ${data.reason}`;
            
            return [
                `🌐 IP Information:`,
                `  IP:       ${data.ip}`,
                `  City:     ${data.city}`,
                `  Region:   ${data.region}`,
                `  Country:  ${data.country_name}`,
                `  ISP:      ${data.org}`
            ].join('\n');
            
        } catch (e) {
            return `ipinfo: failed to fetch IP data.`;
        }
    },

    'myip': (params, flags, stdin, cmd, args) => { return `Public IP (simulated): ${Math.floor(Math.random()*220+30)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}\nLocal IP: 192.168.1.${Math.floor(Math.random()*200+10)}`; },

    'ports': (params, flags, stdin, cmd, args) => {
        const p = params ? parseInt(params) : null;
        const wellKnown = {20:'FTP-data',21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',445:'SMB',3306:'MySQL',3389:'RDP',5432:'PostgreSQL',6379:'Redis',8080:'HTTP-alt',8443:'HTTPS-alt',27017:'MongoDB'};
        if (p) return wellKnown[p] ? `Port ${p}: ${wellKnown[p]}` : `Port ${p}: unassigned (1024+ = ephemeral/dynamic)`;
        return Object.entries(wellKnown).map(([port,svc])=>`${String(port).padStart(5)}/tcp  ${svc}`).join('\n');
    },

    'headers': (params, flags, stdin, cmd, args) => {
        if (!params.length) return 'usage: headers URL';
        return `HTTP/1.1 200 OK\nServer: nginx/1.24.0\nDate: ${new Date().toUTCString()}\nContent-Type: text/html; charset=UTF-8\nContent-Length: 12345\nConnection: keep-alive\nX-Content-Type-Options: nosniff\nX-Frame-Options: SAMEORIGIN\nStrict-Transport-Security: max-age=31536000`;
    },

    'ctf': (params, flags, stdin, cmd, args) => {
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
    },

    'cheatsheet': (params, flags, stdin, cmd, args) => {
        const topic = params[0];
        const sheets = {
            bash: 'BASH:\n  Ctrl+C  → cancel\n  Ctrl+Z  → suspend\n  Ctrl+D  → EOF/logout\n  Ctrl+L  → clear\n  !!      → last command\n  !$      → last argument\n  $?      → exit status',
            vim: 'VIM:\n  i → insert\n  Esc → normal mode\n  :w → save\n  :q → quit\n  :wq → save and quit\n  dd → delete line\n  yy → copy line\n  p → paste\n  /word → search',
            git: 'GIT:\n  git init         → initialize repo\n  git add .        → add all\n  git commit -m "" → commit\n  git push         → push\n  git pull         → pull\n  git status       → view status\n  git log          → history\n  git branch       → branches',
            regex: 'REGEX:\n  .  → any char\n  *  → 0 or more\n  +  → 1 or more\n  ?  → 0 or 1\n  ^  → start\n  $  → end\n  [] → char class\n  \d → digit\n  \w → word\n  \s → space',
            linux: 'ESSENTIAL LINUX:\n  ls -la    → list all\n  chmod 755 → rwxr-xr-x\n  chmod 644 → rw-r--r--\n  ps aux    → all processes\n  kill -9   → force kill\n  find / -name → search\n  grep -r   → recursive search',
        };
        return sheets[topic] || `Topics: ${Object.keys(sheets).join(', ')}\nusage: cheatsheet TOPIC`;
    },

};

// ── Command runner ────────────────────────────────────────────────
async function run(cmd, args, stdin) {
    let flags = [], params = [];
    let endFlags = false;
    for (let arg of args) {
    if (arg === '--') { endFlags = true; continue; }
    if (!endFlags && arg.startsWith('-')) flags.push(arg);
    else params.push(arg);
}

    // --- O GUARDIÃO DE PACOTES ---
    // Verifica se o comando precisa de um pacote que NÃO está instalado
    const requiredPkg = commandToPackage[cmd];
    if (requiredPkg && !installedPackages.includes(requiredPkg)) {
        return `bash: ${cmd}: command not found\n\nCommand '${cmd}' not found, but can be installed with:\nsudo apt install ${requiredPkg}`;
    }

    // Executa comandos embutidos
    if (Object.prototype.hasOwnProperty.call(coreCommands, cmd)) {
        return await coreCommands[cmd](params, flags, stdin, cmd, args);
    }

    if (!cmd) return null;
    
    // Fallback: Executar scripts criados no sistema (requer permissão 'x')
    if (typeof fsGet === 'function' && typeof resolvePath === 'function') {
        const absPath = resolvePath(cmd);
        const exec2 = fsGet(absPath) || fsGet(resolvePath('/usr/bin/'+cmd)) || fsGet(resolvePath('/bin/'+cmd));
        
        if (exec2?.type === 'file') {
            if (!checkPermission(absPath, 'x')) return `bash: ./${cmd}: Permission denied`;
            return `(executing '${cmd}' — simulated)`;
        }
    }
    
    // Comando não existe de jeito nenhum
    return `bash: ${cmd}: command not found\nType 'help' to see the available commands`;
}

