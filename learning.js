// =====================================================================
// LEARNING.JS — Mission Engine & Curricula
// =====================================================================

let isLearning = false;
let currentLesson = 0;
let currentHintIndex = 0;

const missions = [
    // ── Beginner Missions (1 - 13) ───────────────────────────────────────
    {
        id: 1,
        stage: "Beginner",
        title: {
            en: "Where am I?",
            pt: "Onde eu estou?"
        },
        instruction: {
            en: "Welcome to the _403 Training! In a terminal, there is no graphical folder view. You must ask the system where you are.\n\nTask: Print your current working directory.",
            pt: "Bem-vindo ao Treinamento _403! Em um terminal, não há visão gráfica de pastas. Você deve perguntar ao sistema onde você está.\n\nTarefa: Imprima seu diretório de trabalho atual (current working directory)."
        },
        expectedCommand: "pwd",
        hints: {
            en: ["Think about an acronym for 'Print Working Directory'.", "It is a simple 3-letter command.", "pwd"],
            pt: ["Pense em uma sigla para 'Print Working Directory'.", "É um comando simples de 3 letras.", "pwd"]
        },
        successMsg: {
            en: "Excellent! You found your location.",
            pt: "Excelente! Você encontrou sua localização."
        },
        successExplanation: {
            en: "The 'pwd' command outputs the absolute path of the folder you are currently in. It is essential when you get lost in the terminal.",
            pt: "O comando 'pwd' exibe o caminho absoluto da pasta em que você está agora. É essencial quando você se perde no terminal."
        }
    },
    {
        id: 2,
        stage: "Beginner",
        title: {
            en: "Looking Around",
            pt: "Olhando ao Redor"
        },
        instruction: {
            en: "Now that you know where you are, let's see what is inside this folder.\n\nTask: List all files and directories in the current location.",
            pt: "Agora que você sabe onde está, vamos ver o que há dentro desta pasta.\n\nTarefa: Liste todos os arquivos e diretórios na localização atual."
        },
        expectedCommand: "ls",
        hints: {
            en: ["You need a command that 'lists' things.", "It is a 2-letter command starting with 'l'.", "ls"],
            pt: ["Você precisa de um comando para 'listar' (list) as coisas.", "É um comando de 2 letras que começa com 'l'.", "ls"]
        },
        successMsg: {
            en: "Well done!",
            pt: "Muito bem!"
        },
        successExplanation: {
            en: "The 'ls' command lists files and directories. It is one of the most frequently used Linux commands. You can also use 'ls -la' to see hidden files and permissions.",
            pt: "O comando 'ls' lista arquivos e diretórios. É um dos comandos mais usados do Linux. Você também pode usar 'ls -la' para ver arquivos ocultos e permissões."
        }
    },
    {
        id: 3,
        stage: "Beginner",
        title: {
            en: "Making Space",
            pt: "Criando Espaço"
        },
        instruction: {
            en: "We need a safe place to work. Let's create a new folder.\n\nTask: Create a directory named 'project'.",
            pt: "Precisamos de um lugar seguro para trabalhar. Vamos criar uma nova pasta.\n\nTarefa: Crie um diretório chamado 'project'."
        },
        expectedCommand: "mkdir project",
        hints: {
            en: ["The command stands for 'make directory'.", "Don't forget to specify the name of the folder after the command.", "mkdir project"],
            pt: ["O comando significa 'make directory' (fazer diretório).", "Não esqueça de especificar o nome da pasta após o comando.", "mkdir project"]
        },
        successMsg: {
            en: "Directory created!",
            pt: "Diretório criado!"
        },
        successExplanation: {
            en: "The 'mkdir' command creates new folders. Sysadmins use it all the time to organize logs, scripts, and user data.",
            pt: "O comando 'mkdir' cria novas pastas. Sysadmins o usam o tempo todo para organizar logs, scripts e dados de usuários."
        }
    },
    {
        id: 4,
        stage: "Beginner",
        title: {
            en: "Changing Rooms",
            pt: "Trocando de Sala"
        },
        instruction: {
            en: "You created the 'project' folder, but you are still outside of it.\n\nTask: Change your directory to the 'project' folder.",
            pt: "Você criou a pasta 'project', mas ainda está fora dela.\n\nTarefa: Mude seu diretório para a pasta 'project'."
        },
        expectedCommand: "cd project",
        hints: {
            en: ["The command stands for 'change directory'.", "You need to provide the target folder as an argument.", "cd project"],
            pt: ["O comando significa 'change directory' (mudar diretório).", "Você precisa fornecer a pasta de destino como argumento.", "cd project"]
        },
        successMsg: {
            en: "You are in!",
            pt: "Você entrou!"
        },
        successExplanation: {
            en: "The 'cd' command is your primary way of navigating the system. Without it, you are stuck in one room.",
            pt: "O comando 'cd' é sua principal forma de navegar pelo sistema. Sem ele, você fica preso em uma única sala."
        }
    },
    {
        id: 5,
        stage: "Beginner",
        title: {
            en: "Going Back",
            pt: "Voltando"
        },
        instruction: {
            en: "Let's learn how to retreat. How do you go back to the previous (parent) folder?\n\nTask: Move one directory up.",
            pt: "Vamos aprender a recuar. Como você volta para a pasta anterior (pai)?\n\nTarefa: Suba um diretório."
        },
        expectedCommand: "cd ..",
        hints: {
            en: ["You still use the 'change directory' command.", "In Linux, two dots (..) represent the parent directory.", "cd .."],
            pt: ["Você ainda usa o comando de mudar de diretório.", "No Linux, dois pontos (..) representam o diretório pai.", "cd .."]
        },
        successMsg: {
            en: "Retreat successful!",
            pt: "Recuo bem-sucedido!"
        },
        successExplanation: {
            en: "The '..' shortcut always points to the folder exactly one level above your current location. A single dot '.' points to your current folder.",
            pt: "O atalho '..' sempre aponta para a pasta exatamente um nível acima da sua localização atual. Um único ponto '.' aponta para a pasta atual."
        }
    },
    {
        id: 6,
        stage: "Beginner",
        title: {
            en: "The Magic Touch",
            pt: "O Toque Mágico"
        },
        instruction: {
            en: "Let's create an empty file. This is often used to create placeholder files or quickly generate scripts.\n\nTask: Create an empty file named 'script.sh'.",
            pt: "Vamos criar um arquivo vazio. Isso é muito usado para criar arquivos de marcação ou gerar scripts rapidamente.\n\nTarefa: Crie um arquivo vazio chamado 'script.sh'."
        },
        expectedCommand: "touch script.sh",
        hints: {
            en: ["The command is an English word that means 'to physically feel something'.", "Use the command followed by the filename.", "touch script.sh"],
            pt: ["O comando é uma palavra em inglês que significa 'tocar'.", "Use o comando seguido pelo nome do arquivo.", "touch script.sh"]
        },
        successMsg: {
            en: "File materialized!",
            pt: "Arquivo materializado!"
        },
        successExplanation: {
            en: "The 'touch' command actually updates the timestamp of a file, but if the file doesn't exist, it creates a blank one instantly.",
            pt: "O comando 'touch', na verdade, atualiza a data de modificação de um arquivo, mas se o arquivo não existir, ele cria um em branco instantaneamente."
        }
    },
    {
        id: 7,
        stage: "Beginner",
        title: {
            en: "Duplication",
            pt: "Duplicação"
        },
        instruction: {
            en: "We need a backup of that script before we mess with it.\n\nTask: Copy 'script.sh' to 'backup.sh'.",
            pt: "Precisamos de um backup desse script antes de mexermos nele.\n\nTarefa: Copie 'script.sh' para 'backup.sh'."
        },
        expectedCommand: "cp script.sh backup.sh",
        hints: {
            en: ["The command stands for 'copy'.", "The syntax is: [command] [source] [destination]", "cp script.sh backup.sh"],
            pt: ["O comando significa 'copy' (copiar).", "A sintaxe é: [comando] [origem] [destino]", "cp script.sh backup.sh"]
        },
        successMsg: {
            en: "Backup secured!",
            pt: "Backup garantido!"
        },
        successExplanation: {
            en: "The 'cp' command copies files. If you want to copy entire folders, you must use the recursive flag: 'cp -r'.",
            pt: "O comando 'cp' copia arquivos. Se você quiser copiar pastas inteiras, deve usar a flag recursiva: 'cp -r'."
        }
    },
    {
        id: 8,
        stage: "Beginner",
        title: {
            en: "Moving and Renaming",
            pt: "Movendo e Renomeando"
        },
        instruction: {
            en: "Let's rename 'backup.sh' to something more descriptive.\n\nTask: Move/Rename 'backup.sh' to 'old_script.sh'.",
            pt: "Vamos renomear 'backup.sh' para algo mais descritivo.\n\nTarefa: Mova/Renomeie 'backup.sh' para 'old_script.sh'."
        },
        expectedCommand: "mv backup.sh old_script.sh",
        hints: {
            en: ["The command stands for 'move'. In Linux, moving and renaming use the exact same command.", "The syntax is similar to copying: [command] [old_name] [new_name]", "mv backup.sh old_script.sh"],
            pt: ["O comando significa 'move' (mover). No Linux, mover e renomear usam exatamente o mesmo comando.", "A sintaxe é parecida com a de copiar: [comando] [nome_antigo] [novo_nome]", "mv backup.sh old_script.sh"]
        },
        successMsg: {
            en: "File renamed!",
            pt: "Arquivo renomeado!"
        },
        successExplanation: {
            en: "The 'mv' command relocates files. If the destination is just a new name in the same folder, it acts as a rename.",
            pt: "O comando 'mv' realoca arquivos. Se o destino for apenas um novo nome na mesma pasta, ele atua como um renomear."
        }
    },
    {
        id: 9,
        stage: "Beginner",
        title: {
            en: "Taking out the Trash",
            pt: "Tirando o Lixo"
        },
        instruction: {
            en: "We don't need 'old_script.sh' anymore. Let's delete it.\n\nTask: Remove the file 'old_script.sh'.",
            pt: "Não precisamos mais do 'old_script.sh'. Vamos deletá-lo.\n\nTarefa: Remova o arquivo 'old_script.sh'."
        },
        expectedCommand: "rm old_script.sh",
        hints: {
            en: ["The command stands for 'remove'.", "Be careful with this command, there is no recycle bin in the terminal!", "rm old_script.sh"],
            pt: ["O comando significa 'remove' (remover).", "Tenha cuidado com este comando, não existe lixeira no terminal!", "rm old_script.sh"]
        },
        successMsg: {
            en: "Target eliminated!",
            pt: "Alvo eliminado!"
        },
        successExplanation: {
            en: "The 'rm' command deletes files permanently. To delete a folder with items inside, you use 'rm -r'. Be extremely careful with 'rm -rf'!",
            pt: "O comando 'rm' deleta arquivos permanentemente. Para deletar uma pasta com itens dentro, você usa 'rm -r'. Tenha extremo cuidado com 'rm -rf'!"
        }
    },
    {
        id: 10,
        stage: "Beginner",
        title: {
            en: "Reading the Contents",
            pt: "Lendo o Conteúdo"
        },
        instruction: {
            en: "There is a system file that holds user information. Let's read it without opening an editor.\n\nTask: Read and print the contents of '/etc/hostname'.",
            pt: "Existe um arquivo de sistema que guarda o nome da máquina. Vamos lê-lo sem abrir um editor.\n\nTarefa: Leia e imprima o conteúdo de '/etc/hostname'."
        },
        expectedCommand: "cat /etc/hostname",
        hints: {
            en: ["The command is named after 'concatenate'. It sounds like a feline pet.", "Just type the command followed by the file path.", "cat /etc/hostname"],
            pt: ["O comando vem de 'concatenate' (concatenar). Em inglês, soa como um animal de estimação felino.", "Basta digitar o comando seguido pelo caminho do arquivo.", "cat /etc/hostname"]
        },
        successMsg: {
            en: "Data acquired!",
            pt: "Dados adquiridos!"
        },
        successExplanation: {
            en: "The 'cat' command is the fastest way to read short files, scripts, and configurations straight to your terminal screen.",
            pt: "O comando 'cat' é a maneira mais rápida de ler arquivos curtos, scripts e configurações direto na tela do seu terminal."
        }
    },
    {
        id: 11,
        stage: "Beginner",
        title: {
            en: "Searching Inside Texts",
            pt: "Pesquisando em Textos"
        },
        instruction: {
            en: "Sometimes you don't want to read the whole file, you just want to find a specific word.\n\nTask: Search for the word 'root' inside '/etc/passwd' (use the grep command).",
            pt: "Às vezes você não quer ler o arquivo inteiro, só quer encontrar uma palavra específica.\n\nTarefa: Procure pela palavra 'root' dentro de '/etc/passwd' (use o comando grep)."
        },
        expectedCommand: "grep root /etc/passwd",
        hints: {
            en: ["The command is 'grep'.", "The syntax is: grep [word_to_find] [file_to_search_in]", "grep root /etc/passwd"],
            pt: ["O comando é 'grep'.", "A sintaxe é: grep [palavra_para_buscar] [arquivo_para_procurar]", "grep root /etc/passwd"]
        },
        successMsg: {
            en: "Match found!",
            pt: "Correspondência encontrada!"
        },
        successExplanation: {
            en: "'grep' is arguably the most powerful text searching tool in Linux. Hackers and sysadmins use it to filter massive logs looking for errors or passwords.",
            pt: "O 'grep' é possivelmente a ferramenta de busca de texto mais poderosa do Linux. Hackers e sysadmins a usam para filtrar logs gigantescos procurando por erros ou senhas."
        }
    },
    {
        id: 12,
        stage: "Beginner",
        title: {
            en: "Finding Lost Files",
            pt: "Encontrando Arquivos Perdidos"
        },
        instruction: {
            en: "You know the name of a file, but you forgot where you saved it. Let's find it.\n\nTask: Use the 'find' command to search the current directory ('.') for a file named 'script.sh'.",
            pt: "Você sabe o nome de um arquivo, mas esqueceu onde o salvou. Vamos encontrá-lo.\n\nTarefa: Use o comando 'find' para pesquisar no diretório atual ('.') por um arquivo chamado 'script.sh'."
        },
        expectedCommand: "find . -name script.sh",
        hints: {
            en: ["The command is 'find'. The first argument is where to look (use '.' for current directory).", "You need to specify the flag '-name' followed by the filename.", "find . -name script.sh"],
            pt: ["O comando é 'find' (encontrar). O primeiro argumento é onde procurar (use '.' para o diretório atual).", "Você precisa especificar a flag '-name' seguida pelo nome do arquivo.", "find . -name script.sh"]
        },
        successMsg: {
            en: "File located!",
            pt: "Arquivo localizado!"
        },
        successExplanation: {
            en: "The 'find' command can search by name, size, type, or even modification date. It's the ultimate search engine of the terminal.",
            pt: "O comando 'find' pode pesquisar por nome, tamanho, tipo ou até data de modificação. É o motor de busca definitivo do terminal."
        }
    },
    {
        id: 13,
        stage: "Beginner",
        title: {
            en: "Understanding Permissions",
            pt: "Entendendo Permissões"
        },
        instruction: {
            en: "You have a script, but the system says 'Permission denied' when you try to run it.\n\nTask: Change the mode of 'script.sh' to make it fully executable (use 755).",
            pt: "Você tem um script, mas o sistema diz 'Permissão negada' quando você tenta rodá-lo.\n\nTarefa: Mude o modo do 'script.sh' para torná-lo totalmente executável (use 755)."
        },
        expectedCommand: "chmod 755 script.sh",
        hints: {
            en: ["The command stands for 'change mode' (chmod).", "The syntax is: [command] [permission_numbers] [filename]", "chmod 755 script.sh"],
            pt: ["O comando significa 'change mode' (chmod, mudar modo).", "A sintaxe é: [comando] [numeros_de_permissao] [nome_do_arquivo]", "chmod 755 script.sh"]
        },
        successMsg: {
            en: "Permissions updated!",
            pt: "Permissões atualizadas!"
        },
        successExplanation: {
            en: "The 'chmod' command alters access rights. 755 means the owner can read, write, and execute (7), while others can only read and execute (5).",
            pt: "O comando 'chmod' altera os direitos de acesso. 755 significa que o dono pode ler, escrever e executar (7), enquanto os outros só podem ler e executar (5)."
        }
    },

    // ── Intermediate Missions (14 - 28) ──────────────────────────────────────
    {
        id: 14,
        stage: "Intermediate",
        title: {
            en: "Hidden Secrets",
            pt: "Segredos Ocultos"
        },
        instruction: {
            en: "Let's explore deeper. Files starting with a dot '.' are hidden in Linux.\n\nTask: Use the list command with the flag that shows ALL files (including hidden ones).",
            pt: "Vamos explorar mais fundo. Arquivos que começam com um ponto '.' são ocultos no Linux.\n\nTarefa: Use o comando de listar com a flag que mostra TODOS os arquivos (incluindo os ocultos)."
        },
        expectedCommand: "ls -a",
        hints: {
            en: ["Think about 'all'.", "Use a dash followed by a single letter.", "ls -a"],
            pt: ["Pense em 'all' (todos).", "Use um traço seguido de uma única letra.", "ls -a"]
        },
        successMsg: {
            en: "Secrets revealed!",
            pt: "Segredos revelados!"
        },
        successExplanation: {
            en: "The '-a' flag is vital. Configurations like '.bashrc' or '.env' are always hidden to keep folders clean.",
            pt: "A flag '-a' é vital. Configurações como '.bashrc' ou '.env' são sempre ocultadas para manter as pastas limpas."
        }
    },
    {
        id: 15,
        stage: "Intermediate",
        title: {
            en: "Organizing the Workspace",
            pt: "Organizando o Espaço de Trabalho"
        },
        instruction: {
            en: "You know how to create folders and move files. Do it in one line!\n\nTask: Move 'script.sh' into the 'project' directory.",
            pt: "Você sabe criar pastas e mover arquivos. Faça isso em uma linha!\n\nTarefa: Mova 'script.sh' para o diretório 'project'."
        },
        expectedCommand: "mv script.sh project",
        hints: {
            en: ["Use the move command.", "Syntax: command source destination", "mv script.sh project"],
            pt: ["Use o comando de mover.", "Sintaxe: comando origem destino", "mv script.sh project"]
        },
        successMsg: {
            en: "Workspace organized!",
            pt: "Espaço organizado!"
        },
        successExplanation: {
            en: "Sysadmins keep environments clean. Using 'mv' allows you to quickly relocate logs and scripts to proper directories.",
            pt: "Sysadmins mantêm os ambientes limpos. Usar 'mv' permite realocar rapidamente logs e scripts para os diretórios corretos."
        }
    },
    {
        id: 16,
        stage: "Intermediate",
        title: {
            en: "Safe Backup",
            pt: "Backup Seguro"
        },
        instruction: {
            en: "You need to back up a folder. Regular 'cp' only copies files.\n\nTask: Copy the entire 'project' directory to a new folder named 'backup'.",
            pt: "Você precisa fazer backup de uma pasta. O 'cp' normal só copia arquivos.\n\nTarefa: Copie o diretório 'project' inteiro para uma nova pasta chamada 'backup'."
        },
        expectedCommand: "cp -r project backup",
        hints: {
            en: ["You need the copy command with the recursive flag.", "Use -r to copy directories and their contents.", "cp -r project backup"],
            pt: ["Você precisa do comando de copiar com a flag recursiva.", "Use -r para copiar diretórios e seus conteúdos.", "cp -r project backup"]
        },
        successMsg: {
            en: "Backup securely created!",
            pt: "Backup criado com segurança!"
        },
        successExplanation: {
            en: "The '-r' (recursive) flag is mandatory when duplicating directories. It tells the system to dive into the folder and copy everything inside.",
            pt: "A flag '-r' (recursivo) é obrigatória ao duplicar diretórios. Ela diz ao sistema para mergulhar na pasta e copiar tudo o que há dentro."
        }
    },
    {
        id: 17,
        stage: "Intermediate",
        title: {
            en: "Deep Cleaning",
            pt: "Limpeza Profunda"
        },
        instruction: {
            en: "The backup was corrupted. We need to delete the entire folder.\n\nTask: Remove the 'backup' folder and everything inside it.",
            pt: "O backup foi corrompido. Precisamos deletar a pasta inteira.\n\nTarefa: Remova a pasta 'backup' e tudo dentro dela."
        },
        expectedCommand: "rm -r backup",
        hints: {
            en: ["Regular 'rm' will fail on directories. You need a flag.", "Use the recursive flag just like you did with the copy command.", "rm -r backup"],
            pt: ["O 'rm' normal falhará em diretórios. Você precisa de uma flag.", "Use a flag recursiva assim como fez no comando de cópia.", "rm -r backup"]
        },
        successMsg: {
            en: "Folder wiped from existence!",
            pt: "Pasta apagada da existência!"
        },
        successExplanation: {
            en: "Using 'rm -r' is powerful but dangerous. It deletes folders without asking for confirmation for every file. Always double-check your target.",
            pt: "Usar 'rm -r' é poderoso, mas perigoso. Ele deleta pastas sem pedir confirmação para cada arquivo. Sempre verifique seu alvo duas vezes."
        }
    },
    {
        id: 18,
        stage: "Intermediate",
        title: {
            en: "Needle in a Haystack",
            pt: "Agulha no Palheiro"
        },
        instruction: {
            en: "The server crashed and generated a massive log file. You need to find the error.\n\nTask: Find the word 'ERROR' inside 'server.log'.",
            pt: "O servidor travou e gerou um arquivo de log gigante. Você precisa encontrar o erro.\n\nTarefa: Encontre a palavra 'ERROR' dentro de 'server.log'."
        },
        expectedCommand: "grep ERROR server.log",
        hints: {
            en: ["Use the text search command.", "Syntax: command [PATTERN] [file]", "grep ERROR server.log"],
            pt: ["Use o comando de busca em texto.", "Sintaxe: comando [PADRÃO] [arquivo]", "grep ERROR server.log"]
        },
        successMsg: {
            en: "Error isolated!",
            pt: "Erro isolado!"
        },
        successExplanation: {
            en: "Searching through logs manually is impossible. 'grep' allows you to instantly isolate the lines that matter.",
            pt: "Pesquisar logs manualmente é impossível. O 'grep' permite isolar instantaneamente as linhas que importam."
        }
    },
    {
        id: 19,
        stage: "Intermediate",
        title: {
            en: "Case Insensitive",
            pt: "Ignorando Maiúsculas"
        },
        instruction: {
            en: "Sometimes 'error' is written as 'Error' or 'ERROR'. Let's catch them all.\n\nTask: Search for 'error' in 'server.log' ignoring uppercase and lowercase.",
            pt: "Às vezes, 'error' é escrito como 'Error' ou 'ERROR'. Vamos capturar todos.\n\nTarefa: Pesquise por 'error' em 'server.log' ignorando maiúsculas e minúsculas."
        },
        expectedCommand: "grep -i error server.log",
        hints: {
            en: ["You need a flag that stands for 'ignore-case'.", "Put the flag before the search pattern.", "grep -i error server.log"],
            pt: ["Você precisa de uma flag que signifique 'ignore-case' (ignorar caixa).", "Coloque a flag antes do padrão de busca.", "grep -i error server.log"]
        },
        successMsg: {
            en: "All cases found!",
            pt: "Todos os casos encontrados!"
        },
        successExplanation: {
            en: "The '-i' flag makes your search bulletproof against weirdly formatted log files.",
            pt: "A flag '-i' torna sua busca à prova de balas contra arquivos de log com formatação estranha."
        }
    },
    {
        id: 20,
        stage: "Intermediate",
        title: {
            en: "Locate the Target",
            pt: "Localize o Alvo"
        },
        instruction: {
            en: "A specific file is deeply nested somewhere in the current directory tree.\n\nTask: Find the file named 'target.txt' starting from the current directory ('.').",
            pt: "Um arquivo específico está profundamente aninhado em algum lugar na árvore de diretórios atual.\n\nTarefa: Encontre o arquivo chamado 'target.txt' começando do diretório atual ('.')."
        },
        expectedCommand: "find . -name target.txt",
        hints: {
            en: ["Start from '.' and filter by name.", "Use the '-name' flag.", "find . -name target.txt"],
            pt: ["Comece por '.' e filtre por nome.", "Use a flag '-name'.", "find . -name target.txt"]
        },
        successMsg: {
            en: "Target locked!",
            pt: "Alvo fixado!"
        },
        successExplanation: {
            en: "The 'find' command crawls through all subdirectories to locate your file.",
            pt: "O comando 'find' rastreia todos os subdiretórios para localizar o seu arquivo."
        }
    },
    {
        id: 21,
        stage: "Intermediate",
        title: {
            en: "Type Filter",
            pt: "Filtro de Tipo"
        },
        instruction: {
            en: "We only want to see the skeleton of the project. No files, only folders.\n\nTask: Find all directories (ignore files) starting from the current directory ('.').",
            pt: "Nós só queremos ver o esqueleto do projeto. Nenhum arquivo, apenas pastas.\n\nTarefa: Encontre todos os diretórios (ignore arquivos) começando do diretório atual ('.')."
        },
        expectedCommand: "find . -type d",
        hints: {
            en: ["Use the 'find' command with the '-type' flag.", "The type for directory is 'd'.", "find . -type d"],
            pt: ["Use o comando 'find' com a flag '-type' (tipo).", "A letra de tipo para diretório (directory) é 'd'.", "find . -type d"]
        },
        successMsg: {
            en: "Directories listed!",
            pt: "Diretórios listados!"
        },
        successExplanation: {
            en: "Filtering by type ('d' for directory, 'f' for file) is extremely useful when doing mass permission changes.",
            pt: "Filtrar por tipo ('d' para diretório, 'f' para arquivo) é extremamente útil ao fazer alterações de permissão em massa."
        }
    },
    {
        id: 22,
        stage: "Intermediate",
        title: {
            en: "Locking it Down",
            pt: "Trancando Tudo"
        },
        instruction: {
            en: "You have a file that should NEVER be modified, only read.\n\nTask: Make 'secret.txt' strictly read-only for everyone (use permission 444).",
            pt: "Você tem um arquivo que NUNCA deve ser modificado, apenas lido.\n\nTarefa: Torne 'secret.txt' estritamente leitura-apenas para todos (use permissão 444)."
        },
        expectedCommand: "chmod 444 secret.txt",
        hints: {
            en: ["Use the change mode command.", "4 means read. You need it for owner, group, and others.", "chmod 444 secret.txt"],
            pt: ["Use o comando de mudança de modo.", "4 significa leitura (read). Você precisa dele para o dono, grupo e outros.", "chmod 444 secret.txt"]
        },
        successMsg: {
            en: "File locked down!",
            pt: "Arquivo trancado!"
        },
        successExplanation: {
            en: "Read-only permissions (444) prevent accidental overwrites, even by the file's owner.",
            pt: "Permissões de leitura-apenas (444) evitam sobrescritas acidentais, mesmo pelo próprio dono do arquivo."
        }
    },
    {
        id: 23,
        stage: "Intermediate",
        title: {
            en: "Executable Script",
            pt: "Script Executável"
        },
        instruction: {
            en: "You wrote a script, but the system treats it as plain text. Give it life!\n\nTask: Add executable permission to 'run.sh'.",
            pt: "Você escreveu um script, mas o sistema o trata como texto simples. Dê vida a ele!\n\nTarefa: Adicione permissão de execução a 'run.sh'."
        },
        expectedCommand: "chmod +x run.sh",
        hints: {
            en: ["Instead of numbers, use the '+' symbol to add a permission.", "The letter for execute is 'x'.", "chmod +x run.sh"],
            pt: ["Em vez de números, use o símbolo '+' para adicionar uma permissão.", "A letra para execução (execute) é 'x'.", "chmod +x run.sh"]
        },
        successMsg: {
            en: "Script is now executable!",
            pt: "O script agora é executável!"
        },
        successExplanation: {
            en: "Using '+x' is the standard way to quickly make scripts runnable without doing binary math in your head.",
            pt: "Usar '+x' é a maneira padrão de tornar scripts executáveis rapidamente sem precisar fazer matemática binária de cabeça."
        }
    },
    {
        id: 24,
        stage: "Intermediate",
        title: {
            en: "Moving Up",
            pt: "Subindo de Nível"
        },
        instruction: {
            en: "Sometimes you need to move a file out of the current folder into the parent folder.\n\nTask: Move 'report.txt' to the parent directory (..).",
            pt: "Às vezes você precisa mover um arquivo da pasta atual para a pasta pai.\n\nTarefa: Mova 'report.txt' para o diretório pai (..)."
        },
        expectedCommand: "mv report.txt ..",
        hints: {
            en: ["Use the move command.", "The destination is the parent folder shortcut (..).", "mv report.txt .."],
            pt: ["Use o comando de mover.", "O destino é o atalho da pasta pai (..).", "mv report.txt .."]
        },
        successMsg: {
            en: "File moved up!",
            pt: "Arquivo movido para cima!"
        },
        successExplanation: {
            en: "Using relative paths like '..' saves you from typing the full absolute path of the destination.",
            pt: "Usar caminhos relativos como '..' evita que você precise digitar o caminho absoluto completo do destino."
        }
    },
    {
        id: 25,
        stage: "Intermediate",
        title: {
            en: "Reading the End",
            pt: "Lendo o Final"
        },
        instruction: {
            en: "A log file has 10,000 lines. You only care about the most recent events.\n\nTask: Read only the last few lines of 'server.log'.",
            pt: "Um arquivo de log tem 10.000 linhas. Você só se importa com os eventos mais recentes.\n\nTarefa: Leia apenas as últimas linhas de 'server.log'."
        },
        expectedCommand: "tail server.log",
        hints: {
            en: ["Think about the 'end' or 'back' of an animal.", "It's a 4-letter command.", "tail server.log"],
            pt: ["Pense na parte de trás ou final de um animal (cauda, em inglês).", "É um comando de 4 letras.", "tail server.log"]
        },
        successMsg: {
            en: "Recent events extracted!",
            pt: "Eventos recentes extraídos!"
        },
        successExplanation: {
            en: "'tail' is a sysadmin's best friend. Pro tip: use 'tail -f' to watch a file update in real-time.",
            pt: "O 'tail' é o melhor amigo de um sysadmin. Dica pro: use 'tail -f' para assistir a um arquivo sendo atualizado em tempo real."
        }
    },
    {
        id: 26,
        stage: "Intermediate",
        title: {
            en: "Reading the Start",
            pt: "Lendo o Início"
        },
        instruction: {
            en: "Now you need to check the file headers to see when the log started.\n\nTask: Read only the beginning of 'server.log'.",
            pt: "Agora você precisa verificar os cabeçalhos do arquivo para ver quando o log começou.\n\nTarefa: Leia apenas o início de 'server.log'."
        },
        expectedCommand: "head server.log",
        hints: {
            en: ["The opposite of tail.", "It's a 4-letter command.", "head server.log"],
            pt: ["O oposto de 'tail' (cabeça, em inglês).", "É um comando de 4 letras.", "head server.log"]
        },
        successMsg: {
            en: "Headers checked!",
            pt: "Cabeçalhos verificados!"
        },
        successExplanation: {
            en: "Just like 'tail', 'head' allows you to sample the top of a file without flooding your screen.",
            pt: "Assim como o 'tail', o 'head' permite que você colete uma amostra do topo de um arquivo sem inundar sua tela."
        }
    },
    {
        id: 27,
        stage: "Intermediate",
        title: {
            en: "Quick Edit",
            pt: "Edição Rápida"
        },
        instruction: {
            en: "You don't need a full text editor just to write one word.\n\nTask: Overwrite the file 'status.txt' with the word 'text' using the echo command.",
            pt: "Você não precisa de um editor de texto completo só para escrever uma palavra.\n\nTarefa: Sobrescreva o arquivo 'status.txt' com a palavra 'text' usando o comando echo."
        },
        expectedCommand: "echo \"text\" > status.txt",
        acceptedCommands: ["echo text > status.txt", "echo 'text' > status.txt"],
        hints: {
            en: ["Use 'echo' to output the word, and the '>' symbol to redirect it to the file.", "Syntax: echo \"word\" > file", "echo \"text\" > status.txt"],
            pt: ["Use 'echo' para exibir a palavra, e o símbolo '>' para redirecioná-la para o arquivo.", "Sintaxe: echo \"palavra\" > arquivo", "echo \"text\" > status.txt"]
        },
        successMsg: {
            en: "File overwritten successfully!",
            pt: "Arquivo sobrescrito com sucesso!"
        },
        successExplanation: {
            en: "The '>' operator is called a 'redirector'. It takes the output of a command and forces it into a file, destroying the previous content.",
            pt: "O operador '>' é chamado de redirecionador. Ele pega a saída de um comando e a injeta em um arquivo, destruindo o conteúdo anterior."
        }
    },
    {
        id: 28,
        stage: "Intermediate",
        title: {
            en: "Appending",
            pt: "Anexando"
        },
        instruction: {
            en: "Wait, you need to add more text without erasing what is already there.\n\nTask: Add the word \"text\" to the end of 'status.txt' without overwriting it.",
            pt: "Espera, você precisa adicionar mais texto sem apagar o que já está lá.\n\nTarefa: Adicione a palavra \"text\" ao final de 'status.txt' sem sobrescrevê-lo."
        },
        expectedCommand: "echo \"text\" >> status.txt",
        acceptedCommands: ["echo text >> status.txt", "echo 'text' >> status.txt"],
        hints: {
            en: ["You need the append operator, which is two redirectors together.", "Use '>>' instead of '>'.", "echo \"text\" >> status.txt"],
            pt: ["Você precisa do operador de anexar (append), que são dois redirecionadores juntos.", "Use '>>' em vez de '>'.", "echo \"text\" >> status.txt"]
        },
        successMsg: {
            en: "Data appended safely!",
            pt: "Dados anexados com segurança!"
        },
        successExplanation: {
            en: "The '>>' operator adds data to the end of a file. It is the safest way to inject configuration lines via terminal.",
            pt: "O operador '>>' adiciona dados ao final de um arquivo. É a maneira mais segura de injetar linhas de configuração via terminal."
        }
    },

    // ── Advanced Missions (29 - 40) ───────────────────────────────────────────
    {
        id: 29,
        stage: "Advanced",
        title: {
            en: "Fetching Data",
            pt: "Buscando Dados"
        },
        instruction: {
            en: "Welcome to the Advanced stage! You now need to pull data from the web.\n\nTask: Download data from 'http://api.data.com' using the terminal.",
            pt: "Bem-vindo ao estágio Avançado! Agora você precisa extrair dados da web.\n\nTarefa: Baixe dados de 'http://api.data.com' usando o terminal."
        },
        expectedCommand: "curl http://api.data.com",
        hints: {
            en: ["Use the command designed to transfer data from URLs.", "It starts with 'c'.", "curl http://api.data.com"],
            pt: ["Use o comando desenhado para transferir dados de URLs.", "Ele começa com 'c'.", "curl http://api.data.com"]
        },
        successMsg: {
            en: "Data retrieved from the internet!",
            pt: "Dados recuperados da internet!"
        },
        successExplanation: {
            en: "'curl' is an essential tool for interacting with APIs, downloading scripts, and testing network connectivity.",
            pt: "O 'curl' é uma ferramenta essencial para interagir com APIs, baixar scripts e testar conectividade de rede."
        }
    },
    {
        id: 30,
        stage: "Advanced",
        title: {
            en: "The Weather Man",
            pt: "O Homem do Tempo"
        },
        instruction: {
            en: "You can even check the weather from the terminal! Let's save today's forecast.\n\nTask: Run the 'weather' command and redirect (>) its output to 'forecast.txt'.",
            pt: "Você pode até checar a previsão do tempo do terminal! Vamos salvar a previsão de hoje.\n\nTarefa: Rode o comando 'weather' e redirecione (>) sua saída para 'forecast.txt'."
        },
        expectedCommand: "weather > forecast.txt",
        hints: {
            en: ["Run the command and use the single redirector.", "Don't overthink it.", "weather > forecast.txt"],
            pt: ["Rode o comando e use o redirecionador simples.", "Não complique demais.", "weather > forecast.txt"]
        },
        successMsg: {
            en: "Forecast saved to disk!",
            pt: "Previsão salva no disco!"
        },
        successExplanation: {
            en: "Piping and redirecting tool outputs into files is the foundation of shell scripting.",
            pt: "Redirecionar a saída de ferramentas para arquivos é a base do shell scripting."
        }
    },
    {
        id: 31,
        stage: "Advanced",
        title: {
            en: "The Mysterious Log",
            pt: "O Log Misterioso"
        },
        instruction: {
            en: "Let's combine commands! Download a file and filter it in one line using a pipe (|).\n\nTask: Download 'http://logs.com/access.log' with curl, and pipe the result to grep to find '192.168.0.1'.",
            pt: "Vamos combinar comandos! Baixe um arquivo e filtre-o na mesma linha usando um pipe (|).\n\nTarefa: Baixe 'http://logs.com/access.log' com curl, e use o pipe no resultado com o grep para encontrar '192.168.0.1'."
        },
        expectedCommand: "curl http://logs.com/access.log | grep 192.168.0.1",
        hints: {
            en: ["First type the curl command, then the '|' symbol, then the grep command.", "Syntax: command1 | command2", "curl http://logs.com/access.log | grep 192.168.0.1"],
            pt: ["Primeiro digite o comando curl, depois o símbolo '|', depois o comando grep.", "Sintaxe: comando1 | comando2", "curl http://logs.com/access.log | grep 192.168.0.1"]
        },
        successMsg: {
            en: "IP successfully traced on the fly!",
            pt: "IP rastreado em tempo real com sucesso!"
        },
        successExplanation: {
            en: "The pipe '|' takes the visual output of the first command and feeds it directly into the second command as invisible text.",
            pt: "O pipe '|' pega a saída visual do primeiro comando e a alimenta diretamente no segundo comando como texto invisível."
        }
    },
    {
        id: 32,
        stage: "Advanced",
        title: {
            en: "Sysadmin Setup",
            pt: "Configuração de Sysadmin"
        },
        instruction: {
            en: "You need a vault. Create a folder and lock it down immediately.\n\nTask: Create a folder named 'secure', then use '&&' to run chmod 700 on it in the same line.",
            pt: "Você precisa de um cofre. Crie uma pasta e a tranque imediatamente.\n\nTarefa: Crie uma pasta chamada 'secure', depois use '&&' para rodar chmod 700 nela na mesma linha."
        },
        expectedCommand: "mkdir secure && chmod 700 secure",
        hints: {
            en: ["Use '&&' to chain two commands together.", "Command 1: mkdir secure. Command 2: chmod 700 secure.", "mkdir secure && chmod 700 secure"],
            pt: ["Use '&&' para encadear dois comandos.", "Comando 1: mkdir secure. Comando 2: chmod 700 secure.", "mkdir secure && chmod 700 secure"]
        },
        successMsg: {
            en: "Secure vault established!",
            pt: "Cofre seguro estabelecido!"
        },
        successExplanation: {
            en: "The '&&' operator only runs the second command if the first one succeeds. It is safer than running them blindly.",
            pt: "O operador '&&' só roda o segundo comando se o primeiro for bem-sucedido. É mais seguro do que rodá-los às cegas."
        }
    },
    {
        id: 33,
        stage: "Advanced",
        title: {
            en: "First Contact with Vim",
            pt: "Primeiro Contato com Vim"
        },
        instruction: {
            en: "It's time to face the beast. The terminal's legendary text editor.\n\nTask: Open a file named 'notes.txt' using vim.",
            pt: "É hora de enfrentar a besta. O lendário editor de texto do terminal.\n\nTarefa: Abra um arquivo chamado 'notes.txt' usando o vim."
        },
        expectedCommand: "vim notes.txt",
        hints: {
            en: ["Just invoke the editor followed by the file name.", "Type 'vim' followed by the file.", "vim notes.txt"],
            pt: ["Basta invocar o editor seguido pelo nome do arquivo.", "Digite 'vim' seguido pelo arquivo.", "vim notes.txt"]
        },
        successMsg: {
            en: "Welcome to Vim!",
            pt: "Bem-vindo ao Vim!"
        },
        successExplanation: {
            en: "Vim has two modes. Press 'i' to Insert text. Press 'ESC' to stop typing. Type ':wq' and press ENTER to save and exit. It takes practice!",
            pt: "O Vim tem dois modos. Pressione 'i' para inserir texto. Pressione 'ESC' para parar de digitar. Digite ':wq' e pressione ENTER para salvar e sair. Exige prática!"
        }
    },
    {
        id: 34,
        stage: "Advanced",
        title: {
            en: "Find and Destroy",
            pt: "Encontrar e Destruir"
        },
        instruction: {
            en: "A temporary file is taking up space, find it and delete it sequentially.\n\nTask: Use 'find . -name temp.txt' and chain it with '&&' to run 'rm temp.txt'.",
            pt: "Um arquivo temporário está ocupando espaço, encontre-o e delete-o sequencialmente.\n\nTarefa: Use 'find . -name temp.txt' e encadeie-o com '&&' para rodar 'rm temp.txt'."
        },
        expectedCommand: "find . -name temp.txt && rm temp.txt",
        hints: {
            en: ["You are chaining two commands that you already know.", "Use the logical AND operator (&&).", "find . -name temp.txt && rm temp.txt"],
            pt: ["Você está encadeando dois comandos que já conhece.", "Use o operador lógico AND (&&).", "find . -name temp.txt && rm temp.txt"]
        },
        successMsg: {
            en: "Target located and destroyed!",
            pt: "Alvo localizado e destruído!"
        },
        successExplanation: {
            en: "In the real world, you can use the '-exec' flag inside 'find' to do this automatically, but chaining commands is a great manual way to do it.",
            pt: "No mundo real, você pode usar a flag '-exec' dentro do 'find' para fazer isso automaticamente, mas encadear comandos é uma ótima maneira manual de fazer."
        }
    },
    {
        id: 35,
        stage: "Advanced",
        title: {
            en: "The API Key",
            pt: "A Chave da API"
        },
        instruction: {
            en: "You need to extract a secret key from a configuration file.\n\nTask: Print the contents of 'config.json' using 'cat', and pipe (|) it to 'grep API_KEY'.",
            pt: "Você precisa extrair uma chave secreta de um arquivo de configuração.\n\nTarefa: Imprima o conteúdo de 'config.json' usando 'cat', e faça um pipe (|) para 'grep API_KEY'."
        },
        expectedCommand: "cat config.json | grep API_KEY",
        acceptedCommands: ["grep API_KEY config.json"],
        hints: {
            en: ["Read the file first.", "Use the pipe symbol.", "cat config.json | grep API_KEY"],
            pt: ["Leia o arquivo primeiro.", "Use o símbolo do pipe.", "cat config.json | grep API_KEY"]
        },
        successMsg: {
            en: "Key extracted safely!",
            pt: "Chave extraída com segurança!"
        },
        successExplanation: {
            en: "While 'grep API_KEY config.json' is faster, the 'cat | grep' format is widely used by hackers to manipulate data streams.",
            pt: "Embora 'grep API_KEY config.json' seja mais rápido, o formato 'cat | grep' é amplamente usado por hackers para manipular fluxos de dados."
        }
    },
    {
        id: 36,
        stage: "Advanced",
        title: {
            en: "Web Server Prep",
            pt: "Preparação do Servidor Web"
        },
        instruction: {
            en: "You need to set up a quick web project structure.\n\nTask: Create a directory named 'public', chain with '&&', and create both 'public/index.html' and 'public/style.css' using touch.",
            pt: "Você precisa montar uma estrutura rápida de projeto web.\n\nTarefa: Crie um diretório chamado 'public', encadeie com '&&', e crie 'public/index.html' e 'public/style.css' juntos usando touch."
        },
        expectedCommand: "mkdir public && touch public/index.html public/style.css",
        hints: {
            en: ["Remember 'touch' can create multiple files at once if separated by a space.", "mkdir public && touch public/file1 public/file2", "mkdir public && touch public/index.html public/style.css"],
            pt: ["Lembre-se que o 'touch' pode criar múltiplos arquivos de uma vez se separados por espaço.", "mkdir public && touch public/file1 public/file2", "mkdir public && touch public/index.html public/style.css"]
        },
        successMsg: {
            en: "Web structure deployed!",
            pt: "Estrutura web implantada!"
        },
        successExplanation: {
            en: "Mastering single-line setups makes you incredibly fast in terminal environments.",
            pt: "Dominar setups em linha única te torna incrivelmente rápido em ambientes de terminal."
        }
    },
    {
        id: 37,
        stage: "Advanced",
        title: {
            en: "Mini-Boss 1 (The Broken Script)",
            pt: "Mini-Boss 1 (O Script Quebrado)"
        },
        instruction: {
            en: "A script is broken because it lacks permissions. Fix it and run it immediately.\n\nTask: Add executable permission (+x) to 'deploy.sh', chain with '&&', and run it using './deploy.sh'.",
            pt: "Um script está quebrado porque não tem permissões. Conserte e rode imediatamente.\n\nTarefa: Adicione permissão de execução (+x) ao 'deploy.sh', encadeie com '&&', e rode-o usando './deploy.sh'."
        },
        expectedCommand: "chmod +x deploy.sh && ./deploy.sh",
        hints: {
            en: ["You need to change the mode, then execute the file from the current directory.", "Use './' to run an executable in Linux.", "chmod +x deploy.sh && ./deploy.sh"],
            pt: ["Você precisa alterar o modo e então executar o arquivo do diretório atual.", "Use './' para rodar um executável no Linux.", "chmod +x deploy.sh && ./deploy.sh"]
        },
        successMsg: {
            en: "Script repaired and executed!",
            pt: "Script reparado e executado!"
        },
        successExplanation: {
            en: "The './' tells the terminal exactly where the program is located, bypassing the system's global environment paths.",
            pt: "O './' diz ao terminal exatamente onde o programa está localizado, contornando os caminhos de ambiente globais do sistema."
        }
    },
    {
        id: 38,
        stage: "Advanced",
        title: {
            en: "Mini-Boss 2 (Data Heist)",
            pt: "Mini-Boss 2 (Roubo de Dados)"
        },
        instruction: {
            en: "A remote database is exposed. Fetch the data, extract the confidential part, and hide it.\n\nTask: curl 'http://remote.com/data', pipe it to grep 'CONFIDENTIAL', and redirect (>) to a hidden file named '.secrets'.",
            pt: "Um banco de dados remoto está exposto. Puxe os dados, extraia a parte confidencial e a esconda.\n\nTarefa: faça um curl em 'http://remote.com/data', um pipe para grep 'CONFIDENTIAL', e redirecione (>) para um arquivo oculto chamado '.secrets'."
        },
        expectedCommand: "curl http://remote.com/data | grep CONFIDENTIAL > .secrets",
        hints: {
            en: ["This combines 3 concepts: Fetch, Filter, and Hide.", "Command 1 | Command 2 > HiddenFile", "curl http://remote.com/data | grep CONFIDENTIAL > .secrets"],
            pt: ["Isso combina 3 conceitos: Buscar, Filtrar e Esconder.", "Comando 1 | Comando 2 > ArquivoOculto", "curl http://remote.com/data | grep CONFIDENTIAL > .secrets"]
        },
        successMsg: {
            en: "Data successfully exfiltrated and hidden!",
            pt: "Dados exfiltrados e ocultados com sucesso!"
        },
        successExplanation: {
            en: "This is a real-world data manipulation pipeline. You fetched network data, processed it in memory, and wrote the result directly to the disk.",
            pt: "Este é um pipeline de manipulação de dados do mundo real. Você buscou dados da rede, processou-os na memória e escreveu o resultado diretamente no disco."
        }
    },
    {
        id: 39,
        stage: "Advanced",
        title: {
            en: "Mini-Boss 3 (Security Breach)",
            pt: "Mini-Boss 3 (Falha de Segurança)"
        },
        instruction: {
            en: "An intrusion occurred! Check the logs, secure the folder, and delete the shell.\n\nTask: grep 'INTRUSION' in '/var/log/syslog', chain (&&) to chmod 700 '/var/www', chain (&&) to rm '/var/www/shell.php'.",
            pt: "Ocorreu uma intrusão! Verifique os logs, proteja a pasta e delete o shell.\n\nTarefa: dê um grep por 'INTRUSION' em '/var/log/syslog', encadeie (&&) com chmod 700 em '/var/www', encadeie (&&) com rm em '/var/www/shell.php'."
        },
        expectedCommand: "grep INTRUSION /var/log/syslog && chmod 700 /var/www && rm /var/www/shell.php",
        hints: {
            en: ["This is a 3-part chain using '&&'.", "Follow the exact path strings provided in the task.", "grep INTRUSION /var/log/syslog && chmod 700 /var/www && rm /var/www/shell.php"],
            pt: ["Esta é uma corrente de 3 partes usando '&&'.", "Siga exatamente as strings de caminhos fornecidas na tarefa.", "grep INTRUSION /var/log/syslog && chmod 700 /var/www && rm /var/www/shell.php"]
        },
        successMsg: {
            en: "Breach contained! Server secured.",
            pt: "Violação contida! Servidor protegido."
        },
        successExplanation: {
            en: "Incident response requires speed and precision. You verified the log, locked down the permissions, and neutralized the threat all in one stroke.",
            pt: "Resposta a incidentes exige velocidade e precisão. Você verificou o log, bloqueou as permissões e neutralizou a ameaça de uma só vez."
        }
    },
    {
        id: 40,
        stage: "Advanced",
        title: {
            en: "🏆 FINAL BOSS: The DevOps Nightmare",
            pt: "🏆 CHEFÃO FINAL: O Pesadelo DevOps"
        },
        instruction: {
            en: "A developer left the server broken. You must find the config, fix it, download the patch, and edit it!\n\nTask: find '.' for name 'config.yml', chain (&&) to chmod 644 'config.yml', chain (&&) to curl 'http://patch.com/v2' redirecting (>) to 'config.yml', chain (&&) to vim 'config.yml'.",
            pt: "Um dev deixou o servidor quebrado. Você deve achar a config, consertá-la, baixar o patch e editá-la!\n\nTarefa: use find em '.' pelo nome 'config.yml', encadeie (&&) com chmod 644 em 'config.yml', encadeie (&&) com curl de 'http://patch.com/v2' redirecionando (>) para 'config.yml', encadeie (&&) abrindo o vim em 'config.yml'."
        },
        expectedCommand: "find . -name config.yml && chmod 644 config.yml && curl http://patch.com/v2 > config.yml && vim config.yml",
        hints: {
            en: ["Breathe. This is a 4-part chain.", "Use '&&' between each complete command block.", "find . -name config.yml && chmod 644 config.yml && curl http://patch.com/v2 > config.yml && vim config.yml"],
            pt: ["Respire. Esta é uma corrente de 4 partes.", "Use '&&' entre cada bloco de comando completo.", "find . -name config.yml && chmod 644 config.yml && curl http://patch.com/v2 > config.yml && vim config.yml"]
        },
        successMsg: {
            en: "SYSTEM RESTORED. YOU ARE A TERMINAL MASTER!",
            pt: "SISTEMA RESTAURADO. VOCÊ É UM MESTRE DO TERMINAL!"
        },
        successExplanation: {
            en: "You have seamlessly combined filesystem traversal, permission management, network operations, file redirection, and text editing in a single breath. The terminal is now yours.",
            pt: "Você combinou perfeitamente navegação de sistema de arquivos, gerenciamento de permissões, operações de rede, redirecionamento de arquivos e edição de texto em um único suspiro. O terminal agora é seu."
        }
    }
];


// ── UI Controllers ───────────────────────────────────────────────────

function toggleButtonUI(active) {
    const btn = document.getElementById('menu-learning-btn');
    if (!btn) return;

    if (active) {
        btn.classList.add('active');
        btn.querySelector('.learning-label').innerText = 'Learn (Active)';
    } else {
        btn.classList.remove('active');
        btn.querySelector('.learning-label').innerText = 'Learn';
    }
}

function printMission() {
    const lesson = missions[currentLesson];
    const missionPanel = document.getElementById('mission-panel');
    const lang = window.currentLang || 'en'; // Puxa o idioma atual
    
    const currentStage = lesson.stage;

    let trackerHTML = `<div style="margin-top:12px; padding: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; max-height: 110px; overflow-y: auto; font-size: 12px; border: 1px solid var(--muted-color); font-family: monospace;">`;
    trackerHTML += `<div style="color: var(--info-color); font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">📂 STAGE: ${currentStage.toUpperCase()}</div>`;

    missions.forEach((m, idx) => {
        if (m.stage !== currentStage) return;
        let status = idx < currentLesson ? '<span style="color: var(--accent-color)">[ x ]</span>' : 
                     idx === currentLesson ? '<span style="color: var(--warn-color)">[ > ]</span>' : 
                     '<span style="color: var(--muted-color)">[   ]</span>';
        let color = idx === currentLesson ? 'color: var(--warn-color); font-weight: bold;' : 'color: var(--muted-color);';
        
        // Puxa o título no idioma correto
        trackerHTML += `<div style="${color}; padding: 3px 0;">${status} ${m.title[lang]}</div>`;
    });
    trackerHTML += `</div>`;

    let missionHTML = `
        <div style="color: var(--info-color); font-weight: bold;">
            [ ${lang === 'en' ? 'MISSION' : 'MISSÃO'} ${currentLesson + 1}/${missions.length} ]
        </div>
        <div style="color: var(--accent-color); font-size: 16px; font-weight: bold; margin-top: 4px;">
            ${lesson.title[lang]}
        </div>
        <div style="color: var(--text-color); margin-top: 6px; line-height: 1.4;">
            ${lesson.instruction[lang].replace(/\n/g, '<br>')}
        </div>
        ${trackerHTML}
        <div style="margin-top: 10px;">
            <button class="hint-btn" onclick="triggerHint()" style="background: transparent; border: 1px solid var(--warn-color); color: var(--warn-color); padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s;">💡 ${lang === 'en' ? 'Get Hint' : 'Ver Dica'}</button>
            <span style="color: var(--muted-color); font-size: 11px; margin-left: 8px;">(${lang === 'en' ? "or type 'hint'" : "ou digite 'hint'"})</span>
        </div>
        <div id="mission-hints"></div>
    `;

    missionPanel.innerHTML = missionHTML;
    missionPanel.style.display = 'flex'; 
    if (typeof scrollBottom === 'function') scrollBottom();
}

window.triggerHint = function() {
    if (!isLearning) return;
    const lesson = missions[currentLesson];
    const hintsContainer = document.getElementById('mission-hints');
    const lang = window.currentLang || 'en';
    
    if (!hintsContainer || currentHintIndex >= 3) return; 
    
    const hintDiv = document.createElement('div');
    hintDiv.className = 'output warn';
    
    const lblHint = lang === 'en' ? 'Hint' : 'Dica';
    const lblSol = lang === 'en' ? 'Solution' : 'Solução';
    const lblType = lang === 'en' ? 'Type' : 'Digite';
    
    if (currentHintIndex === 0) {
        hintDiv.innerHTML = `<strong>💡 ${lblHint} 1:</strong> ${lesson.hints[lang][0]}`;
    } else if (currentHintIndex === 1) {
        hintDiv.innerHTML = `<strong>💡 ${lblHint} 2:</strong> ${lesson.hints[lang][1]}`;
    } else if (currentHintIndex === 2) {
        hintDiv.innerHTML = `<strong>🔑 ${lblSol}:</strong> ${lblType} <span style="color: var(--accent-color);">${lesson.expectedCommand}</span>`;
    }
    
    currentHintIndex++;
    hintsContainer.appendChild(hintDiv);

    // ── NOVO: Faz o painel rolar suavemente para baixo no mobile ──
    const missionPanel = document.getElementById('mission-panel');
    if (missionPanel) {
        // Rola o painel interno de missões
        missionPanel.scrollTo({
            top: missionPanel.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Garante que o terminal principal também acompanhe
    if (typeof scrollBottom === 'function') scrollBottom();
};

// ── Core Engine ──────────────────────────────────────────────────────

function prepareMissionEnvironment(lessonIndex) {
    // 1. Reseta o disco para o estado original (limpa a bagunça)
    if (typeof initFS === 'function') initFS();
    cwd = `/home/${username}`;
    if (envVars) envVars.PWD = cwd;

    // 2. Descobre qual é a missão atual
    const id = missions[lessonIndex].id;

    // 3. Injeta o estado exato necessário para a missão funcionar
    if (id >= 4) { fsMkdir(`${cwd}/project`); }
    if (id === 4) { cwd = `/home/${username}`; } 
    if (id === 5) { cwd = `/home/${username}/project`; } 
    if (id >= 7) { fsTouch(`${cwd}/script.sh`); }
    if (id >= 8 && id <= 9) { fsTouch(`${cwd}/backup.sh`); }
    if (id === 9) { fsTouch(`${cwd}/old_script.sh`); }
    if (id === 11) { fsTouch('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash'); }
    if (id === 12) { fsTouch(`${cwd}/script.sh`); }
    if (id === 13) { fsTouch(`${cwd}/script.sh`, '', '644'); }
    if (id === 14) { fsTouch(`${cwd}/.env`); fsTouch(`${cwd}/.bashrc`); }
    if (id === 15) { fsTouch(`${cwd}/script.sh`); fsMkdir(`${cwd}/project`); }
    if (id === 16 || id === 17) { fsMkdir(`${cwd}/project`); fsTouch(`${cwd}/project/file.txt`); }
    if (id >= 18 && id <= 19) { fsTouch(`${cwd}/server.log`, "INFO booting...\nERROR failed to load\nError database locked\nERROR out of memory"); }
    if (id === 20) { fsMkdir(`${cwd}/deep`); fsMkdir(`${cwd}/deep/folder`); fsTouch(`${cwd}/deep/folder/target.txt`); }
    if (id === 22) { fsTouch(`${cwd}/secret.txt`, '', '644'); }
    if (id === 23) { fsTouch(`${cwd}/run.sh`, '', '644'); }
    if (id === 24) { fsTouch(`${cwd}/report.txt`); }
    if (id >= 25 && id <= 26) { fsTouch(`${cwd}/server.log`, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nLine 11\nLine 12"); }
    if (id === 27 || id === 28) { fsTouch(`${cwd}/status.txt`, "old text\n"); }
    if (id === 34) { fsTouch(`${cwd}/temp.txt`); }
    if (id === 35) { fsTouch(`${cwd}/config.json`, '{"API_KEY": "1234567890"}'); }
    if (id === 37) { fsTouch(`${cwd}/deploy.sh`, '644'); vfs[`${cwd}/deploy.sh`].content = "echo deployed"; }
    if (id === 39) { fsTouch(`/var/log/syslog`, "INTRUSION detected"); fsMkdir(`/var/www`); fsTouch(`/var/www/shell.php`); }
    if (id === 40) { fsTouch(`${cwd}/config.yml`, '', '777'); }

    // Salva o estado injetado no navegador
    if (typeof saveVFS === 'function') saveVFS();
}

function startLearningMode(resumeLesson = -1) {
    if (isLearning && resumeLesson === -1) return `\n[!] Learning Mode is already active. Type 'hint' if you are stuck.\n`;
    
    isLearning = true;
    currentLesson = resumeLesson !== -1 ? resumeLesson : 0;
    currentHintIndex = 0;
    toggleButtonUI(true);
    
    // TROCADO: Usa localStorage para persistir após fechar o navegador
    localStorage.setItem('_403_learning', '1');
    localStorage.setItem('_403_lesson', currentLesson.toString());


    if (resumeLesson === -1 || resumeLesson === 0) {
        addOut(`\n=== LEARNING MODE ACTIVATED ===\nInitializing curriculum...\n[INFO] Your default user is "user" and your password is "user". You might need it later!`, 'info');
    } else {
        addOut(`\n=== LEARNING MODE RESTORED ===\nResuming your mission...`, 'info');
    }
    prepareMissionEnvironment(currentLesson);

    printMission();
    return ''; 
}

function stopLearningMode() {
    isLearning = false;
    toggleButtonUI(false);
    localStorage.removeItem('_403_learning');
    
    const missionPanel = document.getElementById('mission-panel');
    if (missionPanel) {
        missionPanel.style.display = 'none';
        missionPanel.innerHTML = '';
    }
    return `\n=== LEARNING MODE DEACTIVATED ===\nYou have returned to the free terminal.`;
}

function checkLesson(cmdInput, cmdOutput) {
    if (!isLearning) return null;
    const raw = cmdInput.trim();
    if (raw === '') return null;

    if (raw.toLowerCase() === 'hint') {
        window.triggerHint();
        return ''; 
    }

    const lesson = missions[currentLesson];
    const lang = window.currentLang || 'en';
    
    const isMatch = raw === lesson.expectedCommand || (lesson.acceptedCommands && lesson.acceptedCommands.includes(raw));
    
    if (isMatch) {
        const outStr = (cmdOutput || '').toLowerCase();
        if (outStr.includes('permission denied') || outStr.includes('cannot') || outStr.includes('not found') || outStr.includes('error')) {
            return lang === 'en'
                ? `\n[❌] Your command failed:\n${cmdOutput}\nFix the error or permissions to proceed.\n`
                : `\n[❌] Seu comando falhou:\n${cmdOutput}\nCorrija o erro ou as permissões para prosseguir.\n`;
        }

        currentLesson++;
        currentHintIndex = 0; 
        localStorage.setItem('_403_lesson', currentLesson.toString());
        
        let output = `\n[ ✔ ] ${lesson.successMsg[lang]}\n\n`;
        output += `[ ${lang === 'en' ? 'MISSION REPORT' : 'RELATÓRIO DA MISSÃO'} ]\n${lesson.successExplanation[lang]}\n`;
        output += `-------------------------------------------------\n`;
        output += lang === 'en' 
            ? `(Press ENTER to clear the screen and start the next mission)\n`
            : `(Pressione ENTER para limpar a tela e iniciar a próxima missão)\n`; 
        
        if (currentLesson < missions.length) {
            addOut(output, 'ok');
            if (typeof prepareMissionEnvironment === 'function') prepareMissionEnvironment(currentLesson);
            printMission(); 
            window.clearOnNextCommand = true;
            return ''; 
        } else {
            isLearning = false;
            toggleButtonUI(false);
            localStorage.removeItem('_403_learning');
            localStorage.removeItem('_403_lesson');
            showCompletionScreen();
            return ''; 
        }
    } else {
        return lang === 'en'
            ? `\n[❌] Incorrect. Try again or click '💡 Get Hint' (or type 'hint').\n`
            : `\n[❌] Incorreto. Tente novamente ou clique em '💡 Ver Dica' (ou digite 'hint').\n`;
    }
}

function showCompletionScreen() {
    const lang = window.currentLang || 'en';
    
    const tTitle = lang === 'en' ? 'CONGRATULATIONS!' : 'PARABÉNS!';
    const tSub = lang === 'en' ? 'You have successfully completed the _403 Terminal Learning Mode.' : 'Você concluiu o Modo de Aprendizado do Terminal _403 com sucesso.';
    const tLearned = lang === 'en' ? 'You learned:' : 'Você aprendeu:';
    const tReady = lang === 'en' ? 'You are now ready to use the Free Terminal.' : 'Você agora está pronto para usar o Terminal Livre.';
    const tBtn = lang === 'en' ? 'Open Free Terminal →' : 'Abrir Terminal Livre →';
    
    // Lista de aprendizados bilíngue
    const skills = lang === 'en' ? [
        'Navigation & Directories', 'File Management & Permissions', 'Text Manipulation (grep, tail, cat)',
        'Redirections & Piping (>, >>, |)', 'Network & API Fetching (curl)', 'Command Chaining (&&)', 'Terminal Editors (vim, nano)'
    ] : [
        'Navegação & Diretórios', 'Gerenciamento de Arquivos & Permissões', 'Manipulação de Texto (grep, tail, cat)',
        'Redirecionamentos & Pipes (>, >>, |)', 'Rede & APIs (curl)', 'Encadeamento de Comandos (&&)', 'Editores de Terminal (vim, nano)'
    ];

    const overlay = document.createElement('div');
    overlay.id = 'completion-screen';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: var(--bg-color);
        z-index: 3000; display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        padding: 20px; font-family: 'Courier New', Courier, monospace;
        text-align: center;
    `;

    overlay.innerHTML = `
        <div style="max-width: 500px; border: 2px solid var(--accent-color); padding: 40px; border-radius: 8px; background-color: rgba(0,0,0,0.6); box-shadow: 0 0 25px rgba(80, 250, 123, 0.2);">
            <div style="font-size: 50px; margin-bottom: 10px;">🎉</div>
            <h1 style="color: var(--accent-color); margin-bottom: 10px; font-size: 28px;">${tTitle}</h1>
            <p style="color: var(--text-color); margin-bottom: 25px; font-size: 15px;">${tSub}</p>
            
            <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <div style="color: var(--info-color); font-weight: bold; margin-bottom: 12px; font-size: 16px;">${tLearned}</div>
                <div style="color: var(--text-color); line-height: 1.8; font-size: 14px;">
                    ${skills.map(s => `<span style="color: var(--accent-color);">✓</span> ${s}`).join('<br>')}
                </div>
            </div>
            
            <p style="color: var(--warn-color); margin-bottom: 25px; font-weight: bold;">${tReady}</p>
            
            <button id="btn-free-terminal" style="
                background: var(--accent-color);
                color: #000;
                border: none;
                padding: 14px 28px;
                font-size: 16px;
                font-family: inherit;
                font-weight: bold;
                cursor: pointer;
                border-radius: 4px;
                transition: transform 0.2s, box-shadow 0.2s;
            ">${tBtn}</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById('btn-free-terminal');
    btn.addEventListener('mouseover', () => { btn.style.boxShadow = '0 0 15px var(--accent-color)'; btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseout', () => { btn.style.boxShadow = 'none'; btn.style.transform = 'scale(1)'; });

    btn.addEventListener('click', () => {
        overlay.remove();
        const missionPanel = document.getElementById('mission-panel');
        if (missionPanel) { missionPanel.style.display = 'none'; missionPanel.innerHTML = ''; }

        // Esconde o botão de idiomas
        const langBtn = document.getElementById('menu-lang-toggle');
        if (langBtn) langBtn.classList.remove('show-lang');

        const terminal = document.getElementById('terminal');
        if (terminal) terminal.innerHTML = '';
        if (typeof addOut === 'function') addOut(lang === 'en' ? '\n[SYSTEM] Welcome back to the Free Terminal! Type "help" to explore.' : '\n[SISTEMA] Bem-vindo de volta ao Terminal Livre! Digite "help" para explorar.', 'info');
        if (typeof newLine === 'function') newLine();
    });
}