import React, { useState } from 'react';
import { Crown, Video, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export type UserRoleOption = 'Admin' | 'Editor';

interface UserRoleSelectProps {
  value: UserRoleOption;
  onChange: (value: UserRoleOption) => void;
}

const USER_ROLE_OPTIONS: {
  id: UserRoleOption;
  label: string;
  subLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'Editor',
    label: 'Editor de Vídeo',
    subLabel: 'Acesso apenas aos Projetos Atribuídos',
    icon: Video,
  },
  {
    id: 'Admin',
    label: 'Administrador',
    subLabel: 'Acesso Global + Gestão de Usuários',
    icon: Crown,
  },
];

export const UserRoleSelect: React.FC<UserRoleSelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = USER_ROLE_OPTIONS.find((opt) => opt.id === value) || USER_ROLE_OPTIONS[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between gap-3 w-full px-3.5 py-2.5 bg-white border border-[#400404]/20 hover:border-[#400404] rounded-xl text-xs font-medium text-[#400404] transition-all focus:outline-none focus:ring-2 focus:ring-[#400404]/20 cursor-pointer shadow-xs"
        >
          <span className="flex items-center gap-2.5 truncate">
            <SelectedIcon className="w-4 h-4 text-[#400404] shrink-0" />
            <span className="truncate font-semibold">{selectedOption.label} <span className="text-[#5C1212]/70 font-normal">({selectedOption.subLabel})</span></span>
          </span>
          <ChevronDown className={`w-4 h-4 text-[#400404]/60 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[calc(100vw-3rem)] max-w-sm p-1.5 bg-[#FFFBED] border border-[#400404]/25 shadow-xl rounded-xl space-y-1"
        align="start"
      >
        {USER_ROLE_OPTIONS.map((option) => {
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
              className={`group flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                isSelected
                  ? 'bg-[#400404] text-[#FFFBED]'
                  : 'text-[#400404] hover:bg-[#400404] hover:text-[#FFFBED]'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <IconComponent
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-amber-400' : 'text-[#400404] group-hover:text-amber-400'
                  }`}
                />
                <span className="flex flex-col truncate">
                  <span className="font-semibold">{option.label}</span>
                  <span
                    className={`text-[10px] font-normal truncate ${
                      isSelected ? 'text-[#FFFBED]/80' : 'text-[#5C1212]/70 group-hover:text-[#FFFBED]/80'
                    }`}
                  >
                    {option.subLabel}
                  </span>
                </span>
              </span>

              {isSelected && <Check className="w-4 h-4 text-[#FFFBED] shrink-0 ml-2" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
