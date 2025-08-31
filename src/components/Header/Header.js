// Componente do cabeçalho da aplicação
import { formatCurrency } from '../../utils/formatCurrency.js';
import { authService } from '../../services/authService.js';

class Header {
  constructor() {
    this.element = null;
    this.ndNumber = 'ND001';
    this.totalValue = 0;
    this.adiantamentoValue = 0;
  }

  /**
   * Cria o elemento do cabeçalho
   * @returns {HTMLElement} Elemento do cabeçalho
   */
  createElement() {
    const header = document.createElement('header');
    header.className = 'app-header';
    header.style.cssText = `
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
      color: var(--white);
      padding: var(--spacing-6) var(--spacing-4);
      box-shadow: var(--shadow-lg);
      position: sticky;
      top: 0;
      z-index: var(--z-dropdown);
    `;

    header.innerHTML = `
      <div class="header-container" style="
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--spacing-4);
      ">
        <div class="header-brand" style="
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        ">
          <div class="brand-icon" style="
            width: 40px;
            height: 40px;
            background-color: var(--white);
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: var(--primary-color);
            font-size: var(--font-size-lg);
          ">ND</div>
          <div class="brand-text">
            <h1 style="
              margin: 0;
              font-size: var(--font-size-xl);
              font-weight: 600;
            ">ND Express</h1>
            <p style="
              margin: 0;
              font-size: var(--font-size-sm);
              opacity: 0.9;
            ">Sistema de Gestão de Despesas</p>
          </div>
        </div>

        <div class="header-user-info" style="
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          background-color: rgba(255, 255, 255, 0.1);
          padding: var(--spacing-2) var(--spacing-3);
          border-radius: var(--border-radius);
        ">
          <div class="user-avatar" style="
            width: 32px;
            height: 32px;
            background-color: var(--white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: var(--primary-color);
            font-size: var(--font-size-sm);
          ">${authService.getCurrentUser()?.name?.charAt(0) || 'U'}</div>
          <div class="user-details">
            <div style="
              font-size: var(--font-size-sm);
              font-weight: 500;
            ">${authService.getCurrentUser()?.name || 'Usuário'}</div>
            <div style="
              font-size: var(--font-size-xs);
              opacity: 0.8;
            ">${authService.getCurrentUser()?.email || ''}</div>
          </div>
          <button class="logout-btn" style="
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: var(--white);
            padding: var(--spacing-1) var(--spacing-2);
            border-radius: var(--border-radius);
            font-size: var(--font-size-xs);
            cursor: pointer;
            transition: all 0.2s ease;
          " onclick="authService.logout()">Sair</button>
        </div>

        <div class="header-info" style="
          display: flex;
          gap: var(--spacing-6);
          align-items: center;
          flex-wrap: wrap;
        ">
          <div class="nd-info" style="
            text-align: center;
            min-width: 120px;
          ">
            <div class="nd-number" style="
              font-size: var(--font-size-lg);
              font-weight: 600;
              margin-bottom: var(--spacing-1);
            ">${this.ndNumber}</div>
            <div style="
              font-size: var(--font-size-xs);
              opacity: 0.8;
            ">Nota de Despesa</div>
          </div>

          <div class="financial-summary" style="
            display: flex;
            gap: var(--spacing-4);
            align-items: center;
          ">
            <div class="total-info" style="
              text-align: center;
              min-width: 100px;
            ">
              <div class="total-value" style="
                font-size: var(--font-size-lg);
                font-weight: 600;
                margin-bottom: var(--spacing-1);
              ">${formatCurrency(this.totalValue)}</div>
              <div style="
                font-size: var(--font-size-xs);
                opacity: 0.8;
              ">Total Despesas</div>
            </div>

            <div class="adiantamento-info" style="
              text-align: center;
              min-width: 100px;
            ">
              <div class="adiantamento-value" style="
                font-size: var(--font-size-lg);
                font-weight: 600;
                margin-bottom: var(--spacing-1);
              ">${formatCurrency(this.adiantamentoValue)}</div>
              <div style="
                font-size: var(--font-size-xs);
                opacity: 0.8;
              ">Adiantamento</div>
            </div>

            <div class="saldo-info" style="
              text-align: center;
              min-width: 100px;
              padding: var(--spacing-2) var(--spacing-3);
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: var(--border-radius);
            ">
              <div class="saldo-value" style="
                font-size: var(--font-size-lg);
                font-weight: 600;
                margin-bottom: var(--spacing-1);
              ">${formatCurrency(this.totalValue - this.adiantamentoValue)}</div>
              <div style="
                font-size: var(--font-size-xs);
                opacity: 0.8;
              ">Saldo</div>
            </div>
          </div>
        </div>
      </div>
    `;

    return header;
  }

  /**
   * Renderiza o cabeçalho no DOM
   * @param {HTMLElement} container - Container onde renderizar
   */
  render(container) {
    if (!this.element) {
      this.element = this.createElement();
    }
    
    container.appendChild(this.element);
    this.addResponsiveStyles();
  }

  /**
   * Atualiza o número da ND
   * @param {string} ndNumber - Novo número da ND
   */
  updateNDNumber(ndNumber) {
    this.ndNumber = ndNumber;
    
    if (this.element) {
      const ndNumberElement = this.element.querySelector('.nd-number');
      if (ndNumberElement) {
        ndNumberElement.textContent = ndNumber;
      }
    }
  }

  /**
   * Atualiza o total de despesas
   * @param {number} total - Novo total
   */
  updateTotal(total) {
    this.totalValue = total;
    
    if (this.element) {
      const totalElement = this.element.querySelector('.total-value');
      if (totalElement) {
        totalElement.textContent = formatCurrency(total);
      }
      
      this.updateSaldo();
    }
  }

  /**
   * Atualiza o valor do adiantamento
   * @param {number} adiantamento - Novo valor do adiantamento
   */
  updateAdiantamento(adiantamento) {
    this.adiantamentoValue = adiantamento;
    
    if (this.element) {
      const adiantamentoElement = this.element.querySelector('.adiantamento-value');
      if (adiantamentoElement) {
        adiantamentoElement.textContent = formatCurrency(adiantamento);
      }
      
      this.updateSaldo();
    }
  }

  /**
   * Atualiza o saldo (total - adiantamento)
   */
  updateSaldo() {
    if (!this.element) return;
    
    const saldo = this.totalValue - this.adiantamentoValue;
    const saldoElement = this.element.querySelector('.saldo-value');
    const saldoContainer = this.element.querySelector('.saldo-info');
    
    if (saldoElement) {
      saldoElement.textContent = formatCurrency(saldo);
    }
    
    // Alterar cor baseada no saldo
    if (saldoContainer) {
      if (saldo > 0) {
        saldoContainer.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      } else if (saldo < 0) {
        saldoContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      } else {
        saldoContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }
    }
  }

  /**
   * Atualiza todos os valores de uma vez
   * @param {Object} data - Dados para atualizar
   */
  updateAll(data = {}) {
    const { ndNumber, total, adiantamento } = data;
    
    if (ndNumber !== undefined) {
      this.updateNDNumber(ndNumber);
    }
    
    if (total !== undefined) {
      this.updateTotal(total);
    }
    
    if (adiantamento !== undefined) {
      this.updateAdiantamento(adiantamento);
    }
  }

  /**
   * Adiciona estilos responsivos
   */
  addResponsiveStyles() {
    if (!document.querySelector('#header-responsive-styles')) {
      const style = document.createElement('style');
      style.id = 'header-responsive-styles';
      style.textContent = `
        @media (max-width: 768px) {
          .header-container {
            flex-direction: column !important;
            text-align: center !important;
          }
          
          .header-brand {
            justify-content: center !important;
          }
          
          .header-info {
            justify-content: center !important;
            width: 100%;
          }
          
          .financial-summary {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          
          .nd-info,
          .total-info,
          .adiantamento-info,
          .saldo-info {
            min-width: 80px !important;
          }
        }
        
        @media (max-width: 480px) {
          .app-header {
            padding: var(--spacing-4) var(--spacing-2) !important;
          }
          
          .brand-text h1 {
            font-size: var(--font-size-lg) !important;
          }
          
          .financial-summary {
            gap: var(--spacing-2) !important;
          }
          
          .total-value,
          .adiantamento-value,
          .saldo-value {
            font-size: var(--font-size-base) !important;
          }
        }
      `;
      
      document.head.appendChild(style);
    }
  }

  /**
   * Adiciona animação de atualização
   * @param {HTMLElement} element - Elemento a ser animado
   */
  animateUpdate(element) {
    if (!element) return;
    
    element.style.transform = 'scale(1.1)';
    element.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Remove o cabeçalho do DOM
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
  }
}

export default Header;