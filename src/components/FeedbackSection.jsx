import React, { useState, useEffect } from 'react';
import { db, rtdb } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, push } from 'firebase/database';
import { TRANSLATIONS } from '../translations';

export default function FeedbackSection({ lang = 'tr' }) {
  const t = TRANSLATIONS[lang]?.feedback || TRANSLATIONS.tr.feedback;

  const [name, setName] = useState('');
  const [category, setCategory] = useState(t.categories[0]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Update category when language changes if category is still default
  useEffect(() => {
    setCategory(t.categories[0]);
  }, [lang]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      setStatusMsg({ type: 'error', text: t.errorEmptyMsg });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    const payload = {
      name: name.trim() || t.defaultAnonymous,
      category: category,
      rating: Number(rating),
      message: message.trim(),
      createdAt: Date.now(),
      dateStr: new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    };

    let savedToFirebase = false;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB Timeout')), 3500)
      );

      await Promise.race([
        push(ref(rtdb, 'feedbacks'), payload),
        timeoutPromise
      ]);
      savedToFirebase = true;
    } catch (err) {
      console.warn('Realtime Database save timeout:', err);
    }

    try {
      addDoc(collection(db, 'feedbacks'), {
        ...payload,
        createdAt: serverTimestamp()
      }).catch(() => { });
    } catch (e) { }

    try {
      fetch('https://formsubmit.co/ajax/egemender@hotmail.com', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `🚨 [Portfolyo Geri Bildirim] ${payload.name} (${payload.rating}/5 Stars)`,
          _captcha: 'false',
          _template: 'table',
          "Gönderen İsmi / Rumuz": payload.name,
          "Kategori": payload.category,
          "Puan": `${payload.rating} / 5`,
          "Mesaj": payload.message,
          "Tarih": payload.dateStr
        })
      }).catch((err) => console.warn('Email warning:', err));
    } catch (e) {}

    setName('');
    setMessage('');
    setRating(5);
    setIsSubmitting(false);

    setStatusMsg({
      type: 'success',
      text: t.successMsg
    });

    setTimeout(() => setStatusMsg({ type: '', text: '' }), 6000);
  };

  return (
    <section id="feedback" className="mt-20 pt-10 border-t border-gray-900/80 text-center flex flex-col items-center justify-center">
      {/* Header Badge */}
      <div className="flex items-center justify-center space-x-3 mb-3">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#00ff66]/50"></span>
        <span className="px-3 py-1 text-xs font-mono text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/30 rounded-full tracking-wider uppercase flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></span>
          <span>{t.badge}</span>
        </span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#00ff66]/50"></span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 font-mono tracking-tight" style={{ color: '#ffffff' }}>
        {t.title}
      </h2>
      <p className="text-center text-gray-400 font-mono mt-3 max-w-2xl mx-auto px-4 leading-relaxed">
        {t.subtitle}
      </p>

      {/* Spacer */}
      <div style={{ height: '2rem' }}></div>

      {/* Form Container */}
      <div className="w-full max-w-2xl mx-auto bg-black/60 backdrop-blur-xl border border-gray-800 hover:border-[#00ff66]/40 p-6 sm:p-10 rounded-2xl shadow-2xl transition-all duration-300 relative group">
        <div className="absolute -top-3 left-6 bg-[#0a0a0a] px-3 text-[10px] font-mono text-[#00ff66] border border-[#00ff66]/30 rounded">
          FEEDBACK_FORM_INPUT
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-2">
                {t.nameLabel} <span className="text-gray-500">{t.nameOptional}</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all font-mono"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-2">
                {t.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all font-mono cursor-pointer"
              >
                {t.categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-950 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-gray-300">
                {t.ratingLabel}
              </label>
              <span className="text-xs font-mono text-[#00ff66]">
                {t.ratings[hoverRating || rating]}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 ${star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                        : 'text-gray-700 fill-gray-900'
                      } transition-colors duration-200`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.116.488-.415.871-.84.627l-4.708-2.73a.564.564 0 00-.573 0l-4.708 2.73c-.425.244-.956-.139-.84-.627l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.948.32-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">
              {t.messageLabel} <span className="text-red-400">*</span>
            </label>
            <textarea
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              required
              className="w-full bg-gray-950/80 border border-gray-800 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all font-mono resize-none"
            ></textarea>
          </div>

          {/* Status Message */}
          {statusMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs font-mono border ${statusMsg.type === 'error'
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66]'
                }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative group/btn overflow-hidden rounded-xl bg-gradient-to-r from-[#00ff66]/20 via-[#00ff66]/10 to-transparent p-0.5 font-mono text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,255,102,0.3)] disabled:opacity-50"
          >
            <div className="w-full bg-black/90 hover:bg-black/60 text-[#00ff66] hover:text-white py-3.5 px-4 rounded-[10px] flex items-center justify-center space-x-2 transition-colors duration-200">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-[#00ff66]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t.submitting}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{t.submitBtn}</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </section>
  );
}

