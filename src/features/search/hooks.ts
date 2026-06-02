"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { characterService } from "@/services/character.service";
import { eventService } from "@/services/event.service";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";

export interface SearchSuggestion {
  id: string;
  type: "character" | "event";
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  url: string;
}

export function useSearchSuggestions() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: characters = [], isLoading: isLoadingChars } = useQuery({
    queryKey: ["search", "characters", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res = await characterService.getAll({
        search: debouncedQuery,
        limit: 5,
      });
      return res.content;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60,
  });

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["search", "events", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const res = await eventService.getAllClient({
        search: debouncedQuery,
        limit: 5,
      });
      return res.content;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60,
  });

  const suggestions: SearchSuggestion[] = [
    ...characters.map((char: Character) => ({
      id: char.id,
      type: "character" as const,
      title: char.name,
      subtitle: char.title,
      imageUrl: char.avatarUrl || char.imageUrl,
      url: `/chat/${char.id}?contextId=${char.contextId || ""}`,
    })),
    ...events.map((event: HistoricalEvent) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      subtitle: event.year ? `Năm ${event.year}${event.beforeTCN ? " TCN" : ""}` : undefined,
      imageUrl: event.imageUrl,
      url: `/events?event=${event.id}`,
    })),
  ].slice(0, 8);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
  }, []);

  return {
    query,
    suggestions,
    isLoading: isLoadingChars || isLoadingEvents,
    handleSearch,
    clearSearch,
  };
}
