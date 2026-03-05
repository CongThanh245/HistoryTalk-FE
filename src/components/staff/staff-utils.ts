"use client";

export function newId() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function nowLabel() {
  return new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

