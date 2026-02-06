import clsx from 'clsx';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex w-full rounded-2xl bg-slate-800/90 p-1 shadow-inner">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'min-w-0 flex-1 rounded-xl px-2 py-2 text-center text-[17px] font-semibold transition',
              active ? 'bg-slate-500 text-white shadow' : 'text-slate-200 hover:text-white'
            )}
          >
            <span className="block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
