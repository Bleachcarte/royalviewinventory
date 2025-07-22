import React, { useState, useEffect } from 'react';
import { useGoogleSheetsInventory } from '../../contexts/GoogleSheetsContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Edit } from 'lucide-react';
import { InventoryItem } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, onClose, item }) => {
  const { updateItem, categories, addCategory, addSubcategory } = useGoogleSheetsInventory();
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

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        stock1: item.stock1,
        stock2: item.stock2,
        stockIn: 0, // Always start at 0 for the form
        stockOut: 0, // Always start at 0 for the form
        purpose: item.purpose,
        balance: item.balance,
        balanceAfterReconciliation: item.balanceAfterReconciliation
      });
    }
  }, [item]);

  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    
    try {
      await updateItem(item.id, {
        ...formData,
        stockIn: item.stockIn + formData.stockIn, // Add to previous value
        stockOut: item.stockOut + formData.stockOut, // Add to previous value
        lastModifiedBy: user?.email || ''
      });
      addNotification(`Item "${item.code}" was edited by ${user?.name || user?.email}`);
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

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

  if (!isOpen || !item) return null;

  const isCoreAdmin = user?.role === 'core_admin';

  const allCategories = [...categories];
  if (formData.category && !categories.some(cat => cat.name === formData.category)) {
    allCategories.push({ id: 'custom', name: formData.category, subcategories: [] });
  }
  const currentCategory = allCategories.find(cat => cat.name === formData.category);
  const allSubcategories = currentCategory ? [...currentCategory.subcategories] : [];
  if (formData.subcategory && currentCategory && !allSubcategories.some(sub => sub.name === formData.subcategory)) {
    allSubcategories.push({ id: 'custom', name: formData.subcategory, categoryId: currentCategory.id });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
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
                readOnly={!isCoreAdmin}
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
                readOnly={!isCoreAdmin}
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
                disabled={!isCoreAdmin}
              >
                <option value="">Select Category</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
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
                disabled={!isCoreAdmin || !formData.category}
              >
                <option value="">Select Subcategory</option>
                {allSubcategories.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>
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
                readOnly={!isCoreAdmin}
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
                readOnly={!isCoreAdmin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balance
              </label>
              <input
                type="number"
                min="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                readOnly={!isCoreAdmin}
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
                readOnly={!isCoreAdmin}
              />
            </div>
            {/* In/Out fields always editable, and show a note for non-core admins */}
            <div className="col-span-2">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    In (Quantity In)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockIn}
                    onChange={(e) => setFormData({ ...formData, stockIn: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">Current: {item?.stockIn ?? 0}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Out (Quantity Out)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockOut}
                    onChange={(e) => setFormData({ ...formData, stockOut: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">Current: {item?.stockOut ?? 0}</div>
                </div>
              </div>
              {!isCoreAdmin && (
                <div className="mt-2 text-blue-700 font-bold text-center">
                  Only "In" and "Out" can be changed. Other fields are locked.<br/>
                  <span className="text-xs text-gray-600">Any value entered will be <b>added</b> to the current value.</span>
                </div>
              )}
              {isCoreAdmin && (
                <div className="mt-2 text-blue-700 font-bold text-center text-xs">
                  Any value entered in "In" or "Out" will be <b>added</b> to the current value.
                </div>
              )}
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
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;