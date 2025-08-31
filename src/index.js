// Ponto de entrada da aplicação ND Express
// Este arquivo inicializa a aplicação e carrega todos os recursos necessários

// Importar estilos
import './assets/styles/global.css';
import './assets/styles/components.css';

// Importar aplicação principal
import App from './App.js';

// Configuração global
const CONFIG = {
  APP_NAME: 'ND Express',
  VERSION: '2.0.0',
  ENVIRONMENT: 'production'
};

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
  try {
    console.log(`🚀 Inicializando ${CONFIG.APP_NAME} v${CONFIG.VERSION}`);
    
    // Verificar se o DOM está pronto
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Verificar dependências necessárias
    await checkDependencies();
    
    // Configurar service worker (se disponível)
    await registerServiceWorker();
    
    // Inicializar aplicação principal
    const app = new App();
    await app.init();
    
    // Configurar handlers globais
    setupGlobalHandlers();
    
    console.log(`✅ ${CONFIG.APP_NAME} inicializado com sucesso`);
    
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    showErrorScreen(error);
  }
}

/**
 * Verifica se todas as dependências necessárias estão disponíveis
 */
async function checkDependencies() {
  const dependencies = [
    { name: 'ExcelJS', check: () => typeof ExcelJS !== 'undefined' },
    { name: 'Fetch API', check: () => typeof fetch !== 'undefined' },
    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
    { name: 'Local Storage', check: () => typeof localStorage !== 'undefined' }
  ];
  
  const missing = dependencies.filter(dep => !dep.check());
  
  if (missing.length > 0) {
    throw new Error(`Dependências não encontradas: ${missing.map(d => d.name).join(', ')}`);
  }
  
  console.log('✅ Todas as dependências verificadas');
}

/**
 * Registra o service worker para funcionalidade PWA
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', registration.scope);
    } catch (error) {
      console.warn('⚠️ Falha ao registrar Service Worker:', error);
    }
  } else {
    console.warn('⚠️ Service Worker não suportado neste navegador');
  }
}

/**
 * Configura handlers globais para a aplicação
 */
function setupGlobalHandlers() {
  // Handler para erros não capturados
  window.addEventListener('error', (event) => {
    console.error('❌ Erro global capturado:', event.error);
    showNotification('Ocorreu um erro inesperado', 'error');
  });
  
  // Handler para promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
    showNotification('Erro de operação assíncrona', 'error');
    event.preventDefault();
  });
  
  // Handler para mudanças de conectividade
  window.addEventListener('online', () => {
    showNotification('Conexão restaurada', 'success');
  });
  
  window.addEventListener('offline', () => {
    showNotification('Sem conexão com a internet', 'warning');
  });
  
  // Handler para visibilidade da página
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 Aplicação voltou ao foco');
    } else {
      console.log('📱 Aplicação perdeu o foco');
    }
  });
  
  // Prevenir zoom com Ctrl+Scroll (opcional)
  document.addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });
  
  // Atalhos de teclado globais
  document.addEventListener('keydown', (event) => {
    // Ctrl+R ou F5 - Recarregar
    if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
      if (confirm('Deseja recarregar a aplicação? Dados não salvos serão perdidos.')) {
        window.location.reload();
      } else {
        event.preventDefault();
      }
    }
    
    // F11 - Tela cheia
    if (event.key === 'F11') {
      event.preventDefault();
      toggleFullscreen();
    }
    
    // Esc - Fechar modais/overlays
    if (event.key === 'Escape') {
      const overlay = document.querySelector('.loading-overlay, .modal-overlay');
      if (overlay && overlay.style.display !== 'none') {
        // Permitir que componentes específicos tratem o ESC
        const escEvent = new CustomEvent('escape-pressed');
        document.dispatchEvent(escEvent);
      }
    }
  });
}

/**
 * Alterna modo tela cheia
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('Não foi possível entrar em tela cheia:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

/**
 * Mostra uma notificação simples
 */
function showNotification(message, type = 'info') {
  // Remover notificação anterior
  const existing = document.querySelector('.global-notification');
  if (existing) {
    existing.remove();
  }
  
  // Criar nova notificação
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} global-notification`;
  notification.textContent = message;
  notification.style.zIndex = '10003';
  
  document.body.appendChild(notification);
  
  // Remover automaticamente
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}

/**
 * Mostra tela de erro quando a aplicação falha ao inicializar
 */
function showErrorScreen(error) {
  const app = document.getElementById('app');
  if (!app) {
    document.body.innerHTML = createErrorHTML(error);
  } else {
    app.innerHTML = createErrorHTML(error);
  }
}

/**
 * Cria HTML para tela de erro
 */
function createErrorHTML(error) {
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
      background-color: #f9fafb;
      color: #374151;
    ">
      <div style="
        background-color: white;
        padding: 3rem;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 100%;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #dc2626;
        ">Erro ao Carregar Aplicação</h1>
        <p style="
          margin-bottom: 2rem;
          color: #6b7280;
          line-height: 1.6;
        ">
          Ocorreu um erro ao inicializar o ND Express. 
          Verifique sua conexão com a internet e tente novamente.
        </p>
        <details style="
          margin-bottom: 2rem;
          text-align: left;
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
        ">
          <summary style="cursor: pointer; font-weight: 500;">Detalhes do erro</summary>
          <pre style="
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #dc2626;
            white-space: pre-wrap;
            word-break: break-word;
          ">${error.message || error}</pre>
        </details>
        <button onclick="window.location.reload()" style="
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#1d4ed8'" 
           onmouseout="this.style.backgroundColor='#2563eb'">
          🔄 Tentar Novamente
        </button>
      </div>
    </div>
  `;
}

/**
 * Função para debug (apenas em desenvolvimento)
 */
function enableDebugMode() {
  if (CONFIG.ENVIRONMENT === 'development') {
    window.DEBUG = {
      config: CONFIG,
      showNotification,
      toggleFullscreen
    };
    console.log('🐛 Modo debug ativado. Use window.DEBUG para acessar funções de debug.');
  }
}

// Configurar informações da aplicação no console
console.log(`
%c🚀 ${CONFIG.APP_NAME} v${CONFIG.VERSION}
%cSistema de Gestão de Notas de Despesa
%c
🔧 Desenvolvido com arquitetura modular
📱 PWA Ready
🔒 APIs seguras
⚡ Performance otimizada

`, 
  'font-size: 16px; font-weight: bold; color: #2563eb;',
  'font-size: 12px; color: #6b7280;',
  'font-size: 11px; color: #9ca3af;'
);

// Ativar modo debug se necessário
enableDebugMode();

// Inicializar aplicação
initializeApp();

// Exportar para uso global se necessário
window.NDExpress = {
  version: CONFIG.VERSION,
  init: initializeApp
};

export default initializeApp;