"use client";

export default function CategoryTabs({ 
  categories, 
  activeCategory, 
  onCategoryChange, 
  counts = {} 
}) {
  return (
    <div className="flex gap-2 mb-6 border-b border-black/10 overflow-x-auto pb-0 scrollbar-hide">
      {categories.map((cat) => {
        const count = counts[cat.key] || 0;
        const isActive = activeCategory === cat.key;

        return (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? "border-primary-main text-primary-main"
                : "border-transparent text-secondary hover:text-main"
            }`}
          >
            {cat.label}
            {count > 0 && (
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? "bg-primary-main text-white"
                    : "bg-black/5 text-secondary"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}