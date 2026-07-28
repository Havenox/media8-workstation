import React, { useState } from 'react';
import {
  FolderKanban,
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  Link2,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

export type LinkTypeOption = 'Folder' | 'Video' | 'Audio' | 'Image' | 'PDF' | 'Other';

interface LinkTypeSelectProps {
  value: LinkTypeOption;
  onChange: (value: LinkTypeOption) => void;
}

const LINK_TYPE_OPTIONS: { id: LinkTypeOption; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Folder', label: 'Pasta Drive', icon: FolderKanban },
  { id: 'Video', label: 'Vídeo', icon: Video },
  { id: 'Audio', label: 'Áudio', icon: Music },
  { id: 'Image', label: 'Imagem', icon: ImageIcon },
  { id: 'PDF', label: 'PDF', icon: FileText },
  { id: 'Other', label: 'Outro', icon: Link2 },
];

export const LinkTypeSelect: React.FC<LinkTypeSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = LINK_TYPE_OPTIONS.find((opt) => opt.id === value) || LINK_TYPE_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#400404]/20 hover:border-[#400404] rounded-lg text-xs font-medium text-[#400404] transition-all focus:outline-none focus:ring-2 focus:ring-[#400404]/20 shrink-0 min-w-[130px] cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-2 truncate">
            <SelectedIcon className="w-3.5 h-3.5 text-[#400404] shrink-0" />
            <span className="truncate">{selectedOption.label}</span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#400404]/60 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[150px] p-1.5 bg-[#FFFBED] border border-[#400404]/25 shadow-xl rounded-xl space-y-0.5"
        align="start"
      >
        {LINK_TYPE_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = option.id === value;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#400404] text-[#FFFBED]'
                  : 'text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED]'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <IconComponent className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? 'text-[#FFFBED]' : 'text-[#400404] group-hover:text-[#FFFBED]'}`} />
                <span className="truncate">{option.label}</span>
              </span>

              {isSelected && <Check className="w-3 h-3 text-[#FFFBED] shrink-0" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
