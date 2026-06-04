"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, UserIcon, CalendarIcon, XIcon } from "@phosphor-icons/react";
import { useSearchSuggestions } from "@/features/search/hooks";
import Image from "next/image";

interface SearchInputWithSuggestionsProps {
  placeholder?: string;
}

export function SearchInputWithSuggestions({
  placeholder = "Tìm kiếm sự kiện, nhân vật...",
}: SearchInputWithSuggestionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { query, suggestions, isLoading, handleSearch, clearSearch } = useSearchSuggestions();
  const highlightedIndex = suggestions.findIndex(
    (suggestion) => getSuggestionKey(suggestion) === highlightedKey,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex =
        highlightedIndex < suggestions.length - 1
          ? highlightedIndex + 1
          : highlightedIndex;
      setHighlightedKey(
        nextIndex >= 0 ? getSuggestionKey(suggestions[nextIndex]) : null,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = highlightedIndex > 0 ? highlightedIndex - 1 : -1;
      setHighlightedKey(
        nextIndex >= 0 ? getSuggestionKey(suggestions[nextIndex]) : null,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        router.push(suggestions[highlightedIndex].url);
        clearSearch();
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (url: string) => {
    router.push(url);
    clearSearch();
    setIsOpen(false);
  };

  const hasSuggestions = suggestions.length > 0;
  const showDropdown = isOpen && (hasSuggestions || isLoading || query.length >= 2);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 focus-within:border-[rgba(201,162,77,0.4)]"
        style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
      >
        <MagnifyingGlassIcon className="w-4 h-4 shrink-0" style={{ color: "var(--content-subtle)" }} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            handleSearch(e.target.value);
            setIsOpen(true);
            setHighlightedKey(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--content-text)" }}
        />
        {query && (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-70"
            style={{ color: "var(--content-subtle)" }}
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-lg z-50 max-h-[320px] overflow-y-auto"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--accent-gold)", borderTopColor: "transparent" }}
              />
            </div>
          )}

          {!isLoading && !hasSuggestions && query.length >= 2 && (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Không tìm thấy kết quả
            </div>
          )}

          {!isLoading && hasSuggestions && (
            <>
              {/* Characters Section */}
              {suggestions.some((s) => s.type === "character") && (
                <>
                  <div
                    className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    Nhân vật
                  </div>
                  {suggestions
                    .filter((s) => s.type === "character")
                    .map((suggestion) => {
                      const suggestionKey = getSuggestionKey(suggestion);
                      return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelect(suggestion.url)}
                        onMouseEnter={() => setHighlightedKey(suggestionKey)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-colors ${
                          highlightedKey === suggestionKey ? "bg-[rgba(201,162,77,0.1)]" : ""
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: "var(--bg-deep)" }}
                        >
                          {suggestion.imageUrl ? (
                            <Image
                              src={suggestion.imageUrl}
                              alt={suggestion.title}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {suggestion.title}
                          </div>
                          {suggestion.subtitle && (
                            <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {suggestion.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                      );
                    })}
                </>
              )}

              {/* Events Section */}
              {suggestions.some((s) => s.type === "event") && (
                <>
                  <div
                    className="px-3 py-1.5 mt-1 text-[10px] font-semibold uppercase tracking-wider border-t"
                    style={{ color: "var(--accent-gold)", borderColor: "var(--border-default)" }}
                  >
                    Sự kiện
                  </div>
                  {suggestions
                    .filter((s) => s.type === "event")
                    .map((suggestion) => {
                      const suggestionKey = getSuggestionKey(suggestion);
                      return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSelect(suggestion.url)}
                        onMouseEnter={() => setHighlightedKey(suggestionKey)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left cursor-pointer transition-colors ${
                          highlightedKey === suggestionKey ? "bg-[rgba(201,162,77,0.1)]" : ""
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: "var(--bg-deep)" }}
                        >
                          {suggestion.imageUrl ? (
                            <Image
                              src={suggestion.imageUrl}
                              alt={suggestion.title}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CalendarIcon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {suggestion.title}
                          </div>
                          {suggestion.subtitle && (
                            <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {suggestion.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                      );
                    })}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getSuggestionKey(suggestion: { type: string; id: string }) {
  return `${suggestion.type}:${suggestion.id}`;
}
