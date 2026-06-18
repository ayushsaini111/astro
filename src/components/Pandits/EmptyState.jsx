export default function EmptyState({ category = "all" }) {
  const messages = {
    pending: {
      title: "No pending requests",
      description: "Waiting for users to connect",
    },
    accepted: {
      title: "No accepted calls yet",
      description: "Accepted calls will appear here",
    },
    missed: {
      title: "No missed calls",
      description: "Missed calls will appear here",
    },
    all: {
      title: "No call requests yet",
      description: "All requests will appear here",
    },
  };

  const { title, description } = messages[category] || messages.all;

  return (
    <div className="text-center mt-24 text-secondary">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-main mb-1">{title}</p>
      <p className="caption">{description}</p>
    </div>
  );
}