# Página comercial, planos e WhatsApp

## Objetivo
Transformar a página inicial do KargaRadar em uma apresentação clara para transportadoras, mantendo a consulta de cargas acessível e adicionando o compartilhamento de status pelo WhatsApp.

## Alterações
- Criar uma página inicial comercial com explicação do fluxo, benefícios e os três planos: Básico (R$ 49,90), Profissional (R$ 69,90) e Completo (R$ 89,90).
- Criar uma página separada para rastreamento público, preservando os modos atuais de consulta e a escolha da transportadora.
- Atualizar a navegação com acessos claros para rastrear, entrar e começar o cadastro.
- Adicionar uma ação de WhatsApp em cada entrega no painel, abrindo uma mensagem pronta com código, status, rota e previsão; o usuário escolhe o contato no WhatsApp.
- Manter a cobrança desativada: os botões dos planos levam ao cadastro, sem pagamento automático nesta etapa.
- Ajustar metadados das páginas e verificar em tela grande e celular.

## Detalhes técnicos
- Usar rotas independentes `/` e `/rastrear`.
- Usar links oficiais `wa.me` sem armazenar telefone do cliente, pois os dados atuais não possuem esse campo.
- Não alterar permissões, separação de dados entre transportadoras ou regras de aprovação.
