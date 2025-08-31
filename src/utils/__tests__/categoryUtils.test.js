// Testes para utilitários de categorização
import {
  categorizeExpenseAutomatically,
  isTimeInRange,
  timeToMinutes,
  extractTimeFromDescription,
  suggestCategory,
  calculateCategorizationConfidence
} from '../categoryUtils.js';
import { EXPENSE_CATEGORIES } from '../constants.js';

describe('categoryUtils', () => {
  describe('timeToMinutes', () => {
    test('converte horário corretamente', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('isTimeInRange', () => {
    test('verifica se horário está no intervalo', () => {
      expect(isTimeInRange('12:00', '10:00', '14:00')).toBe(true);
      expect(isTimeInRange('09:00', '10:00', '14:00')).toBe(false);
      expect(isTimeInRange('15:00', '10:00', '14:00')).toBe(false);
      expect(isTimeInRange('10:00', '10:00', '14:00')).toBe(true);
      expect(isTimeInRange('14:00', '10:00', '14:00')).toBe(true);
    });
  });

  describe('extractTimeFromDescription', () => {
    test('extrai horário de diferentes formatos', () => {
      expect(extractTimeFromDescription('Almoço às 12:30')).toBe('12:30');
      expect(extractTimeFromDescription('Reunião 14h30')).toBe('14:30');
      expect(extractTimeFromDescription('Café da manhã 08:00')).toBe('08:00');
      expect(extractTimeFromDescription('Jantar às 19.45')).toBe('19:45');
      expect(extractTimeFromDescription('Sem horário')).toBe(null);
    });

    test('lida com horários de um dígito', () => {
      expect(extractTimeFromDescription('Café às 8:30')).toBe('08:30');
      expect(extractTimeFromDescription('Lanche 9h15')).toBe('09:15');
    });
  });

  describe('categorizeExpenseAutomatically', () => {
    test('categoriza por palavras-chave de alimentação', () => {
      expect(categorizeExpenseAutomatically('Almoço no restaurante', '12:00'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
      expect(categorizeExpenseAutomatically('Café da manhã', '08:00'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
      expect(categorizeExpenseAutomatically('Jantar no hotel', '19:00'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
    });

    test('categoriza por palavras-chave de deslocamento', () => {
      expect(categorizeExpenseAutomatically('Uber para o aeroporto', '10:00'))
        .toBe(EXPENSE_CATEGORIES.DESLOCAMENTO);
      expect(categorizeExpenseAutomatically('Taxi centro', '15:00'))
        .toBe(EXPENSE_CATEGORIES.DESLOCAMENTO);
      expect(categorizeExpenseAutomatically('Gasolina posto', '16:00'))
        .toBe(EXPENSE_CATEGORIES.DESLOCAMENTO);
    });

    test('categoriza por palavras-chave de hospedagem', () => {
      expect(categorizeExpenseAutomatically('Hotel Ibis', '20:00'))
        .toBe(EXPENSE_CATEGORIES.HOSPEDAGEM);
      expect(categorizeExpenseAutomatically('Diária pousada', '18:00'))
        .toBe(EXPENSE_CATEGORIES.HOSPEDAGEM);
    });

    test('categoriza por horário quando não há palavras-chave', () => {
      expect(categorizeExpenseAutomatically('Compra diversos', '12:00'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
      expect(categorizeExpenseAutomatically('Gasto variado', '08:30'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
      expect(categorizeExpenseAutomatically('Despesa geral', '19:00'))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO);
    });

    test('retorna OUTROS quando não consegue categorizar', () => {
      expect(categorizeExpenseAutomatically('Compra material', '02:00'))
        .toBe(EXPENSE_CATEGORIES.OUTROS);
      expect(categorizeExpenseAutomatically('', '12:00'))
        .toBe(EXPENSE_CATEGORIES.OUTROS);
      expect(categorizeExpenseAutomatically('Despesa indefinida'))
        .toBe(EXPENSE_CATEGORIES.OUTROS);
    });
  });

  describe('suggestCategory', () => {
    test('usa categoria da IA quando disponível e específica', () => {
      expect(suggestCategory('Almoço', EXPENSE_CATEGORIES.HOSPEDAGEM))
        .toBe(EXPENSE_CATEGORIES.ALIMENTACAO); // Auto-categoria mais específica
    });

    test('usa categoria automática quando IA não fornece', () => {
      expect(suggestCategory('Uber centro'))
        .toBe(EXPENSE_CATEGORIES.DESLOCAMENTO);
    });

    test('usa categoria da IA quando auto-categoria é OUTROS', () => {
      expect(suggestCategory('Despesa indefinida', EXPENSE_CATEGORIES.HOSPEDAGEM))
        .toBe(EXPENSE_CATEGORIES.HOSPEDAGEM);
    });

    test('retorna OUTROS quando não há descrição nem categoria IA', () => {
      expect(suggestCategory('')).toBe(EXPENSE_CATEGORIES.OUTROS);
      expect(suggestCategory(null)).toBe(EXPENSE_CATEGORIES.OUTROS);
    });
  });

  describe('calculateCategorizationConfidence', () => {
    test('calcula confiança baseada em palavras-chave', () => {
      const confidence = calculateCategorizationConfidence(
        'Almoço no restaurante',
        EXPENSE_CATEGORIES.ALIMENTACAO
      );
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    test('retorna 0 para descrição vazia', () => {
      expect(calculateCategorizationConfidence('', EXPENSE_CATEGORIES.ALIMENTACAO))
        .toBe(0);
    });

    test('retorna 0 para categoria vazia', () => {
      expect(calculateCategorizationConfidence('Almoço', ''))
        .toBe(0);
    });

    test('dá bonus para categorias específicas', () => {
      const confidenceOthers = calculateCategorizationConfidence(
        'Despesa indefinida',
        EXPENSE_CATEGORIES.OUTROS
      );
      const confidenceFood = calculateCategorizationConfidence(
        'Despesa indefinida',
        EXPENSE_CATEGORIES.ALIMENTACAO
      );
      
      expect(confidenceFood).toBeGreaterThan(confidenceOthers);
    });
  });
});