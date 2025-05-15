import { useEffect, useRef, useState } from "react";

const daysOfWeek = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

export function ActivityChart() {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Generate sample data for demonstration
    // In a real app, this would come from an API call
    setLoading(true);
    const timer = setTimeout(() => {
      setData([40, 65, 45, 70, 90, 60, 30]);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="h-64 flex items-end justify-between">
      {loading ? (
        // Loading skeleton
        Array(7).fill(0).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-12 bg-light-300 dark:bg-dark-600 rounded-t-lg animate-pulse" style={{ height: `${Math.random() * 70 + 20}%` }}></div>
            <span className="text-xs text-dark-500 dark:text-light-500 mt-2">{daysOfWeek[index]}</span>
          </div>
        ))
      ) : (
        // Actual chart
        data.map((value, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-12 bg-primary rounded-t-lg transition-all duration-500 ease-in-out" 
              style={{ height: `${value}%` }}
            ></div>
            <span className="text-xs text-dark-500 dark:text-light-500 mt-2">{daysOfWeek[index]}</span>
          </div>
        ))
      )}
    </div>
  );
}
