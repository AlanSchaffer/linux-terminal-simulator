// ═══════════════════════════════════════════════════════════════════
//  VFS.JS — Motor de Dados (Virtual Filesystem)
// ═══════════════════════════════════════════════════════════════════

let cwd = '';
let vfs = {};
let envVars = {};
let effectiveUser = '';
let installedPackages = [];
let dockerImages = [];
let dockerContainers = [];

// ── Filesystem helpers ──────────────────────────────────────────────
function saveDocker() {
    localStorage.setItem(`_403_docker_img_${username}`, JSON.stringify(dockerImages));
    localStorage.setItem(`_403_docker_cnt_${username}`, JSON.stringify(dockerContainers));
}


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

function fsTouch(path, content = '', customPerms = null) {
    const abs = resolvePath(path);
    // Garante que o arquivo herda o dono ativo e permissão padrão 644
    vfs[abs] = { 
        type: 'file', 
        content, 
        owner: effectiveUser || 'root', 
        perms: customPerms || '644', 
        size: content.length, 
        mdate: nowStr() 
    };
}

function fsMkdir(path, customPerms = null) {
    const abs = resolvePath(path);
    // Garante que a pasta herda o dono ativo e permissão padrão 755
    vfs[abs] = { 
        type: 'dir', 
        owner: effectiveUser || 'root', 
        perms: customPerms || '755', 
        size: 4096, 
        mdate: nowStr() 
    };
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

function checkPermission(path, mode) {
    const abs = resolvePath(path);
    const node = vfs[abs];
    if (!node) return true; // Se o arquivo não existir, deixa o comando tratar o erro de "Not Found"
    
    // O ROOT ignora completamente qualquer barreira de permissão
    if (effectiveUser === 'root') return true;
    
    const owner = node.owner || 'root';
    const perms = node.perms || (node.type === 'dir' ? '755' : '644');
    const isOwner = (owner === username);
    
    // CASO 1: Formato Octal Puro (Ex: "755", "644")
    if (perms.length === 3 && !isNaN(perms)) {
        const digit = parseInt(isOwner ? perms[0] : perms[2], 10); // Dono usa 1º dígito, outros usam o 3º
        const mask = mode === 'r' ? 4 : mode === 'w' ? 2 : mode === 'x' ? 1 : 0;
        return (digit & mask) === mask;
    }
    
    // CASO 2: Formato Tradicional String (Ex: "-rwxr-xr-x")
    if (perms.length === 9 || perms.length === 10) {
        const cleanPerms = perms.length === 10 ? perms.slice(1) : perms;
        const offset = isOwner ? 0 : 6; // Posição dos caracteres no bloco do Dono ou Outros
        if (mode === 'r') return cleanPerms[offset] === 'r';
        if (mode === 'w') return cleanPerms[offset + 1] === 'w';
        if (mode === 'x') return cleanPerms[offset + 2] === 'x';
    }
    
    return true;
}

function initFS() {
    vfs = {}; 
    const H = `/home/${username}`;

    envVars.HOME = H;
    envVars.USER = username;
    envVars.PWD = H;
    envVars.SHELL = '/bin/bash';
    envVars.PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';
    
    effectiveUser = username;

    // Função de segurança para não quebrar o terminal se o localStorage salvar "undefined"
    const safeParse = (item, fallback) => {
        if (!item || item === 'undefined' || item === 'null') return fallback;
        try { return JSON.parse(item); } catch (e) { return fallback; }
    };

    const savedVFS = localStorage.getItem(`_403_vfs_${username}`);
    const savedPkgs = localStorage.getItem(`_403_pkgs_${username}`);
    const savedImg = localStorage.getItem(`_403_docker_img_${username}`);
    const savedCnt = localStorage.getItem(`_403_docker_cnt_${username}`);

    installedPackages = safeParse(savedPkgs, []);
    dockerImages = safeParse(savedImg, [{ repo: 'ubuntu', tag: 'latest', id: '3b418d7b466a', size: '77.8MB' }]);
    dockerContainers = safeParse(savedCnt, []);

    // Tenta carregar o HD salvo
    if (savedVFS && savedVFS !== 'undefined' && savedVFS !== 'null') {
        try {
            vfs = JSON.parse(savedVFS);
        } catch (e) {
            console.error("HD corrompido, formatando disco virtual...");
            vfs = {};
        }
    }

    let savedCwd = sessionStorage.getItem('_403_cwd');
    // NOVO: Garante que o usuário NUNCA nasça numa pasta fantasma que quebra o terminal
    cwd = (savedCwd && savedCwd !== 'undefined' && savedCwd !== 'null' && vfs[savedCwd]) ? savedCwd : H;

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
        const isSystem = !path.startsWith(`/home/${username}`);
        if (!vfs[path]) {
            vfs[path] = {
                type: 'dir',
                owner: isSystem ? 'root' : username,
                perms: '755',
                size: 4096,
                mdate: nowStr()
            };
        } else {
            // NOVO: Conserta saves antigos onde a Home ficou bugada com permissão de Root!
            if (!isSystem) vfs[path].owner = username; 
        }
    });

    fsTouch('/etc/hostname', HOSTNAME);
    localStorage.setItem(`_403_vfs_${username}`, JSON.stringify(vfs));
}

function saveVFS() {
    localStorage.setItem(`_403_vfs_${username}`, JSON.stringify(vfs));
    sessionStorage.setItem('_403_cwd', cwd);
    // Salva o estado do docker sempre que o sistema salvar o disco virtual
    if (typeof saveDocker === 'function') saveDocker(); 
}
// Função de salvar os pacotes instalados

function savePackages() {
    localStorage.setItem(`_403_pkgs_${username}`, JSON.stringify(installedPackages));
}
