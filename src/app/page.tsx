/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Copy, PlusCircle, Trash, Edit2, UploadCloud, CheckCircle2, Share2 } from "lucide-react";

interface Item {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [justGeneratedLink, setJustGeneratedLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Delete State
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewURL(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image from backend");
      }
      
      if (data.success) {
        // Re-fetch from DB to ensure we have the latest state (avoids Vercel KV race conditions)
        await fetchItems();
        setJustGeneratedLink(data.shareUrl);
        // Reset form including native file input
        setFile(null);
        setPreviewURL(null);
        setTitle("");
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      alert((error as Error).message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/items/${itemToDelete}`, { method: "DELETE" });
      
      if (!res.ok) {
        let errorMsg = "Failed to delete item";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        alert(errorMsg);
        setIsDeleting(false);
        return;
      }
      
      if (justGeneratedLink?.includes(itemToDelete)) {
        setJustGeneratedLink(null);
      }
      setItemToDelete(null);
      // Re-fetch from DB to ensure we have the latest state
      await fetchItems();
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to connect or delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      const data = await res.json();
      
      if (data.success) {
        setEditingId(null);
        // Re-fetch to sync state from DB
        await fetchItems();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleShare = async (item: Item, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description || item.title,
          url,
        });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      // Desktop fallback: just copy
      copyToClipboard(url);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-neutral-800 pb-6">
          <div className="shrink-0">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ImageHost logo">
              <rect width="48" height="48" rx="18" fill="url(#ih-gradient)" />
              <text
                x="50%"
                y="52%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="17"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.5"
              >IH</text>
              <defs>
                <linearGradient id="ih-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            ImageHost
          </h1>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12">
          
          {/* Left Panel: Upload Form */}
          <div className="xl:col-span-4 lg:col-span-5 order-first xl:order-none">
            <div className="bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800 p-5 sm:p-6 xl:sticky xl:top-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
                <PlusCircle className="w-5 h-5 text-indigo-400" aria-hidden="true" /> 
                Create New Share Link
              </h2>

              <form onSubmit={handleUpload} className="space-y-6">
                {/* Image Upload Area */}
                <div>
                  <span className="block text-sm font-semibold text-neutral-300 mb-2" id="image-upload-label">Image</span>
                  <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-56 border-2 border-neutral-700 border-dashed rounded-xl cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 hover:border-indigo-500/50 transition-all relative overflow-hidden group focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-neutral-900 focus-within:ring-indigo-500 focus-within:border-indigo-500 outline-none">
                    {previewURL ? (
                      <img src={previewURL} alt="Preview of uploaded image" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-neutral-400 group-hover:text-indigo-400 transition-colors">
                        <UploadCloud className="w-10 h-10 mb-4" aria-hidden="true" />
                        <span className="text-base font-medium text-neutral-200">Click to upload image</span>
                        <span className="text-sm mt-2 text-neutral-500">SVG, PNG, JPG or GIF</span>
                      </div>
                    )}
                    <input ref={fileInputRef} id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} required aria-labelledby="image-upload-label" />
                  </label>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-neutral-300 mb-2">Title</label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 px-4 py-3 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="E.g. Amazing Sunset View"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-neutral-300 mb-2">Description</label>
                  <textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 px-4 py-3 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Short summary for the OG preview..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !file || !title}
                  className="w-full bg-indigo-600 text-white rounded-xl py-3.5 px-4 font-semibold hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-900/20"
                >
                  {isUploading ? "Uploading & Generating..." : "Create Share Link"}
                </button>
              </form>

              {/* Success Result Box */}
              {justGeneratedLink && (
                <div className="mt-8 bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    Link Generated Successfully!
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input 
                      readOnly 
                      value={justGeneratedLink}
                      aria-label="Generated share link"
                      className="flex-1 bg-neutral-950 border border-emerald-800/50 rounded-lg py-2.5 px-3 text-sm text-neutral-200 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-emerald-900 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => copyToClipboard(justGeneratedLink)}
                      className="flex items-center justify-center p-2.5 bg-neutral-900 border border-emerald-800/50 rounded-lg hover:bg-neutral-800 hover:text-emerald-300 transition-colors text-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-emerald-900 focus:ring-emerald-500"
                      title="Copy Link"
                      aria-label="Copy Link"
                    >
                      {copiedLink === justGeneratedLink ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
                    💡 <span className="text-neutral-400">For WhatsApp preview:</span> copy the link and <strong className="text-neutral-300">paste it manually</strong> in your chat — WhatsApp only shows image previews for pasted links, not shared ones.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Gallery */}
          <div className="xl:col-span-8 lg:col-span-7">
            <h2 className="text-xl font-semibold mb-6 flex items-center justify-between text-white border-b border-neutral-800 pb-4">
              <span>Your Library</span>
              <span className="text-sm font-medium text-neutral-300 bg-neutral-800 px-3.5 py-1.5 rounded-full">{items.length} items</span>
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-800 h-[340px] animate-pulse">
                     <div className="w-full h-48 bg-neutral-800 rounded-xl mb-5"></div>
                     <div className="h-5 bg-neutral-800 rounded w-3/4 mb-3"></div>
                     <div className="h-4 bg-neutral-800 rounded w-1/2 mb-4"></div>
                     <div className="h-8 bg-neutral-800 rounded w-full mt-auto"></div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-neutral-900/50 border-2 border-dashed border-neutral-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="bg-neutral-800 p-5 rounded-full mb-5">
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect width="48" height="48" rx="18" fill="#404040" />
                    <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="#737373" fontSize="17" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.5">IH</text>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No images yet</h3>
                <p className="text-neutral-400 max-w-sm">Upload your first image on the left panel to generate an Open Graph share link.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map((item) => {
                  const itemUrl = typeof window !== 'undefined' 
                    ? `${window.location.origin}/og/${item.id}` 
                    : `/og/${item.id}`;
                  const isEditing = editingId === item.id;
                  
                  return (
                    <div key={item.id} className="bg-neutral-900 rounded-2xl shadow-xl border border-neutral-800 overflow-hidden flex flex-col group hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/10">
                      <div className="h-48 sm:h-56 relative overflow-hidden bg-neutral-800 flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.broken-img-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'broken-img-placeholder flex flex-col items-center justify-center w-full h-full gap-2 text-neutral-600';
                              placeholder.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg><span style="font-size:0.75rem">Image unavailable</span>`;
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="p-5 sm:p-6 flex-1 flex flex-col">
                        {isEditing ? (
                          <div className="space-y-4 mb-4 flex-1 flex flex-col">
                            <div>
                                <label htmlFor={`edit-title-${item.id}`} className="sr-only">Edit title</label>
                                <input
                                id={`edit-title-${item.id}`}
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full text-base font-semibold rounded-lg bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 px-3 py-2 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 transition-all"
                                placeholder="Title"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor={`edit-desc-${item.id}`} className="sr-only">Edit description</label>
                                <textarea
                                id={`edit-desc-${item.id}`}
                                value={editDescription}
                                onChange={e => setEditDescription(e.target.value)}
                                className="w-full h-full min-h-[5rem] text-sm rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-300 placeholder-neutral-500 px-3 py-2 outline-none resize-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 transition-all"
                                placeholder="Description"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button onClick={() => saveEdit(item.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">Save</button>
                              <button onClick={() => setEditingId(null)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-neutral-500 text-neutral-200 font-medium px-4 py-2 rounded-lg transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-lg text-white line-clamp-1 mb-1.5">{item.title}</h3>
                            <div className="text-xs text-neutral-500 mb-3 font-medium">
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </div>
                            <p className="text-sm text-neutral-300 line-clamp-2 mb-6 flex-1 leading-relaxed">{item.description}</p>
                            
                            <div className="flex items-center justify-between mt-auto pt-5 border-t border-neutral-800/80">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => handleShare(item, itemUrl)}
                                  aria-label={`Share ${item.title}`}
                                  className="flex items-center justify-center gap-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500"
                                >
                                  <Share2 className="w-4 h-4" aria-hidden="true" /> Share
                                </button>
                                <button
                                  onClick={() => copyToClipboard(itemUrl)}
                                  aria-label={`Copy link for ${item.title}`}
                                  className="flex items-center justify-center gap-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500"
                                >
                                  {copiedLink === itemUrl ? (
                                    <><CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true"/> <span className="text-emerald-400">Copied!</span></>
                                  ) : (
                                    <><Copy className="w-4 h-4" aria-hidden="true"/> Copy</>
                                  )}
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <button aria-label={`Edit ${item.title}`} onClick={() => startEdit(item)} className="p-2 text-neutral-400 bg-neutral-900 hover:bg-neutral-800 hover:text-indigo-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-indigo-500">
                                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                                <button aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item.id)} className="p-2 text-neutral-400 bg-neutral-900 hover:bg-neutral-800 hover:text-red-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-red-500">
                                  <Trash className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <Trash className="w-6 h-6 text-red-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Share Link</h3>
              <p className="text-neutral-400 text-sm">
                Are you sure you want to delete this link? This action cannot be undone and the Open Graph preview will no longer work.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-neutral-800 text-white hover:bg-neutral-700 transition-colors focus:ring-1 focus:ring-offset-1 focus:ring-offset-neutral-900 focus:ring-neutral-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors focus:ring-1 focus:ring-offset-1 focus:ring-offset-neutral-900 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

