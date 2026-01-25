import React, { useState, useCallback } from 'react';
import type { TitlePage } from '../../types/screenplay';
import { useDocumentStore } from '../../stores/documentStore';
import './TitlePageEditor.css';

interface TitlePageEditorProps {
  onClose: () => void;
}

export const TitlePageEditor: React.FC<TitlePageEditorProps> = ({ onClose }) => {
  const { screenplay, updateTitlePage } = useDocumentStore();

  const [formData, setFormData] = useState<TitlePage>({
    title: screenplay.titlePage?.title || screenplay.title || '',
    titleFontSize: screenplay.titlePage?.titleFontSize || 'medium',
    writtenBy: screenplay.titlePage?.writtenBy || 'Written by',
    author: screenplay.titlePage?.author || screenplay.author || '',
    basedOn: screenplay.titlePage?.basedOn || '',
    contactInfo: screenplay.titlePage?.contactInfo || '',
    draftDate: screenplay.titlePage?.draftDate || '',
    copyright: screenplay.titlePage?.copyright || '',
  });

  const titleFontSizeMap = {
    small: '12pt',
    medium: '18pt',
    large: '24pt',
  };

  const handleChange = useCallback((field: keyof TitlePage, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(() => {
    updateTitlePage(formData);
    onClose();
  }, [formData, updateTitlePage, onClose]);

  const handleClear = useCallback(() => {
    updateTitlePage(undefined);
    onClose();
  }, [updateTitlePage, onClose]);

  return (
    <div className="title-page-overlay" onClick={onClose}>
      <div className="title-page-modal" onClick={(e) => e.stopPropagation()}>
        <div className="title-page-header">
          <h2>Title Page</h2>
          <button className="title-page-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="title-page-content">
          <div className="title-page-preview">
            <div className="preview-page screenplay-font">
              <div
                className="preview-title"
                style={{ fontSize: titleFontSizeMap[formData.titleFontSize || 'medium'] }}
              >
                {formData.title || 'UNTITLED'}
              </div>
              <div className="preview-written-by">{formData.writtenBy}</div>
              <div className="preview-author">{formData.author}</div>
              {formData.basedOn && (
                <div className="preview-based-on">{formData.basedOn}</div>
              )}
              {formData.draftDate && (
                <div className="preview-draft-date">{formData.draftDate}</div>
              )}
              <div className="preview-contact">
                {formData.contactInfo && (
                  <div className="preview-contact-info">{formData.contactInfo}</div>
                )}
                {formData.copyright && (
                  <div className="preview-copyright">{formData.copyright}</div>
                )}
              </div>
            </div>
          </div>

          <div className="title-page-form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Your screenplay title"
              />
            </div>

            <div className="form-group">
              <label>Title Size</label>
              <div className="font-size-options">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`font-size-btn ${formData.titleFontSize === size ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, titleFontSize: size }))}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="writtenBy">Credit Line</label>
              <input
                id="writtenBy"
                type="text"
                value={formData.writtenBy}
                onChange={(e) => handleChange('writtenBy', e.target.value)}
                placeholder="Written by"
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                id="author"
                type="text"
                value={formData.author}
                onChange={(e) => handleChange('author', e.target.value)}
                placeholder="Author name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="basedOn">Based On (optional)</label>
              <input
                id="basedOn"
                type="text"
                value={formData.basedOn}
                onChange={(e) => handleChange('basedOn', e.target.value)}
                placeholder='Based on the novel by...'
              />
            </div>

            <div className="form-group">
              <label htmlFor="draftDate">Draft Date (optional)</label>
              <input
                id="draftDate"
                type="text"
                value={formData.draftDate}
                onChange={(e) => handleChange('draftDate', e.target.value)}
                placeholder="First Draft - January 2026"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactInfo">Contact Info (optional)</label>
              <textarea
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => handleChange('contactInfo', e.target.value)}
                placeholder="Agent/Manager contact or personal contact"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="copyright">Copyright (optional)</label>
              <input
                id="copyright"
                type="text"
                value={formData.copyright}
                onChange={(e) => handleChange('copyright', e.target.value)}
                placeholder="© 2026 Your Name"
              />
            </div>
          </div>
        </div>

        <div className="title-page-footer">
          <button className="btn-secondary" onClick={handleClear}>
            Remove Title Page
          </button>
          <div className="footer-right">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              Save Title Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
