# Manual de Instalação - Sistema PontoCerto

Este guia foi criado para ajudar você a instalar o sistema PontoCerto em um computador com Windows 10 do zero.

## 1. Requisitos Iniciais
Antes de começar, você precisará baixar e instalar duas ferramentas básicas:

1.  **Node.js**: Acesse [nodejs.org](https://nodejs.org/) e baixe a versão **LTS** (Recomendada para a maioria dos usuários). Siga as instruções de instalação padrão (clique em "Next" até o fim).
2.  **Git**: Acesse [git-scm.com](https://git-scm.com/) e baixe a versão para Windows. Instale com as opções padrão.

## 2. Preparando os Arquivos do Sistema
1.  Abra a pasta onde você deseja manter o sistema.
2.  Clique com o botão direito em um espaço vazio e selecione **"Git Bash Here"** ou abra o **Prompt de Comando (CMD)**.
3.  Digite o comando para baixar o sistema (ou apenas extraia os arquivos se você já os tiver em um arquivo .zip).

## 3. Instalando o Sistema
1.  Dentro da pasta do sistema, clique na barra de endereços da pasta lá no topo, digite `cmd` e aperte **Enter**.
2.  Na tela preta que abrir, digite o seguinte comando e aperte Enter:
    ```bash
    npm install
    ```
    *Aguarde alguns minutos. Isso vai baixar todas as peças necessárias para o sistema funcionar.*

## 4. Configurando o Banco de Dados
O sistema utiliza um banco de dados local automático. Para preparar ele, digite:
```bash
npm run db:push
```

## 5. Como Iniciar o Sistema
Sempre que quiser ligar o sistema, faça o seguinte:
1.  Abra a pasta do sistema.
2.  Abra o **CMD** (como ensinado no passo 3).
3.  Digite:
    ```bash
    npm run dev
    ```
4.  O sistema dirá que está rodando. Abra seu navegador (Chrome ou Edge) e digite:
    `http://localhost:5000`

## 6. Acesso Inicial
*   **Usuário**: admin
*   **Senha**: admin

---
**Dica**: Para que outras pessoas na sua rede local acessem o sistema, use o endereço de IP do seu computador (ex: `http://192.168.1.10:5000`).