import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CloudUpload, Sparkles, Eye, Trash2, Plus, FileText, Download, Save, X } from 'lucide-react';
import { PropertyData, AssetType } from './types';

interface PropertyFormProps {
  propertyId?: string;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ propertyId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = propertyId || params.id;
  const isEditing = !!id;

  const [activeTab, setActiveTab] = useState('Basic Info');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<PropertyData>({
    name: '',
    location: '',
    assetType: AssetType.RESIDENTIAL,
    description: '',
    totalValue: '',
    sharePrice: '',
    yield: '',
    images: [],
    documents: []
  });

  useEffect(() => {
    if (isEditing && id) {
      const fetchProperty = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
          const response = await fetch(`/api/admin/properties/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const prop = result.data;
              let images: PropertyImage[] = [];
              
              if (Array.isArray(prop.images) && prop.images.length > 0) {
                images = prop.images.map((img: any, idx: number) => {
                  // Handle both string URLs and object format
                  if (typeof img === 'string') {
                    return {
                      id: idx.toString(),
                      url: img,
                      isMain: idx === 0
                    };
                  }
                  return {
                    id: img.id || idx.toString(),
                    url: img.url || (typeof img === 'string' ? img : ''),
                    isMain: img.isMain !== undefined ? img.isMain : idx === 0
                  };
                });
              }
              
              setData({
                name: prop.name || '',
                location: prop.address || prop.district || '',
                assetType: prop.propertyType || prop.property_type || AssetType.RESIDENTIAL,
                description: prop.description || '',
                totalValue: String(prop.totalValuation || prop.total_valuation || ''),
                sharePrice: String(prop.pricePerShare || prop.price_per_share || ''),
                yield: String(prop.expectedAnnualYield || prop.expected_annual_yield || ''),
                images: images,
                documents: Array.isArray(prop.documents) ? prop.documents : []
              });
            } else {
              setError('Property not found');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            setError(errorData.error || 'Failed to load property');
          }
        } catch (err) {
          console.error('Error fetching property:', err);
          setError('Failed to load property');
        } finally {
          setLoading(false);
        }
      };

      fetchProperty();
    }
  }, [id, isEditing]);

  const handleChange = (field: keyof PropertyData, value: any) => {
    setData({ ...data, [field]: value });
    setError(null);
  };

  const handleGenerateDescription = async () => {
    if (!data.name || !data.location) return;
    setIsGenerating(true);
    // TODO: Implement Gemini service if needed
    // const desc = await generatePropertyDescription(data.name, data.location, data.assetType);
    // handleChange('description', desc);
    setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      const newImage = {
        id: Date.now().toString(),
        url: imageUrl,
        isMain: data.images.length === 0
      };
      handleChange('images', [...data.images, newImage]);
    }
  };

  const removeImage = (imageId: string) => {
    handleChange('images', data.images.filter(img => img.id !== imageId));
  };

  const setMainImage = (imageId: string) => {
    const updatedImages = data.images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    handleChange('images', updatedImages);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      
      // Prepare data for API
      const payload: any = {
        name: data.name,
        description: data.description || null,
        address: data.location,
        property_type: data.assetType,
        total_valuation: data.totalValue,
        price_per_share: data.sharePrice,
        expected_annual_yield: data.yield || null,
        images: data.images.length > 0 
          ? data.images.map(img => {
              // If image URL is a blob URL (from file upload), we need to handle it differently
              // For now, just save the URL - in production you'd upload to storage first
              return {
                id: img.id,
                url: img.url,
                isMain: img.isMain
              };
            })
          : []
      };

      // Calculate total_shares from total value and share price
      if (data.totalValue && data.sharePrice) {
        const totalValue = parseFloat(String(data.totalValue).replace(/[^0-9.]/g, ''));
        const sharePrice = parseFloat(String(data.sharePrice).replace(/[^0-9.]/g, ''));
        if (sharePrice > 0 && !isNaN(totalValue) && !isNaN(sharePrice)) {
          payload.total_shares = Math.floor(totalValue / sharePrice);
        } else {
          setError('Invalid total value or share price');
          setSaving(false);
          return;
        }
      } else if (!isEditing) {
        setError('Total value and share price are required');
        setSaving(false);
        return;
      }

      let response;
      if (isEditing && id) {
        response = await fetch(`/api/admin/properties/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        if (!payload.total_shares) {
          setError('Total shares could not be calculated. Please check your values.');
          setSaving(false);
          return;
        }
        response = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save property');
      }

      navigate('/admin/properties');
    } catch (err: any) {
      setError(err.message || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-charcoal dark:text-white">
          {isEditing ? 'Edit Property' : 'Create New Property'}
        </h1>
        <button
          onClick={() => navigate('/admin/properties')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="size-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex-1 max-w-[800px]">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 min-h-[600px]">
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 gap-8 overflow-x-auto scrollbar-hide">
            {['Basic Info', 'Financials', 'Media', 'Legal Docs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-5 shrink-0 transition-colors ${
                  activeTab === tab 
                    ? 'border-primary text-charcoal dark:text-white' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white'
                }`}
              >
                <p className="text-sm font-bold tracking-tight">{tab}</p>
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Section: Basic Info */}
            {activeTab === 'Basic Info' && (
              <div id="basic-info" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-charcoal dark:text-white text-lg font-bold mb-4">Property Basics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Property Name</label>
                    <input 
                      type="text"
                      value={data.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white px-4 bg-white dark:bg-gray-900"
                      placeholder="e.g. Regency Terrace Penthouse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Asset Type</label>
                    <select 
                      value={data.assetType}
                      onChange={(e) => handleChange('assetType', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white px-4 bg-white dark:bg-gray-900"
                    >
                      {Object.values(AssetType).map((type) => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Location</label>
                    <input 
                      type="text"
                      value={data.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white px-4 bg-white dark:bg-gray-900"
                      placeholder="District, Ulaanbaatar"
                    />
                  </div>
                  <div className="md:col-span-2 relative">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-500 dark:text-gray-400">Description</label>
                      <button 
                        onClick={handleGenerateDescription}
                        disabled={isGenerating || !data.name}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-600 disabled:opacity-50 transition-colors"
                      >
                        <Sparkles className={`size-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        {isGenerating ? 'GENERATING...' : 'GENERATE WITH AI'}
                      </button>
                    </div>
                    <textarea 
                      value={data.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white p-4 resize-none bg-white dark:bg-gray-900"
                      placeholder="Describe the asset's potential..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Financials */}
            {activeTab === 'Financials' && (
              <div id="financials" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-charcoal dark:text-white text-lg font-bold mb-4">Financial Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Total Value (₮)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₮</span>
                      <input 
                        type="text"
                        value={data.totalValue}
                        onChange={(e) => handleChange('totalValue', e.target.value)}
                        className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white pl-8 pr-4 bg-white dark:bg-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Share Price (₮)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">₮</span>
                      <input 
                        type="text"
                        value={data.sharePrice}
                        onChange={(e) => handleChange('sharePrice', e.target.value)}
                        className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white pl-8 pr-4 bg-white dark:bg-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Proj. Yield (%)</label>
                    <div className="relative">
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">%</span>
                      <input 
                        type="text"
                        value={data.yield}
                        onChange={(e) => handleChange('yield', e.target.value)}
                        className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white px-4 bg-white dark:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Media */}
            {activeTab === 'Media' && (
              <div id="media" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-charcoal dark:text-white text-lg font-bold mb-4">Gallery Assets</h2>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-gray-50/30 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group cursor-pointer relative">
                  <input 
                    type="file" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*"
                    multiple
                  />
                  <CloudUpload className="text-primary size-10 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-charcoal dark:text-white font-bold mb-1">Drag and drop property images</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">High resolution JPEG or PNG, max 10MB per file</p>
                  <div className="mt-4 px-6 py-2 bg-charcoal dark:bg-gray-700 text-white text-sm font-bold rounded-lg group-hover:opacity-90 transition-opacity">
                    Select Files
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {data.images.map((img) => (
                    <div 
                      key={img.id}
                      className={`aspect-square rounded-lg bg-cover bg-center relative group overflow-hidden ${img.isMain ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{ backgroundImage: `url('${img.url}')` }}
                    >
                      <div className="absolute inset-0 bg-charcoal/40 dark:bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setMainImage(img.id)}
                          title="Set as Main"
                          className="size-8 bg-white rounded-full flex items-center justify-center text-charcoal hover:text-primary transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button 
                          onClick={() => removeImage(img.id)}
                          title="Delete"
                          className="size-8 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {img.isMain && (
                        <span className="absolute top-2 left-2 bg-primary text-charcoal dark:text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                  
                  <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 border-dashed text-gray-500 dark:text-gray-400 hover:text-primary hover:border-primary transition-colors cursor-pointer" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                    <Plus className="size-6" />
                  </div>
                </div>
              </div>
            )}

            {/* Section: Legal Docs */}
            {activeTab === 'Legal Docs' && (
              <div id="legal-docs" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-charcoal dark:text-white text-lg font-bold mb-4">Legal Documentation</h2>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 flex gap-3">
                  <div className="text-blue-500 shrink-0 mt-0.5">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Required Documents</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Please ensure all uploaded documents are signed and notarized where applicable. The following documents are required for public listing: Title Deed, Valuation Report, and Insurance Certificate.</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/30 dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors mb-8 group cursor-pointer">
                  <CloudUpload className="text-gray-500 dark:text-gray-400 group-hover:text-primary size-10 mb-4 transition-colors" />
                  <p className="text-charcoal dark:text-white font-bold mb-1">Upload Legal Documents</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">PDF or DOCX up to 25MB</p>
                  <button className="mt-4 px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-charcoal dark:text-white text-sm font-bold rounded-lg group-hover:border-primary transition-colors">Browse System</button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Uploaded Files</h3>
                  
                  {data.documents && data.documents.length > 0 ? (
                    data.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-800">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-charcoal dark:text-white">{doc.name || `Document ${idx + 1}`}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">VERIFIED</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{doc.size || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-charcoal dark:text-white transition-colors"><Download size={16} /></button>
                          <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No documents uploaded yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => navigate('/admin/properties')}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-charcoal dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {isEditing ? 'Update Property' : 'Create Property'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyForm;
