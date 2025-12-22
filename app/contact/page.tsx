'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // Simple form submission - you can integrate with email service later
    setTimeout(() => {
      alert('Thank you for your message! We will get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitting(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/abrlogo.png"
              alt="ABR TECH"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-gray-400 text-lg">Get in touch with ABR Technologies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's this about?"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Your message..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <a href="mailto:info@abrtech.com" className="text-gray-400 hover:text-blue-500 transition-colors">
                      info@abrtech.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Phone</h3>
                    <a href="tel:+2341234567890" className="text-gray-400 hover:text-blue-500 transition-colors">
                      +234 (0) 123 456 7890
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Address</h3>
                    <p className="text-gray-400">
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-gray-900 rounded-xl p-6 md:p-8 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Follow Us</h2>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.facebook.com/abrtechltd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-black rounded-lg border border-white/10 hover:border-blue-500 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                </a>
                <a
                  href="https://www.instagram.com/abrtechltd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-black rounded-lg border border-white/10 hover:border-blue-500 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                </a>
                <a
                  href="https://www.x.com/abrtechltd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-black rounded-lg border border-white/10 hover:border-blue-500 transition-colors"
                >
                  <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-black rounded-lg border border-white/10 hover:border-blue-500 transition-colors"
                >
                  <Youtube className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

