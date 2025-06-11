import React, { useState } from 'react';
import { ExportTemplate, ExportConfig } from '../types/export';
import { EXPORT_TEMPLATES, createCustomTemplate } from '../utils/exportSystem';
import { Plus, Edit, Trash2, Copy, Save, X } from 'lucide-react';

interface ExportTemplateManagerProps {
  onTemplateSelect: (template: ExportTemplate) => void;
  className?: string;
}

const ExportTemplateManager: React.FC<ExportTemplateManagerProps> = ({
  onTemplateSelect,
  className = ''
}) => {
  const [customTemplates, setCustomTemplates] = useState<ExportTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    useCase: '',
    instructions: [''],
    config: {
      format: 'excel' as const,
      includeRawData: true,
      includeSummary: true,
      includeStateAnalysis: true,
      includeRecommendations: true,
      sanitizeData: false
    }
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) return;

    const template = createCustomTemplate(
      newTemplate.name,
      newTemplate.description,
      newTemplate.config,
      newTemplate.instructions.filter(i => i.trim()),
      newTemplate.useCase
    );

    setCustomTemplates([...customTemplates, template]);
    setIsCreating(false);
    resetNewTemplate();
  };

  const handleEditTemplate = (template: ExportTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      useCase: template.useCase,
      instructions: [...template.instructions],
      config: { ...template.config }
    });
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplate.name.trim()) return;

    const updatedTemplate = {
      ...editingTemplate,
      name: newTemplate.name,
      description: newTemplate.description,
      useCase: newTemplate.useCase,
      instructions: newTemplate.instructions.filter(i => i.trim()),
      config: newTemplate.config
    };

    setCustomTemplates(customTemplates.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    ));
    setEditingTemplate(null);
    resetNewTemplate();
  };

  const handleDeleteTemplate = (templateId: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
  };

  const handleDuplicateTemplate = (template: ExportTemplate) => {
    const duplicated = createCustomTemplate(
      `${template.name} (Copy)`,
      template.description,
      { ...template.config },
      [...template.instructions],
      template.useCase
    );
    setCustomTemplates([...customTemplates, duplicated]);
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      useCase: '',
      instructions: [''],
      config: {
        format: 'excel',
        includeRawData: true,
        includeSummary: true,
        includeStateAnalysis: true,
        includeRecommendations: true,
        sanitizeData: false
      }
    });
  };

  const addInstruction = () => {
    setNewTemplate({
      ...newTemplate,
      instructions: [...newTemplate.instructions, '']
    });
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...newTemplate.instructions];
    updated[index] = value;
    setNewTemplate({ ...newTemplate, instructions: updated });
  };

  const removeInstruction = (index: number) => {
    setNewTemplate({
      ...newTemplate,
      instructions: newTemplate.instructions.filter((_, i) => i !== index)
    });
  };

  const allTemplates = [...EXPORT_TEMPLATES, ...customTemplates];

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Export Templates</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage and customize export templates for different use cases
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Template Creation/Edit Form */}
        {(isCreating || editingTemplate) && (
          <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h4>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                  resetNewTemplate();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe the template's purpose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Use Case
                  </label>
                  <input
                    type="text"
                    value={newTemplate.useCase}
                    onChange={(e) => setNewTemplate({ ...newTemplate, useCase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="When to use this template"
                  />
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <select
                    value={newTemplate.config.format}
                    onChange={(e) => setNewTemplate({
                      ...newTemplate,
                      config: { ...newTemplate.config, format: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="pdf">PDF (.pdf)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include Content
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.config.includeSummary}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, includeSummary: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Executive Summary</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.config.includeStateAnalysis}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, includeStateAnalysis: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">State Analysis</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.config.includeRecommendations}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, includeRecommendations: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Recommendations</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.config.includeRawData}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, includeRawData: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Raw Data</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTemplate.config.sanitizeData}
                        onChange={(e) => setNewTemplate({
                          ...newTemplate,
                          config: { ...newTemplate.config, sanitizeData: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Sanitize Data</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <div className="space-y-2">
                {newTemplate.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter instruction"
                    />
                    <button
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addInstruction}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Instruction
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                  resetNewTemplate();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        )}

        {/* Template List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-800">{template.name}</h4>
                <div className="flex items-center space-x-1">
                  {!EXPORT_TEMPLATES.find(t => t.id === template.id) && (
                    <>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-gray-500 hover:text-blue-600"
                        title="Edit template"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-gray-500 hover:text-red-600"
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="text-gray-500 hover:text-green-600"
                    title="Duplicate template"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2">{template.description}</p>
              <p className="text-xs text-gray-500 mb-3">{template.useCase}</p>

              <div className="mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                  {template.config.format}
                </span>
              </div>

              <button
                onClick={() => onTemplateSelect(template)}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExportTemplateManager;