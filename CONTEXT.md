# Habitica MCP — Contexto de domínio

Este arquivo fixa a linguagem ubíqua do projeto: termos, anti-termos e limites do domínio.
Use estes nomes em código, tools, docs e conversas com agentes.

## Limites do domínio

- O Habitica é a camada de **execução diária** e compromisso pessoal (hábitos, diárias, afazeres, recompensas).
- Planejamento de projeto, backlog, histórico e priorização de produto ficam fora do Habitica (Obsidian, GitHub Issues, Azure Boards, Jira, etc.).
- O MCP **não** transforma o Habitica em gerenciador de projeto.
- `Planejamento do dia` seleciona itens explícitos para o dia; **não** importa backlog completo de projeto.
- Credenciais e segredos nunca entram em notas, logs, exemplos ou testes.

## Glossário

**Item de execução**  
Unidade de compromisso diário que um agente pode consultar, criar ou concluir no Habitica para apoiar a execução pessoal.  
_Evitar_: tarefa, task, item de backlog

**Task do Habitica**  
Objeto externo da API do Habitica que representa `habit`, `daily`, `todo` ou `reward`.  
_Evitar_: tarefa do projeto, item de sprint

**Afazer**  
Item de execução único no Habitica, mapeado para o tipo `todo`.  
_Evitar_: tarefa de backlog

**Diária**  
Item de execução recorrente no Habitica, mapeado para o tipo `daily`.  
_Evitar_: rotina genérica

**Hábito**  
Item de execução comportamental no Habitica, mapeado para o tipo `habit`.  
_Evitar_: meta, rotina

**Recompensa**  
Item de execução usado como troca motivacional no Habitica, mapeado para o tipo `reward`.  
_Evitar_: prêmio de projeto

**Planejamento do dia**  
Seleção de itens de execução que devem entrar no Habitica para orientar a execução diária.  
_Evitar_: backlog do projeto, roadmap
