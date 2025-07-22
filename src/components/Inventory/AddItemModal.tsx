import React, { useState } from 'react';
import { useGoogleSheetsInventory } from '../../contexts/GoogleSheetsContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Package } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const { addItem, categories, addCategory, addSubcategory } = useGoogleSheetsInventory();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: '',
    subcategory: '',
    stock1: 0,
    stock2: 0,
    stockIn: 0,
    stockOut: 0,
    purpose: '',
    balance: 0,
    balanceAfterReconciliation: 0
  });
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const { addNotification } = useNotifications();

  const isCoreAdmin = user?.role === 'core_admin';

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) return;
    await addCategory(newCategory.trim());
    setFormData({ ...formData, category: newCategory.trim(), subcategory: '' });
    setNewCategory('');
  };

  const handleAddSubcategory = async () => {
    if (!formData.category || !newSubcategory.trim()) return;
    const cat = categories.find(cat => cat.name === formData.category);
    if (!cat) return;
    if (cat.subcategories.some(sub => sub.name.toLowerCase() === newSubcategory.trim().toLowerCase())) return;
    await addSubcategory(cat.id, newSubcategory.trim());
    setFormData({ ...formData, subcategory: newSubcategory.trim() });
    setNewSubcategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedStockIn = formData.stock1 + formData.stock2;
      const calculatedBalance = calculatedStockIn - formData.stockOut;
      
      await addItem({
        ...formData,
        stockIn: calculatedStockIn,
        balance: calculatedBalance,
        stockInDate: new Date(),
        stockOutDate: new Date(),
        createdBy: user?.email || '',
        lastModifiedBy: user?.email || ''
      });
      addNotification(`Item "${formData.code}" was added by ${user?.name || user?.email}`);
      setFormData({
        code: '',
        description: '',
        category: '',
        subcategory: '',
        stock1: 0,
        stock2: 0,
        stockIn: 0,
        stockOut: 0,
        purpose: '',
        balance: 0,
        balanceAfterReconciliation: 0
      });
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., LAPTOP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., MacBook Pro 16"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {isCoreAdmin && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Add new category"
                    className="flex-1 px-2 py-1 border border-blue-400 rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory *
              </label>
              <select
                required
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.category}
              >
                <option value="">Select Subcategory</option>
                {categories
                  .find(cat => cat.name === formData.category)
                  ?.subcategories.map(sub => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
              </select>
              {isCoreAdmin && formData.category && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSubcategory}
                    onChange={e => setNewSubcategory(e.target.value)}
                    placeholder="Add new subcategory"
                    className="flex-1 px-2 py-1 border border-blue-400 rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock 1
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock1}
                onChange={(e) => setFormData({ ...formData, stock1: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock 2
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock2}
                onChange={(e) => setFormData({ ...formData, stock2: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance After Reconciliation
              </label>
              <input
                type="number"
                min="0"
                value={formData.balanceAfterReconciliation}
                onChange={(e) => setFormData({ ...formData, balanceAfterReconciliation: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Purpose or notes for this item"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;