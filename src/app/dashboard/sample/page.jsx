'use client';

import { useState, useEffect } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import { toast } from 'react-hot-toast';

export default function SampleEditor() {
  const [title, setTitle] = useState('');
  const [editorData, setEditorData] = useState('');
  const { quill, quillRef: quillContainerRef } = useQuill({
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
    },
    formats: [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'align',
      'link', 'image', 'code-block',
      'color', 'background',
    ],
    placeholder: 'Write your content here...',
  });

  // Image upload handler
  const imageHandler = () => {
    if (!quill) {
      console.warn('Image handler blocked: quill unavailable');
      return;
    }
    console.log('Creating input element for image upload');
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg,image/png,image/gif');
    input.click();

    input.onchange = async () => {
      console.log('File selected:', input.files[0]);
      const file = input.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append('image', file);
          const response = await fetch('http://localhost:3000/api/documents/upload-image', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error('Image upload failed');
          const { url } = await response.json();
          console.log('Image uploaded, URL:', url);
          const range = quill.getSelection(true) || { index: quill.getLength() };
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1);
          console.log('Editor content after image insertion:', quill.root.innerHTML);
          setEditorData(quill.root.innerHTML);
          toast.success('Image uploaded successfully!');
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error('Failed to upload image');
        }
      }
    };
  };

  // Sync editor content with state
  useEffect(() => {
    if (quill) {
      console.log('Quill editor initialized:', quill);
      const toolbar = quill.getModule('toolbar');
      toolbar.addHandler('image', imageHandler);

      quill.on('text-change', () => {
        const content = quill.root.innerHTML;
        console.log('Quill content changed:', content);
        setEditorData(content);
      });

      quill.setContents([{ insert: '' }]);
      quill.root.style.minHeight = '24rem';
      quill.root.style.height = 'auto';
    }
  }, [quill]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = quill ? quill.root.innerHTML : editorData;
    console.log('Form submitted:', { title, content });
    if (content === '<p><br></p>') {
      toast.error('Content cannot be empty');
      return;
    }
    // Example: Send to backend
    // await fetch('/api/save-content', { method: 'POST', body: JSON.stringify({ title, content }) });
    toast.success('Content saved successfully!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Content</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="editor-container border border-gray-300 rounded-md">
          <div
            ref={quillContainerRef}
            className="min-h-[24rem] bg-white"
            style={{ minHeight: '24rem' }}
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Save Content
        </button>
      </form>
    </div>
  );
}