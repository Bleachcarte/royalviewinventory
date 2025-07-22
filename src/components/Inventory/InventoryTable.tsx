import React, { useState, useMemo, useRef } from 'react';
import { useGoogleSheetsInventory } from '../../contexts/GoogleSheetsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Printer,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Upload
} from 'lucide-react';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import Papa from 'papaparse';

interface SortConfig {
  key: keyof any;
  direction: 'asc' | 'desc';
}

const InventoryTable: React.FC = () => {
  const { items, searchItems, getFormattedDescription, deleteItem, addItem } = useGoogleSheetsInventory();
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = useMemo(() => {
    let filtered = searchQuery ? searchItems(searchQuery) : items;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Sort items
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, searchQuery, searchItems, selectedCategory, sortConfig]);

  const handleSort = (key: keyof any) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      ['Code', 'Description', 'Category', 'Subcategory', 'Stock1', 'Stock2', 'StockIn', 'StockOut', 'Balance', 'Out Date', 'Purpose', 'Created By', 'Last Modified By'],
      ...filteredItems.map((item: any) => [
        item.code,
        item.description,
        item.category,
        item.subcategory,
        item.stock1,
        item.stock2,
        item.stockIn,
        item.stockOut,
        item.balance,
        (item.stockOut > 0 && item.stockOutDate) ? (item.stockOutDate instanceof Date ? item.stockOutDate.toLocaleDateString() : '') : '',
        item.purpose,
        item.createdBy,
        item.lastModifiedBy
      ])
    ];
    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        if (!Array.isArray(results.data)) {
          setImportStatus('Import failed: Invalid CSV format.');
          return;
        }
        let successCount = 0;
        let errorCount = 0;
        for (const [i, row] of results.data.entries()) {
          try {
            // Validate required fields
            if (!row.code || !row.description || !row.category) {
              errorCount++;
              continue;
            }
            await addItem({
              code: row.code || '',
              description: row.description || '',
              category: row.category || '',
              subcategory: row.subcategory || '',
              stock1: Number(row.stock1) || 0,
              stock2: Number(row.stock2) || 0,
              stockIn: Number(row.stockIn) || 0,
              stockOut: Number(row.stockOut) || 0,
              balance: Number(row.balance) || 0,
              stockInDate: new Date(),
              stockOutDate: row['Out Date'] ? new Date(row['Out Date']) : undefined,
              purpose: row.purpose || '',
              balanceAfterReconciliation: Number(row.balanceAfterReconciliation) || 0,
              createdBy: row.createdBy || '',
              lastModifiedBy: row.lastModifiedBy || ''
            });
            successCount++;
          } catch (err) {
            errorCount++;
          }
        }
        setImportStatus(`Import complete: ${successCount} items added, ${errorCount} errors.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err) => {
        setImportStatus('Import failed: ' + err.message);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleDelete = (item: any) => {
    deleteItem(item.id);
    addNotification(`Item "${item.code}" was deleted by ${user?.name || user?.email}`);
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(item => item.category)));
    return ['all', ...cats];
  }, [items]);

  const canEdit = hasPermission('write');
  const canDelete = hasPermission('delete');

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by code, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          {importStatus && (
            <div className="text-sm text-blue-700 mt-2">{importStatus}</div>
          )}
          
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('code')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Code</span>
                    {sortConfig.key === 'code' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('description')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Description</span>
                    {sortConfig.key === 'description' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('stock1')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Stock1</span>
                    {sortConfig.key === 'stock1' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('stock2')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Stock2</span>
                    {sortConfig.key === 'stock2' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('stockIn')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>In</span>
                    {sortConfig.key === 'stockIn' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">In Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('stockOut')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Out</span>
                    {sortConfig.key === 'stockOut' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Out Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Purpose</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">
                  <button
                    onClick={() => handleSort('balance')}
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <span>Balance</span>
                    {sortConfig.key === 'balance' && (
                      <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">After Recon</th>
                {(canEdit || canDelete) && (
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm font-medium text-gray-900">{item.code}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{item.description}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{item.category}: {item.subcategory}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-gray-900">{item.stock1}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-gray-900">{item.stock2}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{item.stockIn}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm text-gray-600">
                      {item.stockInDate?.toLocaleDateString() || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-sm font-medium text-red-600">{item.stockOut}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm text-gray-600">
                      {(item.stockOut > 0 && item.stockOutDate) ? (item.stockOutDate instanceof Date ? item.stockOutDate.toLocaleDateString() : '') : ''}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">{item.purpose}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`text-sm font-medium ${
                      item.balance < 10 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.balance}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-sm font-medium text-gray-900">{item.balanceAfterReconciliation}</span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this item?')) {
                                handleDelete(item);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {filteredItems.length} of {items.length} items</span>
        <span>Last updated: {new Date().toLocaleDateString()}</span>
      </div>

      {/* Add Item Modal */}
      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />

      {/* Edit Item Modal */}
      <EditItemModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
    </div>
  );
};

export default InventoryTable;