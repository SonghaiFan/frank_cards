import { useTranslation } from "react-i18next";

interface FilterGroupProps<T> {
  title: string;
  allLabel: string;
  options: T[];
  selectedValue: T | null;
  onSelectionChange: (value: T | null) => void;
  translationKey: string;
}

const FilterGroup = <T extends string>({
  title,
  allLabel,
  options,
  selectedValue,
  onSelectionChange,
  translationKey,
}: FilterGroupProps<T>) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
      <span className="theme-text-tertiary text-xs uppercase tracking-wider font-medium">
        {title}
      </span>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => onSelectionChange(null)}
          className={`paper-control px-6 py-2 rounded-full text-sm font-bold transition-[transform,background-color,color,box-shadow] duration-300 hover:scale-105
            ${!selectedValue
              ? "theme-primary-control shadow-md"
              : "theme-secondary-control"
            }`}
        >
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelectionChange(option)}
            className={`paper-control px-6 py-2 rounded-full text-sm font-bold transition-[transform,background-color,color,box-shadow] duration-300 hover:scale-105
              ${selectedValue === option
                ? "theme-primary-control shadow-md"
                : "theme-secondary-control"
              }`}
          >
            {t(`${translationKey}.${option}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterGroup;
