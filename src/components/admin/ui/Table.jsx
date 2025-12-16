import { cn } from '../../../utils/admin/cn';

export const Table = ({ children, className }) => {
  return (
    <div className="w-full">
      <table className={cn('w-full table-fixed', className)}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children }) => {
  return (
    <thead className="bg-gray-100 dark:bg-gray-700">
      {children}
    </thead>
  );
};

export const TableBody = ({ children }) => {
  return (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className, onClick }) => {
  return (
    <tr 
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHead = ({ children, className }) => {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className }) => {
  return (
    <td className={cn('px-4 py-3 text-sm text-gray-900 dark:text-gray-100', className)}>
      {children}
    </td>
  );
};







