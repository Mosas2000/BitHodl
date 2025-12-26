import { useState } from 'react';
import { DateRange } from '@/types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    onDateRangeChange({
      ...dateRange,
      startDate: newStartDate
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    onDateRangeChange({
      ...dateRange,
      endDate: newEndDate
    });
  };

  const setPresetRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    onDateRangeChange({
      startDate,
      endDate
    });
    setIsOpen(false);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm">
          {formatDateForInput(dateRange.startDate)} - {formatDateForInput(dateRange.endDate)}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formatDateForInput(dateRange.startDate)}
                onChange={handleStartDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-stacks-blue focus:border-stacks-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formatDateForInput(dateRange.endDate)}
                onChange={handleEndDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-stacks-blue focus:border-stacks-blue"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Select</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPresetRange(7)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => setPresetRange(30)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => setPresetRange(90)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Last 90 days
                </button>
                <button
                  onClick={() => setPresetRange(365)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Last year
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-stacks-blue text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}