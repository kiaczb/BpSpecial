import type { SearchBarProps } from "../types";

const SearchBar = ({ query, onChange, onSearch }: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query); // Meghívjuk a keresés callback-et
  };

  return (
    <div className="text-center">
      <form className="max-w-md mx-auto" onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"></div>
          <input
            type="search"
            id="default-search"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full p-4 ps-10 text-m text-gray-900 border border-gray-300 rounded-lg 
                       bg-gray-50 
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                       dark:text-white"
            placeholder="Search competitors"
          />
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
