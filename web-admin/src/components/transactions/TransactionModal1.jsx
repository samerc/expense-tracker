import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function TransactionModal({ isOpen, onClose, onSave, transaction, accounts, categories }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense',
    lines: [
      {
        accountId: '',
        amount: '',
        currency: 'USD',
        direction: 'expense',
        categoryId: '',
        notes: '',
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Populate form when editing
  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        date: transaction.date.split('T')[0],
        description: transaction.description,
        type: transaction.type,
        lines: transaction.lines.map(line => ({
          accountId: line.accountId || '',
          amount: Math.abs(line.amount).toString(),
          currency: line.currency || 'USD',
          direction: line.direction || 'expense',
          categoryId: line.categoryId || '',
          notes: line.notes || '',
        }))
      });
    } else if (isOpen) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'expense',
        lines: [
          {
            accountId: '',
            amount: '',
            currency: 'USD',
            direction: 'expense',
            categoryId: '',
            notes: '',
          }
        ]
      });
    }
    setErrors({});
  }, [transaction, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    formData.lines.forEach((line, index) => {
      if (!line.accountId) newErrors[`line${index}_account`] = 'Account is required';
      if (!line.amount || parseFloat(line.amount) <= 0) newErrors[`line${index}_amount`] = 'Valid amount is required';
      if (formData.type !== 'transfer' && !line.categoryId) newErrors[`line${index}_category`] = 'Category is required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        date: formData.date,
        description: formData.description,
        lines: formData.lines.map(line => ({
          accountId: line.accountId,
          amount: parseFloat(line.amount) * (line.direction === 'expense' ? -1 : 1),
          currency: line.currency,
          direction: line.direction,
          categoryId: line.categoryId || null,
          notes: line.notes || null,
        }))
      };
      await onSave(payload, transaction?.id);
      onClose();
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, {
        accountId: '',
        amount: '',
        currency: 'USD',
        direction: formData.type === 'income' ? 'income' : 'expense',
        categoryId: '',
        notes: '',
      }]
    });
  };

  const removeLine = (index) => {
    if (formData.lines.length === 1) return;
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const handleTypeChange = (type) => {
    const newDirection = type === 'income' ? 'income' : 'expense';
    const newLines = formData.lines.map(line => ({ ...line, direction: newDirection }));
    setFormData({ ...formData, type, lines: newLines });
  };

  if (!isOpen) return null;

  const availableCategories = formData.type === 'income' ? categories?.income || [] : categories?.expense || [];
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {transaction ? 'Edit Transaction' : 'Add Transaction'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{errors.submit}</div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Date *</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={`input ${errors.date ? 'border-red-500' : ''}`} />
                {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="label">Type *</label>
                <select value={formData.type} onChange={(e) => handleTypeChange(e.target.value)} className="input">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="label">Description *</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Grocery shopping" className={`input ${errors.description ? 'border-red-500' : ''}`} />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Transaction Details</label>
                {formData.type !== 'transfer' && (
                  <button type="button" onClick={addLine} className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                    <Plus className="w-4 h-4" /><span>Add Split</span>
                  </button>
                )}
              </div>
              {formData.lines.map((line, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {formData.type === 'transfer' ? 'Transfer Details' : `Line ${index + 1}`}
                    </span>
                    {formData.lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(index)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Account *</label>
                      <select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} className={`input ${errors[`line${index}_account`] ? 'border-red-500' : ''}`}>
                        <option value="">Select account</option>
                        {accounts?.map((account) => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                      {errors[`line${index}_account`] && <p className="text-xs text-red-600 mt-1">{errors[`line${index}_account`]}</p>}
                    </div>
                    <div>
                      <label className="label">Amount *</label>
                      <input type="number" step="0.01" min="0" value={line.amount} onChange={(e) => updateLine(index, 'amount', e.target.value)} placeholder="0.00" className={`input ${errors[`line${index}_amount`] ? 'border-red-500' : ''}`} />
                      {errors[`line${index}_amount`] && <p className="text-xs text-red-600 mt-1">{errors[`line${index}_amount`]}</p>}
                    </div>
                  </div>
                  {formData.type !== 'transfer' && (
                    <div>
                      <label className="label">Category *</label>
                      <select value={line.categoryId} onChange={(e) => updateLine(index, 'categoryId', e.target.value)} className={`input ${errors[`line${index}_category`] ? 'border-red-500' : ''}`}>
                        <option value="">Select category</option>
                        {availableCategories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </select>
                      {errors[`line${index}_category`] && <p className="text-xs text-red-600 mt-1">{errors[`line${index}_category`]}</p>}
                    </div>
                  )}
                  <div>
                    <label className="label">Notes (optional)</label>
                    <input type="text" value={line.notes} onChange={(e) => updateLine(index, 'notes', e.target.value)} placeholder="Additional details..." className="input" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : transaction ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}