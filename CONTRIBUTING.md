# Contribuindo para o ND Express

Obrigado por considerar contribuir para o ND Express! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### Reportando Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/nd-express/issues)
2. Se não encontrar, crie uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Informações do ambiente (browser, OS, etc.)

### Sugerindo Melhorias

1. Abra uma issue com a tag `enhancement`
2. Descreva claramente a melhoria proposta
3. Explique por que seria útil para o projeto
4. Forneça exemplos de uso, se possível

### Contribuindo com Código

#### Configuração do Ambiente

1. Fork o repositório
2. Clone seu fork:
   ```bash
   git clone https://github.com/seu-usuario/nd-express.git
   cd nd-express
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente (veja README.md)

#### Fluxo de Desenvolvimento

1. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```
2. Faça suas alterações
3. Teste suas mudanças:
   ```bash
   npm run test
   npm run lint
   ```
4. Commit suas alterações:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
5. Push para sua branch:
   ```bash
   git push origin feature/nome-da-feature
   ```
6. Abra um Pull Request

## 📝 Padrões de Código

### Estilo de Código

- Use Prettier para formatação: `npm run format`
- Siga as regras do ESLint: `npm run lint`
- Use nomes descritivos para variáveis e funções
- Adicione comentários para lógica complexa

### Commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` para novas funcionalidades
- `fix:` para correções de bugs
- `docs:` para mudanças na documentação
- `style:` para formatação de código
- `refactor:` para refatoração
- `test:` para testes
- `chore:` para tarefas de manutenção

### Pull Requests

- Use um título descritivo
- Descreva as mudanças realizadas
- Referencie issues relacionadas
- Inclua screenshots para mudanças visuais
- Certifique-se que todos os testes passam

## 🧪 Testes

### Executando Testes

```bash
npm run test        # Executar todos os testes
npm run test:watch  # Executar em modo watch
npm run lint        # Verificar qualidade do código
```

### Escrevendo Testes

- Escreva testes para novas funcionalidades
- Mantenha cobertura de testes alta
- Use nomes descritivos para os testes
- Teste casos de sucesso e erro

## 📚 Documentação

- Atualize o README.md se necessário
- Documente novas APIs ou funcionalidades
- Use comentários JSDoc para funções públicas
- Mantenha a documentação atualizada

## 🔒 Segurança

- Nunca commite chaves de API ou senhas
- Use variáveis de ambiente para dados sensíveis
- Reporte vulnerabilidades de segurança privadamente
- Siga as melhores práticas de segurança

## 📋 Checklist para Pull Requests

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits seguem o padrão conventional
- [ ] Não há conflitos de merge
- [ ] CI/CD está passando

## 🤝 Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mantenha discussões técnicas e profissionais

## 📞 Dúvidas?

Se tiver dúvidas sobre como contribuir:

1. Verifique a documentação existente
2. Procure em issues fechadas
3. Abra uma nova issue com a tag `question`
4. Entre em contato através das issues do GitHub

---

**Obrigado por contribuir para o ND Express! 🚀**
