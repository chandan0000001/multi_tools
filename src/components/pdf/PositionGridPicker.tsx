import React from 'react';

interface PositionGridPickerProps {
  value: string;
  onChange: (position: string) => void;
}

export const PositionGridPicker: React.FC<PositionGridPickerProps> = ({ value, onChange }) => {
  const gridPositions = [
    ['top_left', 'top_center', 'top_right'],
    ['middle_left', 'middle_center', 'middle_right'],
    ['bottom_left', 'bottom_center', 'bottom_right'],
  ];

  return (
    <div className="w-24 h-24 border border-slate-300 dark:border-slate-700 rounded-2xl grid grid-cols-3 grid-rows-3 p-1.5 gap-1.5 bg-slate-100 dark:bg-slate-800/80 shadow-inner">
      {gridPositions.flat().map((pos) => {
        const isSelected = value === pos;
        return (
          <button
            key={pos}
            type="button"
            onClick={() => onChange(pos)}
            title={pos.replace('_', ' ')}
            className={`rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-rose-500 shadow-md ring-2 ring-rose-400/40'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 bg-white dark:bg-surface-900 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>}
          </button>
        );
      })}
    </div>
  );
};
