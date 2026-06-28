import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateBR(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export type ValidationStatus = "validado" | "em_validacao" | "nao_validado";

export const statusLabels: Record<ValidationStatus, string> = {
  validado: "Possivelmente validado",
  em_validacao: "Em validação",
  nao_validado: "Não validado",
};
