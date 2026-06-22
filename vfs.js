// ═══════════════════════════════════════════════════════════════════
//  VFS.JS — Motor de Dados (Virtual Filesystem)
// ═══════════════════════════════════════════════════════════════════

let cwd = '';
let vfs = {};
let envVars = {};

// ── Filesystem helpers ──────────────────────────────────────────────
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

function saveVFS() {
    localStorage.setItem(`_403_vfs_${username}`, JSON.stringify(vfs));
}
