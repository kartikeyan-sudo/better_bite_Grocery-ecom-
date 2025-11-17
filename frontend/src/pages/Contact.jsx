import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import apiFetch from '../utils/api'
import '../styles/Contact.css'

export default function Contact() {
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContact()
  }, [])

  const loadContact = async () => {
    try {
      const data = await apiFetch('/api/contact')
      setContact(data)
    } catch (err) {
      console.error('Failed to load contact info', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="contact-page">
        <div className="contact-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="contact-page">
      <header className="contact-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-btn">← Back</Link>
          <h1>Contact Us</h1>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄
          </button>
        </div>
      </header>

      <main className="contact-container">
        <div className="contact-grid">
          {/* Contact Information */}
          <div className="contact-info">
            <div className="info-card">
              <div className="info-icon">🏢</div>
              <h2>{contact?.businessName || 'Better Bite'}</h2>
              {contact?.description && (
                <p className="business-desc">{contact.description}</p>
              )}
            </div>

            <div className="info-card">
              <div className="info-icon">📍</div>
              <h3>Visit Us</h3>
              <p>{contact?.address || '123 Market Street'}</p>
              <p>
                {contact?.city || 'Mumbai'}, {contact?.state || 'Maharashtra'} {contact?.pincode || '400001'}
              </p>
              <p>{contact?.country || 'India'}</p>
              {contact?.googleMapUrl && (
                <a 
                  href={contact.googleMapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  📍 View on Google Maps
                </a>
              )}
            </div>

            <div className="info-card">
              <div className="info-icon">📞</div>
              <h3>Call Us</h3>
              <p>
                <strong>Phone:</strong> <a href={`tel:${contact?.phone}`}>{contact?.phone || '+91 98765 43210'}</a>
              </p>
              {contact?.alternatePhone && (
                <p>
                  <strong>Alternate:</strong> <a href={`tel:${contact.alternatePhone}`}>{contact.alternatePhone}</a>
                </p>
              )}
              {contact?.whatsapp && (
                <a 
                  href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  💬 Chat on WhatsApp
                </a>
              )}
            </div>

            <div className="info-card">
              <div className="info-icon">✉️</div>
              <h3>Email Us</h3>
              <p>
                <a href={`mailto:${contact?.email}`}>{contact?.email || 'info@betterbite.com'}</a>
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">🕐</div>
              <h3>Business Hours</h3>
              <div className="hours-list">
                <div className="hours-row">
                  <span>Monday - Friday</span>
                  <span>{contact?.mondayToFriday || '9:00 AM - 8:00 PM'}</span>
                </div>
                <div className="hours-row">
                  <span>Saturday</span>
                  <span>{contact?.saturday || '9:00 AM - 6:00 PM'}</span>
                </div>
                <div className="hours-row">
                  <span>Sunday</span>
                  <span>{contact?.sunday || '10:00 AM - 4:00 PM'}</span>
                </div>
              </div>
            </div>

            {(contact?.facebook || contact?.instagram || contact?.twitter) && (
              <div className="info-card">
                <div className="info-icon">🌐</div>
                <h3>Follow Us</h3>
                <div className="social-links">
                  {contact.facebook && (
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="social-btn facebook">
                      Facebook
                    </a>
                  )}
                  {contact.instagram && (
                    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="social-btn instagram">
                      Instagram
                    </a>
                  )}
                  {contact.twitter && (
                    <a href={contact.twitter} target="_blank" rel="noopener noreferrer" className="social-btn twitter">
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map or Image */}
          {contact?.googleMapUrl && (
            <div className="contact-map">
              <iframe
                src={contact.googleMapUrl.replace('/maps/', '/maps/embed/')}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
