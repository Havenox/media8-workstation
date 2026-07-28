import React, { useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";

/**
 * Props for the Generic Infinite Combobox
 * T = Type of the item (e.g. User, Package)
 */
interface InfiniteComboboxProps<T> {
  // Data
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;

  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;

  // Selection
  value?: string;
  onChange: (value: string) => void;

  // Rendering
  renderItem: (item: T) => React.ReactNode;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  
  className?: string;
}

export function InfiniteCombobox<T>({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  searchValue,
  onSearchChange,
  placeholder = "Selecione um item...",
  emptyMessage = "Nenhum item encontrado.",
  value,
  onChange,
  renderItem,
  getLabel,
  getValue,
  className
}: InfiniteComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  // Find selected item label for the button trigger
  const selectedItem = items.find((item) => getValue(item) === value);
  // Note: If the selected item is NOT in the current list (e.g. initial load of a user not in first page),
  // we might need a way to fetch/display it. For now, we assume simple selection or that the parent handles exact display.
  // Ideally, the parent should pass a "selectedItemLabel" if it knows it, or we rely on the list.
  // For this generic implementation, we display the label if found, or "Selecione..."
  // Improvement: Accept a `selectedLabel` prop for optimistic display.

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? (selectedItem ? getLabel(selectedItem) : (items.find(i => getValue(i) === value)?.toString() || "Item selecionado"))
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder} 
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading && items.length === 0 && (
               <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                 <Loader2 className="h-4 w-4 animate-spin" />
               </div>
            )}
            
            {!isLoading && items.length === 0 && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}

            <InfiniteScroll
                hasMore={hasNextPage}
                isLoading={isFetchingNextPage}
                next={fetchNextPage}
                threshold={0.5}
            >
                <CommandGroup>
                {items.map((item) => {
                    const itemValue = getValue(item);
                    return (
                    <CommandItem
                        key={itemValue}
                        value={itemValue}
                        onSelect={(currentValue) => {
                            onChange(currentValue === value ? "" : currentValue);
                            setOpen(false);
                        }}
                    >
                        <Check
                        className={cn(
                            "mr-2 h-4 w-4",
                            value === itemValue ? "opacity-100" : "opacity-0"
                        )}
                        />
                        {renderItem(item)}
                    </CommandItem>
                    );
                })}
                </CommandGroup>
                {isFetchingNextPage && (
                    <div className="py-2 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Carregando mais...
                    </div>
                )}
            </InfiniteScroll>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
