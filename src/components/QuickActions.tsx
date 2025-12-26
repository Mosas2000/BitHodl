interface QuickActionsProps {
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  disabled?: boolean;
}

export function QuickActions({ onDepositClick, onWithdrawClick, disabled = false }: QuickActionsProps) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        <button 
          className="w-full btn-primary py-3" 
          onClick={onDepositClick}
          disabled={disabled}
        >
          Deposit STX
        </button>
        <button 
          className="w-full btn-secondary py-3" 
          onClick={onWithdrawClick}
          disabled={disabled}
        >
          Withdraw STX
        </button>
      </div>
    </div>
  );
}