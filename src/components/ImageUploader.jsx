import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { validateImageFile, formatFileSize, fileToBase64 } from "../services/imageStorageService.js";

export default function ImageUploader({
  label = "Event Poster / Cover Image",
  currentImage = null,
  onImageSelected,
  onImageRemoved,
  allowGallery = false,
  galleryImages = [],
  onGalleryUpdated,
}) {
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [fileMeta, setFileMeta] = useState(null);

  const processFile = async (file) => {
    setValidationError("");
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setFileMeta({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      });
      if (onImageSelected) {
        onImageSelected(base64, file);
      }
    } catch (err) {
      setValidationError("Failed to read image file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleGalleryChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = [...galleryImages];
      for (const file of Array.from(e.target.files)) {
        const validation = validateImageFile(file);
        if (validation.valid) {
          const base64 = await fileToBase64(file);
          newImages.push(base64);
        }
      }
      if (onGalleryUpdated) {
        onGalleryUpdated(newImages);
      }
    }
  };

  const removeGalleryImage = (index) => {
    const updated = galleryImages.filter((_, i) => i !== index);
    if (onGalleryUpdated) {
      onGalleryUpdated(updated);
    }
  };

  return (
    <div className="cc-uploader-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label className="relay-field-label" style={{ marginBottom: 0 }}>
          {label} <span style={{ color: "var(--primary)" }}>*</span>
        </label>
        <span style={{ fontSize: "11px", color: "var(--mute)" }}>
          JPG, PNG, or WEBP up to 5MB
        </span>
      </div>

      {validationError && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--coral)", fontSize: "12px", background: "var(--coral-light)", padding: "8px 12px", borderRadius: "8px" }}>
          <AlertCircle size={15} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleGalleryChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        style={{ display: "none" }}
      />

      {/* Primary Poster View */}
      {currentImage ? (
        <div className="cc-preview-card">
          <img src={currentImage} alt="Event Cover Preview" className="cc-preview-image" />
          <div className="cc-preview-info">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={15} style={{ color: "var(--teal)" }} />
              <div className="cc-preview-meta">
                {fileMeta?.name || "Uploaded Event Poster"} {fileMeta?.size ? `(${fileMeta.size})` : ""}
              </div>
            </div>
            <div className="cc-preview-actions">
              <button
                type="button"
                className="cc-preview-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Replace image"
              >
                <RefreshCw size={15} />
              </button>
              <button
                type="button"
                className="cc-preview-btn"
                onClick={() => {
                  setFileMeta(null);
                  if (onImageRemoved) onImageRemoved();
                }}
                title="Remove image"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`cc-dropzone ${isDragOver ? "dragover" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="cc-dropzone-icon">
            <UploadCloud size={24} />
          </div>
          <div className="cc-dropzone-title">
            Drag and drop your event poster here
          </div>
          <div className="cc-dropzone-sub">
            High quality banner photos make your campus event stand out
          </div>
          <button type="button" className="cc-browse-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <ImageIcon size={14} /> Browse Files
          </button>
        </div>
      )}

      {/* Cloud-Native AWS S3 Architecture Notice */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--mute)", marginTop: "2px" }}>
        <ShieldCheck size={13} style={{ color: "var(--primary)" }} />
        <span>Cloud-native ready: Integrated with client-side preview & modular AWS S3 storage</span>
      </div>

      {/* Optional Gallery Upload */}
      {allowGallery && (
        <div style={{ marginTop: "14px", borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="relay-field-label" style={{ marginBottom: 0 }}>
              Additional Event Gallery (Optional)
            </label>
            <button
              type="button"
              className="relay-btn-ghost relay-btn-sm"
              onClick={() => galleryInputRef.current?.click()}
              style={{ fontSize: "11.5px", padding: "4px 10px" }}
            >
              + Add Photos
            </button>
          </div>

          {galleryImages.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "8px" }}>
              {galleryImages.map((img, idx) => (
                <div key={idx} style={{ position: "relative", width: "100%", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={img} alt={`Gallery item ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--mute)", fontStyle: "italic" }}>
              No extra gallery photos added yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

