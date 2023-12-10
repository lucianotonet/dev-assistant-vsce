##  Instruções detalhadas para implementar a funcionalidade de "diffs" com pequenos trechos de código na sua extensão do Visual Studio Code

1. Primeiro, você precisará importar os módulos necessários. Adicione as seguintes linhas no topo do seu arquivo src/extension.ts:
```ts
  import * as vscode from 'vscode';
  import * as fs from 'fs';
  import * as os from 'os';
  import * as path from 'path';
```

2. Em seguida, crie uma função para criar um arquivo temporário com o conteúdo fornecido:

```ts
function createTempFile(contents: string): string {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'tempFile');
    fs.writeFileSync(tempFilePath, contents);
    return tempFilePath;
}
```

3. Agora, você pode criar uma função para comparar dois trechos de código. Esta função criará dois arquivos temporários com os trechos de código e abrirá um editor de diferenças para compará-los:


```ts
function compareSnippets(snippet1: string, snippet2: string) {
    let uri1 = vscode.Uri.file(createTempFile(snippet1));
    let uri2 = vscode.Uri.file(createTempFile(snippet2));

    vscode.commands.executeCommand('vscode.diff', uri1, uri2, 'Título da Comparação');
}
```

4. Finalmente, você pode usar a função compareSnippets para comparar dois trechos de código. Por exemplo:

```ts
let snippet1 = '...'; // Trecho de código 1
let snippet2 = '...'; // Trecho de código 2

compareSnippets(snippet1, snippet2);
```

Por favor, substitua '...' pelos trechos de código que você deseja comparar.

