"use client";

interface ThreadListItemProps {
  thread: {
    id: string;
    title: string;
    icon: string;
    isPreseeded?: boolean;
  };
  isActive: boolean;
  onClick: () => void;
}

export function ThreadListItem({ thread, isActive, onClick }: ThreadListItemProps) {
  // Separator
  if (thread.id === "separator") {
    return <hr className="my-2 border-gray-200 dark:border-gray-800" />;
  }

  // Header
  if (thread.id === "preseeded-header") {
    return (
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
        {thread.title}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
        isActive
          ? "bg-gray-100 dark:bg-gray-900 font-medium"
          : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
      }`}
    >
      <span className="text-lg">{thread.icon}</span>
      <span>{thread.title}</span>
    </button>
  );
}