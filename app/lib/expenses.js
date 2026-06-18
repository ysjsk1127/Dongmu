import { pushToCloud } from './sync';

const EXPENSES_KEY = 'dongmu_expenses';

export const EXPENSE_CATEGORIES = ['부품 구매', '행사비', '인쇄비', '식비', '기타'];
export const INCOME_CATEGORIES = ['회비', '후원금', '대회 상금', '판매 수익', '기타 수입'];

export function getExpenses(clubId) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(EXPENSES_KEY);
  const all = raw ? JSON.parse(raw) : [];
  const list = clubId === undefined ? all : all.filter(e => e.clubId === clubId);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saveExpenses(list) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
  pushToCloud(EXPENSES_KEY);
}

export function addExpense(data) {
  if (!data.category) return { success: false, error: '항목을 선택해주세요.' };
  if (!data.amount) return { success: false, error: '금액을 입력해주세요.' };
  const list = getExpenses();
  const newExp = {
    id: Date.now().toString(),
    clubId: data.clubId || '',
    type: data.type || 'expense',
    category: data.category,
    amount: Number(String(data.amount).replace(/[^\d]/g, '')) || 0,
    memo: data.memo || '',
    source: data.source || '',
    receiptFile: data.receiptFile || '',
    occurredAt: data.occurredAt || '',
    createdAt: new Date().toISOString(),
  };
  list.push(newExp);
  saveExpenses(list);
  return { success: true, expense: newExp };
}

export function deleteExpense(id) {
  const list = getExpenses();
  const filtered = list.filter(e => e.id !== id);
  if (filtered.length === list.length) return { success: false, error: '해당 내역을 찾을 수 없습니다.' };
  saveExpenses(filtered);
  return { success: true };
}

export function getExpenseCount(clubId) {
  return getExpenses(clubId).length;
}

export function getTotalExpense(clubId) {
  return getExpenses(clubId).filter(e => e.type !== 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function getTotalIncome(clubId) {
  return getExpenses(clubId).filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function getBalance(clubId) {
  const list = getExpenses(clubId);
  const income = list.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
  const expense = list.filter(e => e.type !== 'income').reduce((s, e) => s + (e.amount || 0), 0);
  return income - expense;
}

export function getExpensesByCategory(clubId) {
  const list = getExpenses(clubId).filter(e => e.type !== 'income');
  return EXPENSE_CATEGORIES.map(cat => ({
    category: cat,
    total: list.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    count: list.filter(e => e.category === cat).length,
  }));
}

export function getMonthlyExpense(clubId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return getExpenses(clubId)
    .filter(e => e.type !== 'income')
    .filter(e => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function formatAmount(n) {
  return (n || 0).toLocaleString('ko-KR');
}
