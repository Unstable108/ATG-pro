// pages/feedback.js
import { useState } from 'react'
import TopBar from '../components/TopBar'

const CONTRIBUTORS = [
  { name: "Senior Brother Léo", role: "Raw Source Provider", desc: "For venturing into the chaotic void to bring us raw scriptures." },
  { name: "Daoist Reader Optayy", role: "Community Pillar", desc: "For moderating the discussion pavilion with an iron fist." },
  { name: "God slayer", role: "Translation Editor", desc: "For polishing the Dao of English and fixing sect terminology." },
]

export default function Feedback() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'General Feedback',  // Matches first option
    message: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.message.trim()) return
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Transmission disrupted by heavenly tribulation.')
      }
      setSubmitted(true)
      setFormData({ name: '', email: '', type: 'General Feedback', message: '' })
    } catch (err) {
      setError(err.message)
    }
    setIsSubmitting(false)
  }

  return (
    <>
      <TopBar />
      <div className="min-h-screen pt-12 bg-dark-bg">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-fadeIn px-4 overflow-y-auto">  {/* Added overflow + responsive space */}
          {/* Introduction */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Sect Support & Hall of Fame</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Encountered a demonic bug in the system? Wish to offer tribute or suggestions for the sect's growth?
              Transmit your spirit message below.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">  {/* Smaller gap on mobile */}
            {/* Feedback Form */}
            <div className="bg-dark-card rounded-xl border border-dark-border p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Transmit Message
              </h2>
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center space-y-4 bg-brand-900/10 rounded-lg border border-brand-500/30 p-6">  {/* Removed h-64 */}
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Transmission Successful</h3>
                  <p className="text-gray-400 text-sm">Your message has been received by the sect elders. We will meditate on your feedback.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">{error}</div>}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Dao Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                        placeholder="Junior Disciple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Communication Talisman (Email)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                        placeholder="cultivator@sect.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Message Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                      >
                        <option value="General Feedback">General Feedback</option>
                        <option value="Report Bug">Report Bug</option>
                        <option value="Broken Chapter">Broken Chapter</option>
                        <option value="Translation Issue">Translation Issue</option>
                        <option value="Feature Request">Feature Request</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={4}
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
                        placeholder="Describe the issue or suggestion..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg shadow-brand-900/50 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Transmitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
            {/* Hall of Fame / Acknowledgments */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-900/50 to-brand-900/50 rounded-xl border border-brand-500/30 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Hall of Merit
                </h2>
                <p className="text-sm text-gray-300 mb-6">
                  The Celestial Novels platform would not exist without the contributions of these illustrious seniors.
                  May their cultivation journey be smooth and devoid of heart demons.
                </p>
                <div className="space-y-3">
                  {CONTRIBUTORS.map((c, i) => (
                    <div key={i} className="bg-dark-bg/60 rounded-lg p-3 flex items-start gap-3 border border-dark-border hover:border-brand-500/50 transition-colors">
                      <div className="mt-1 w-2 h-2 rounded-full bg-brand-400 shadow shadow-brand-400/50"></div>
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-xs font-semibold text-brand-300 mb-0.5">{c.role}</div>
                        <div className="text-xs text-gray-500 italic">"{c.desc}"</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}