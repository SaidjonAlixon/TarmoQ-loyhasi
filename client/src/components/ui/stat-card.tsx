import { IconType } from "react-icons";
import { Users, UserCheck, UsersRound, MessageSquare } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: "users" | "usersActive" | "groups" | "messages";
  change: number;
  loading?: boolean;
}

export function StatCard({ title, value, icon, change, loading = false }: StatCardProps) {
  const renderIcon = () => {
    switch (icon) {
      case "users":
        return <Users className="h-6 w-6 text-primary" />;
      case "usersActive":
        return <UserCheck className="h-6 w-6 text-secondary" />;
      case "groups":
        return <UsersRound className="h-6 w-6 text-accent" />;
      case "messages":
        return <MessageSquare className="h-6 w-6 text-destructive" />;
    }
  };

  const formattedValue = Intl.NumberFormat('uz-UZ').format(value);

  return (
    <div className="bg-white dark:bg-dark-700 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-dark-500 dark:text-light-400 font-medium">{title}</h3>
        {renderIcon()}
      </div>
      {loading ? (
        <>
          <div className="h-8 w-24 bg-light-300 dark:bg-dark-600 rounded animate-pulse mb-1"></div>
          <div className="h-4 w-32 bg-light-300 dark:bg-dark-600 rounded animate-pulse"></div>
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-dark-800 dark:text-light-100 mb-1">{formattedValue}</p>
          <div className={`flex items-center text-sm ${
            change >= 0 ? 'text-accent' : 'text-destructive'
          }`}>
            {change >= 0 ? (
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(change)}% o'tgan hafta</span>
          </div>
        </>
      )}
    </div>
  );
}
