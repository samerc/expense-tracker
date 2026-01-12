import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with optional message
 *
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} message - Optional loading message to display
 * @param {boolean} fullPage - If true, centers in full page height
 */
export default function LoadingSpinner({ size = 'md', message, fullPage = true }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}
