import Select from 'react-select';

const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 34,
    fontSize: 12.5,
    borderRadius: 6,
    borderColor: state.isFocused ? '#1E90FF' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #1E90FF' : 'none',
    '&:hover': { borderColor: '#1E90FF' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  menu: (base) => ({ ...base, fontSize: 12.5, zIndex: 60 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#1E90FF' : state.isFocused ? '#eff6ff' : 'white',
    color: state.isSelected ? 'white' : '#111827',
  }),
  placeholder: (base) => ({ ...base, color: '#9ca3af' }),
};

/**
 * options: [{ value, label }]
 * value: the raw value (string/number) — matched against options to find the selected option
 */
export default function SearchableSelect({ options, value, onChange, isDisabled, placeholder = 'Sélectionner…' }) {
  const selected = options.find((o) => String(o.value) === String(value)) || null;
  return (
    <Select
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : '')}
      isDisabled={isDisabled}
      isClearable
      placeholder={placeholder}
      styles={customStyles}
      noOptionsMessage={() => 'Aucun résultat'}
    />
  );
}
