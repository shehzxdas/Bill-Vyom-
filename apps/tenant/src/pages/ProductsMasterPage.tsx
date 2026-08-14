/**
 * Bill Vyom — Products Master Data Management Page
 * Production-grade Master Data UI with Zero Fake Data Policy.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  Search,
  Filter,
  Layers,
  Tag,
  Barcode,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCcw,
} from 'lucide-react';
import { Product, ProductCategory, UnitOfMeasure, ProductType, ProductStatus } from '../../../../src/domain/types';

export default function ProductsMasterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // New Product Form State
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [brandName, setBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState<ProductType>('GOODS');
  const [baseUomId, setBaseUomId] = useState('');

  // New Category Form State
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');

  const token = localStorage.getItem('billvyom_jwt_token');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        q: searchQuery,
        status: selectedStatus,
        type: selectedType,
        category_id: selectedCategory,
      });

      const res = await fetch(`/api/v1/master/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setProducts(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.total_pages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      } else {
        setError(json.errors?.[0]?.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error loading master products dataset');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, uomRes] = await Promise.all([
        fetch('/api/v1/master/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/master/uom/units', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const catJson = await catRes.json();
      const uomJson = await uomRes.json();

      if (catJson.success) setCategories(catJson.data || []);
      if (uomJson.success) setUoms(uomJson.data || []);
    } catch (err) {
      console.error('Failed loading metadata', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, selectedCategory, selectedType, selectedStatus]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCode || !productName || !baseUomId) {
      alert('Product code, name, and base UOM are required.');
      return;
    }

    try {
      const res = await fetch('/api/v1/master/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_code: productCode,
          name: productName,
          description,
          brand_name: brandName,
          category_id: categoryId || null,
          product_type: productType,
          base_uom_id: baseUomId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setProductCode('');
        setProductName('');
        setDescription('');
        setBrandName('');
        fetchProducts();
      } else {
        alert(json.errors?.[0]?.message || 'Failed to create product');
      }
    } catch (err) {
      alert('Network error creating product');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryCode || !categoryName) {
      alert('Category code and name required.');
      return;
    }

    try {
      const res = await fetch('/api/v1/master/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_code: categoryCode,
          category_name: categoryName,
          parent_id: parentCategoryId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCategoryModalOpen(false);
        setCategoryCode('');
        setCategoryName('');
        fetchMetadata();
      } else {
        alert(json.errors?.[0]?.message || 'Failed to create category');
      }
    } catch (err) {
      alert('Network error creating category');
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      const res = await fetch(`/api/v1/master/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      } else {
        alert(json.errors?.[0]?.message || 'Failed to archive product');
      }
    } catch (err) {
      alert('Network error archiving product');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-[#1E3A8A]" />
            Products Master Data
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Global catalog foundation for SKUs, Barcodes, Categories, and Tax Classifications across all entities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            New Category
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e3a8a]/90 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Product
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by code, name, brand, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">All Types</option>
            <option value="GOODS">Goods</option>
            <option value="SERVICE">Service</option>
            <option value="DIGITAL">Digital</option>
            <option value="BUNDLE">Bundle</option>
            <option value="COMPOSITE">Composite</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            onClick={fetchProducts}
            className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Refresh List"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500">Loading master products catalog...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 bg-red-50 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No Products Registered</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Production database is currently empty. Click "Create Product" above to define your master catalog.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Product Code / SKU</th>
                    <th className="px-4 py-3">Name & Brand</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Base UOM</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    const uom = uoms.find((u) => u.id === p.base_uom_id);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#111827]">{p.product_code}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.brand_name && <div className="text-[10px] text-gray-400">{p.brand_name}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                            {p.product_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{cat?.category_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{uom?.uom_code || 'UNIT'}</td>
                        <td className="px-4 py-3">
                          {p.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </span>
                          ) : p.status === 'ARCHIVED' ? (
                            <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                              <Archive className="w-3 h-3 text-gray-400" /> Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <XCircle className="w-3 h-3 text-amber-600" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleArchiveProduct(p.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-gray-500 bg-white">
              <div>
                Showing {products.length} of {totalCount} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Create New Master Product</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-001"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="Acme"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Industrial Pressure Sensor"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed specs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Product Type</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as ProductType)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="GOODS">Goods</option>
                    <option value="SERVICE">Service</option>
                    <option value="DIGITAL">Digital</option>
                    <option value="BUNDLE">Bundle</option>
                    <option value="COMPOSITE">Composite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">Base UOM *</label>
                  <select
                    required
                    value={baseUomId}
                    onChange={(e) => setBaseUomId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 focus:border-[#1E3A8A] focus:outline-none"
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.uom_name} ({u.uom_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-medium hover:bg-[#1e3a8a]/90"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900">Create Product Category</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  placeholder="ELEC"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Electronics"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg font-medium hover:bg-[#1e3a8a]/90"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
