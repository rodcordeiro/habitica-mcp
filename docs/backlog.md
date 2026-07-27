# Roadmap do MVP — Habitica MCP

## Ideia central

Criar um servidor MCP em TypeScript que interage com o Habitica via API, permitindo que agentes consultem, criem e atualizem itens de execução do Habitica como camada de execução diária.

A proposta é parecida com o papel do `pshabitica`, mas voltada para uso por agentes e automações: o Habitica continua sendo o lugar de compromisso pessoal e rotina, enquanto projetos, backlog e histórico permanecem em ferramentas apropriadas (Obsidian, GitHub Issues, Azure Boards, Jira, etc.).

Linguagem de domínio: ver [CONTEXT.md](../CONTEXT.md).

## Conceitos primários

- Integração com a API do Habitica usando credenciais configuradas fora do repositório.
- Ferramentas MCP para listar, criar, atualizar e concluir hábitos, diárias, afazeres e recompensas.
- Comandos de apoio para montar uma lista de tarefas do dia a partir de um projeto, sem transformar o Habitica em gerenciador de projeto.
- Separação clara entre planejamento de projeto e execução diária.
- Operações seguras por padrão: nunca registrar tokens, cookies, Authorization Bearer, payloads sensíveis ou credenciais em notas, logs, exemplos ou testes.

## Status do projeto

Implementação em andamento.

- **Concluído:** Sprint 1–4 (leitura, robustez, preview e criação confirmada de afazer).
- **MVP amplo:** Incrementos 1–6 (todo este backlog), entrega faseada.
- **MVP mínimo validável:** Incremento 1 (Sprints 1–2) — leitura ponta a ponta.
- Stack: Node.js, TypeScript, `@modelcontextprotocol/sdk`, transporte stdio, pnpm.
- Distribuição prevista: plugins `habitica-rpg` para **Codex** e **Cursor**, ambos empacotando a mesma skill + servidor MCP.

## Decisões de recorte

- O MVP amplo cobre leitura, escrita segura, planejamento do dia, ações de execução, operação/distribuição e empacotamento em plugins Codex e Cursor (skill + MCP).
- O primeiro entregável validável é somente leitura (Incremento 1).
- O conceito interno do MCP é `Item de execução`.
- `Task do Habitica` é tratado como conceito externo da API.
- Credenciais ficam somente em variáveis de ambiente no MVP.
- Escrita entra apenas depois da leitura ponta a ponta.
- A primeira escrita será criar afazer (`todo`), com `preview` por padrão e `confirm: true` para executar.
- A ferramenta de planejamento do dia fica fora do MVP mínimo e entra no Incremento 3.
- A skill ensina quando/como usar cada tool MCP e os limites de domínio; os plugins Codex e Cursor instalam skill + MCP juntos.
- O código/build do MCP é compartilhado (`scripts/habitica-mcp/`); cada plugin só declara manifesto + apontamento MCP + skill (conteúdo único, copiado ou linkado).
- Credenciais nunca vão no repositório: Codex via `${...}` no `.mcp.json`; Cursor via `variables` no manifesto + `${...}` no `mcp.json` (valores em Plugins → Configure).
- Glossário e limites de domínio vivem apenas em `CONTEXT.md` (não duplicar no backlog; a skill referencia o CONTEXT).

## Backlog

### Incremento 1 — MVP mínimo validável (somente leitura)

Objetivo: provar que um agente consegue consultar o Habitica por MCP com autenticação segura, contrato claro e saída normalizada.

#### Sprint 1 — Leitura ponta a ponta

**Status:** Concluída (2026-07-27)

Menor entregável validável: uma tool MCP lista itens de execução do Habitica por tipo e retorna JSON normalizado sem expor credenciais.

1. Criar o esqueleto do servidor MCP com uma tool `habitica_list_items`.
2. Ler `HABITICA_USER_ID`, `HABITICA_API_TOKEN` e `HABITICA_X_CLIENT` a partir de variáveis de ambiente.
3. Implementar cliente HTTP autenticado para a API do Habitica usando `x-api-user`, `x-api-key` e `x-client`.
4. Mapear a resposta da API para `Item de execução` com campos mínimos: `id`, `tipo`, `titulo`, `notas`, `dificuldade`, `ativo`.
5. Validar manualmente a tool listando `habits`, `dailies`, `todos` e `rewards`.

Critério de aceite: com variáveis válidas, a tool retorna itens reais; com variáveis ausentes, falha cedo com erro claro e sem imprimir segredos.

#### Sprint 2 — Robustez de leitura

**Status:** Concluída (2026-07-27)

Menor entregável validável: a leitura continua previsível diante de filtros, erros comuns e respostas inesperadas.

1. Adicionar filtros opcionais por tipo de item e status arquivado/ativo, conforme suporte da API.
2. Padronizar erros de autenticação, rede, rate limit e resposta inválida.
3. Criar testes automatizados do mapeamento de `Task do Habitica` para `Item de execução`.
4. Criar testes automatizados de configuração ausente e mascaramento de segredos.
5. Documentar uso local da tool somente leitura com exemplos sem credenciais reais.

Critério de aceite: os testes cobrem mapeamento e erros principais, e a documentação permite validar a leitura sem registrar dados sensíveis.

### Incremento 2 — Escrita segura de afazeres

Objetivo: permitir que agentes criem afazeres no Habitica sem executar mudanças por acidente.

#### Sprint 3 — Preview de criação de afazer

**Status:** Concluída (2026-07-27)

Menor entregável validável: uma tool recebe campos explícitos de um afazer e devolve o preview do payload que seria enviado, sem chamar a API de escrita.

1. Criar a tool `habitica_preview_todo`.
2. Definir contrato de entrada para `titulo`, `notas`, `dificuldade`, `data_limite` e `tags`.
3. Validar campos obrigatórios, tamanhos e valores permitidos antes de montar o payload.
4. Normalizar dificuldade entre linguagem do MCP e valores aceitos pela API.
5. Testar o preview com casos válidos, campos ausentes e valores inválidos.

Critério de aceite: a tool mostra exatamente o que seria criado, sem fazer chamada de escrita ao Habitica.

#### Sprint 4 — Criação confirmada de afazer

**Status:** Concluída (2026-07-27)

Menor entregável validável: a tool cria um `todo` real somente quando `confirm: true` e retorna o item criado normalizado.

1. Criar a tool `habitica_create_todo` reutilizando a validação do preview.
2. Exigir `confirm: true` para executar a chamada de criação.
3. Retornar preview quando `confirm` estiver ausente ou falso.
4. Mapear a resposta de criação para `Item de execução`.
5. Adicionar testes para modo preview, modo confirmado e falhas da API.

Critério de aceite: a criação real só ocorre com confirmação explícita; sem confirmação, nenhuma escrita é executada.

### Incremento 3 — Planejamento do dia

Objetivo: transformar uma lista decidida de trabalho diário em afazeres do Habitica sem assumir o gerenciamento do projeto.

#### Sprint 5 — Preview de planejamento do dia

Menor entregável validável: a tool recebe uma lista de itens planejados e devolve um lote de afazeres que poderia ser criado no Habitica.

1. Criar a tool `habitica_preview_day_plan`.
2. Definir entrada como lista explícita de itens com título, notas, origem e prioridade.
3. Gerar afazeres com marcador de origem, sem importar backlog completo de projeto.
4. Validar limite máximo de itens por chamada para evitar criação excessiva.
5. Testar duplicidades simples e itens inválidos.

Critério de aceite: o agente consegue revisar um plano do dia antes de criar qualquer item no Habitica.

#### Sprint 6 — Criação confirmada do plano do dia

Menor entregável validável: a tool cria um lote pequeno de afazeres somente com confirmação explícita.

1. Criar a tool `habitica_create_day_plan`.
2. Exigir `confirm: true` para criação em lote.
3. Implementar resultado parcial com itens criados, itens rejeitados e erros por item.
4. Evitar duplicação óbvia quando título e origem coincidirem em itens ativos existentes.
5. Documentar o fluxo recomendado: projeto fora do Habitica, execução diária dentro do Habitica.

Critério de aceite: um plano pequeno do dia pode ser criado com rastreabilidade básica e sem duplicar itens ativos evidentes.

### Incremento 4 — Ações de execução controladas

Objetivo: permitir concluir ou pontuar itens com proteções explícitas, depois que leitura e criação estiverem estáveis.

#### Sprint 7 — Concluir afazeres

Menor entregável validável: a tool conclui um `todo` específico somente com confirmação explícita.

1. Criar a tool `habitica_complete_todo`.
2. Exigir `id` do item e `confirm: true`.
3. Validar se o item existe e se é um `todo` antes de concluir.
4. Retornar estado anterior e resultado normalizado da operação.
5. Testar conclusão, item inexistente, tipo incorreto e ausência de confirmação.

Critério de aceite: apenas afazeres são concluídos, e nenhuma pontuação ocorre sem confirmação explícita.

#### Sprint 8 — Pontuar hábitos e diárias

Menor entregável validável: tools pontuam `habit` ou `daily` com confirmação e direção explícita quando aplicável.

1. Criar tool para pontuar `habit` com direção `up` ou `down`.
2. Criar tool para concluir ou desfazer `daily`, conforme suporte seguro da API.
3. Exigir confirmação explícita em todas as operações que alterem progresso.
4. Adicionar mensagens de risco para operações que impactam vida, ouro, experiência ou streak.
5. Testar operações permitidas, proibidas e erros da API.

Critério de aceite: alterações de progresso ficam disponíveis, mas sempre exigem intenção clara do agente/usuário.

### Incremento 5 — Operação e distribuição

Objetivo: preparar o MCP para uso recorrente sem depender de conhecimento tribal.

#### Sprint 9 — Documentação operacional

Menor entregável validável: um usuário consegue instalar, configurar e validar o MCP localmente seguindo a documentação.

1. Documentar instalação, variáveis de ambiente e execução local.
2. Documentar políticas de segurança para credenciais e logs.
3. Adicionar exemplos de chamadas MCP sem dados reais.
4. Criar checklist de validação manual com leitura, preview e escrita confirmada.
5. Registrar limites conhecidos da integração com Habitica.

Critério de aceite: a documentação permite validar o fluxo completo sem expor tokens ou depender de explicação oral.

#### Sprint 10 — Qualidade de entrega

Menor entregável validável: o projeto tem comandos padronizados de verificação e uma versão candidata local.

1. Padronizar scripts de lint, test e build.
2. Garantir que testes não dependam de API real por padrão.
3. Criar configuração de exemplo sem segredos.
4. Preparar empacotamento ou instruções de consumo local do MCP.
5. Criar checklist de release com rollback simples: desativar MCP e revogar token se necessário.

Critério de aceite: uma versão candidata pode ser validada localmente com testes offline e checklist operacional.

### Incremento 6 — Skill e plugins (Codex + Cursor)

Objetivo: ensinar agentes a usar cada tool do MCP com segurança e distribuir skill + MCP como plugins instaláveis no **Codex** e no **Cursor**, reutilizando o mesmo núcleo MCP e o mesmo conteúdo de skill.

Estrutura-alvo (dois wrappers, um núcleo):

```text
plugins/
  habitica-rpg-codex/
    .codex-plugin/
      plugin.json
    .mcp.json
    skills/
      habitica-rpg/
        SKILL.md
    scripts/
      habitica-mcp/
    assets/
  habitica-rpg-cursor/
    .cursor-plugin/
      plugin.json
    mcp.json
    skills/
      habitica-rpg/
        SKILL.md
    scripts/
      habitica-mcp/
    assets/
    README.md
```

Mapeamento Codex ↔ Cursor:

| Peça      | Codex                         | Cursor                                              |
| --------- | ----------------------------- | --------------------------------------------------- |
| Manifesto | `.codex-plugin/plugin.json`   | `.cursor-plugin/plugin.json`                        |
| MCP       | `.mcp.json`                   | `mcp.json`                                          |
| Skills    | `skills/*/SKILL.md`           | `skills/*/SKILL.md`                                 |
| Segredos  | `${HABITICA_*}` no env do MCP | `variables` + `${HABITICA_*}` (Plugins → Configure) |
| Validação | `validate_plugin.py`          | `~/.cursor/plugins/local` + checklist marketplace   |

#### Sprint 11 — Skill de uso das tools MCP

Menor entregável validável: uma skill `habitica-rpg` descreve quando acionar o MCP, como interagir com cada tool e quais anti-padrões evitar — conteúdo portável para Codex e Cursor.

1. Criar `skills/habitica-rpg/SKILL.md` com frontmatter (`name`, `description`) e gatilhos de uso.
2. Documentar o fluxo recomendado: leitura → preview → confirmação explícita → escrita.
3. Descrever cada tool MCP (entrada, saída, quando usar, quando não usar):
   - `habitica_list_items`
   - `habitica_preview_todo` / `habitica_create_todo`
   - `habitica_preview_day_plan` / `habitica_create_day_plan`
   - `habitica_complete_todo`
   - tools de pontuação de `habit` / `daily`
4. Explicitar limites de domínio: Habitica ≠ backlog de projeto; nunca logar credenciais/tokens/cookies/`Authorization`.
5. Incluir exemplos de prompts e sequências de chamada sem dados sensíveis reais.
6. Alinhar a skill com `CONTEXT.md` (termos e anti-termos).
7. Manter uma **fonte única** da skill (ou script de sincronização) para os wrappers Codex e Cursor.

Critério de aceite: um agente (Codex ou Cursor) que carrega a skill consegue escolher a tool correta, exigir `confirm: true` em escritas e recusar tratar o Habitica como gerenciador de projeto.

#### Sprint 12 — Plugins Codex e Cursor (skill + MCP)

Menor entregável validável: instalar o plugin em Codex **ou** em Cursor disponibiliza a skill e o MCP juntos, sem segredos no repositório, com o mesmo build do servidor.

1. Empacotar ou referenciar o build do MCP em `scripts/habitica-mcp/` (núcleo compartilhado).
2. **Codex**
   1. Scaffold com o criador oficial, por exemplo:
      `python .../plugin-creator/scripts/create_basic_plugin.py habitica-rpg --with-skills --with-mcp --with-scripts --with-marketplace`
   2. Configurar `.codex-plugin/plugin.json` com `skills`, `mcpServers` e metadados de interface.
   3. Configurar `.mcp.json` apontando para o build e injetando `HABITICA_USER_ID`, `HABITICA_API_TOKEN`, `HABITICA_X_CLIENT` via `${...}`.
   4. Validar com `validate_plugin.py` (sem placeholders `[TODO]`).
3. **Cursor**
   1. Criar `.cursor-plugin/plugin.json` (`name`: `habitica-rpg`) com `variables` para as três credenciais Habitica.
   2. Criar `mcp.json` na raiz do plugin com `command`/`args` para o build e `env` usando `${HABITICA_USER_ID}`, `${HABITICA_API_TOKEN}`, `${HABITICA_X_CLIENT}`.
   3. Incluir `skills/habitica-rpg/SKILL.md` (mesma fonte da Sprint 11).
   4. Validar localmente: copiar/symlink em `~/.cursor/plugins/local/habitica-rpg`, reload, skill descoberta, tools MCP listáveis, variáveis em Plugins → Configure.
4. Documentar no README instalação Codex, instalação Cursor, atualização e rollback (desinstalar plugin + revogar token).
5. Checklist manual cruzado: leitura via MCP nos dois hosts; escrita só com `confirm: true`; nenhum segredo em logs/exemplos.

Critério de aceite: nos dois hosts, instalar o plugin disponibiliza skill + MCP; credenciais só por env/variables do usuário; validações Codex e Cursor passam; o núcleo MCP permanece único.
