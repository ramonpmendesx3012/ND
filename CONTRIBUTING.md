# Contribuindo para o ND Express

🎉 Obrigado por considerar contribuir para o ND Express! 🎉

Este documento fornece diretrizes e informações sobre como contribuir para o
projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente de Desenvolvimento](#configuração-do-ambiente-de-desenvolvimento)
- [Processo de Contribuição](#processo-de-contribuição)
- [Diretrizes de Código](#diretrizes-de-código)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## 📜 Código de Conduta

Este projeto adere ao
[Código de Conduta do Contributor Covenant](https://www.contributor-covenant.org/).
Ao participar, você deve seguir este código.

## 🤝 Como Posso Contribuir?

### Tipos de Contribuição

- 🐛 **Reportar bugs**
- 💡 **Sugerir melhorias**
- 📝 **Melhorar documentação**
- 🔧 **Corrigir bugs**
- ✨ **Implementar novas funcionalidades**
- 🧪 **Escrever testes**
- 🎨 **Melhorar UI/UX**

### Áreas que Precisam de Ajuda

- [ ] Testes automatizados
- [ ] Documentação da API
- [ ] Internacionalização (i18n)
- [ ] Acessibilidade (a11y)
- [ ] Performance optimization
- [ ] Mobile responsiveness

## 🛠️ Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- Git
- Conta no Supabase
- Chave da API OpenAI

### Configuração

1. **Fork o repositório**

   ```bash
   # Clique em "Fork" no GitHub
   ```

2. **Clone seu fork**

   ```bash
   git clone https://github.com/SEU_USERNAME/ND.git
   cd ND
   ```

3. **Configure o remote upstream**

   ```bash
   git remote add upstream https://github.com/ramonpmendesx3012/ND.git
   ```

4. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais
   ```

5. **Instale dependências**

   ```bash
   npm install
   ```

6. **Execute o projeto**
   ```bash
   npm run dev
   ```

## 🔄 Processo de Contribuição

### 1. Antes de Começar

- Verifique se já existe uma issue relacionada
- Se não existir, crie uma issue descrevendo o problema/melhoria
- Aguarde feedback antes de começar a implementar

### 2. Desenvolvimento

1. **Crie uma branch**

   ```bash
   git checkout -b feature/nome-da-feature
   # ou
   git checkout -b fix/nome-do-bug
   ```

2. **Faça suas alterações**
   - Siga as [diretrizes de código](#diretrizes-de-código)
   - Escreva commits descritivos
   - Teste suas alterações

3. **Commit suas mudanças**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade X"
   ```

### 3. Enviando a Contribuição

1. **Atualize sua branch**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push para seu fork**

   ```bash
   git push origin feature/nome-da-feature
   ```

3. **Crie um Pull Request**
   - Vá para o GitHub e clique em "New Pull Request"
   - Preencha o template de PR
   - Aguarde review

## 📝 Diretrizes de Código

### JavaScript

- Use ES6+ features
- Prefira `const` e `let` ao invés de `var`
- Use arrow functions quando apropriado
- Mantenha funções pequenas e focadas
- Use nomes descritivos para variáveis e funções

### HTML

- Use HTML5 semântico
- Mantenha a estrutura acessível
- Use atributos `alt` em imagens
- Valide o HTML

### CSS

- Use metodologia BEM para classes
- Prefira Flexbox/Grid ao invés de floats
- Use variáveis CSS para cores e espaçamentos
- Mantenha responsividade mobile-first

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: mudanças de formatação
refactor: refatora código sem mudar funcionalidade
test: adiciona ou modifica testes
chore: mudanças em ferramentas/configuração
```

## 🐛 Reportando Bugs

### Antes de Reportar

- Verifique se o bug já foi reportado
- Teste na versão mais recente
- Verifique se não é um problema de configuração

### Como Reportar

1. Use o template de issue para bugs
2. Inclua informações do ambiente:
   - OS e versão
   - Browser e versão
   - Versão do Node.js
3. Descreva passos para reproduzir
4. Inclua screenshots se relevante
5. Adicione logs de erro

### Template de Bug Report

```markdown
**Descrição do Bug** Descrição clara e concisa do bug.

**Passos para Reproduzir**

1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado** Descrição do que deveria acontecer.

**Screenshots** Se aplicável, adicione screenshots.

**Ambiente:**

- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Versão: [e.g. 1.0.0]

**Contexto Adicional** Qualquer outra informação relevante.
```

## 💡 Sugerindo Melhorias

### Antes de Sugerir

- Verifique se a melhoria já foi sugerida
- Considere se a melhoria se alinha com os objetivos do projeto
- Pense na implementação e complexidade

### Como Sugerir

1. Use o template de issue para melhorias
2. Descreva o problema que a melhoria resolve
3. Descreva a solução proposta
4. Considere alternativas
5. Adicione mockups se relevante

## 🧪 Testes

### Executando Testes

```bash
# Testes de sintaxe
npm test

# Testes manuais
npm run dev
# Teste funcionalidades no browser
```

### Escrevendo Testes

- Teste casos de sucesso e falha
- Use dados de teste realistas
- Mantenha testes independentes
- Documente casos de teste complexos

## 📚 Documentação

### Atualizando Documentação

- Mantenha README.md atualizado
- Documente novas funcionalidades
- Atualize comentários no código
- Inclua exemplos de uso

### Escrevendo Documentação

- Use linguagem clara e simples
- Inclua exemplos práticos
- Mantenha consistência de formato
- Revise ortografia e gramática

## 🎨 UI/UX

### Diretrizes de Design

- Mantenha consistência visual
- Priorize acessibilidade
- Use design responsivo
- Teste em diferentes dispositivos
- Siga princípios de usabilidade

## 📞 Suporte

### Onde Buscar Ajuda

- 📖 [Documentação](README.md)
- 🐛 [Issues](https://github.com/ramonpmendesx3012/ND/issues)
- 💬 [Discussions](https://github.com/ramonpmendesx3012/ND/discussions)

### Contato

- Email: [seu-email@exemplo.com]
- GitHub: [@ramonpmendesx3012](https://github.com/ramonpmendesx3012)

## 🏆 Reconhecimento

Todos os contribuidores serão reconhecidos no README.md e releases.

### Hall da Fama

<!-- Contribuidores serão listados aqui -->

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a
[Licença MIT](LICENSE).

---

**Obrigado por contribuir! 🚀**

_Juntos, tornamos o ND Express ainda melhor!_
