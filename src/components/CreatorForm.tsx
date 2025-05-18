'use client';

import { useState } from 'react';
import axios from 'axios';

const categories = ['News', 'Music', 'Gaming', 'Education'];

export default function CreatorForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    channel: '',
    category: '',
    link: '',
    description: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('/api/waitlist', formData);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        channel: '',
        category: '',
        link: '',
        description: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-[#1E1E1E] rounded-lg border border-[rgba(255,255,255,0.05)]">
        <p className="text-2xl font-semibold text-white">🎉 Congrats! You're on the waitlist. We'll get in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] placeholder-gray-500"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] placeholder-gray-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-gray-300">Channel Name</label>
          <input
            type="text"
            id="channel"
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] placeholder-gray-500"
            placeholder="Enter your channel name"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
          >
            <option value="" className="bg-[#141414]">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category} className="bg-[#141414]">{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-300">Sample Content Link</label>
          <input
            type="url"
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] placeholder-gray-500"
            placeholder="Enter a link to your content"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">Channel Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white px-4 py-2.5 focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] placeholder-gray-500"
            placeholder="Tell us about your channel"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-[#E50914] text-white font-semibold rounded-lg shadow-lg hover:bg-[#B81D24] focus:outline-none focus:ring-2 focus:ring-[#E50914] focus:ring-opacity-50 transition-all duration-200"
        >
          Join Waitlist
        </button>
      </div>
    </form>
  );
} 